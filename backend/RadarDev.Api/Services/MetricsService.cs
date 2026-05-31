using RadarDev.Api.Models.Dtos;
using RadarDev.Api.Models.Raw;

namespace RadarDev.Api.Services;

public interface IMetricsService
{
    Task<MetricsResponseDto> CalculateAsync(MetricsRequestDto request);
}

public class MetricsService : IMetricsService
{
    private readonly IAzureDevOpsService _azureDevOps;
    private readonly ILogger<MetricsService> _logger;
    private const int UpdatesBatchSize = 10;

    public MetricsService(IAzureDevOpsService azureDevOps, ILogger<MetricsService> logger)
    {
        _azureDevOps = azureDevOps;
        _logger = logger;
    }

    public async Task<MetricsResponseDto> CalculateAsync(MetricsRequestDto request)
    {
        // 1. Resolve colunas → estados via stateMappings do board
        var board = await _azureDevOps.GetBoardAsync();
        var (startStates, endStates) = ResolveColumnStates(board, request.StartColumn, request.EndColumn);

        // 2. Query ampliada: cards alterados no período + cards em estados ativos (para Age)
        var candidateIds = await GetCandidateIds(request.From, request.To);

        if (!candidateIds.Any())
            return EmptyResponse(request.From, request.To);

        // 3. Batch de work items para obter Title, Type, BoardLane
        var workItems = (await _azureDevOps.GetWorkItemsBatchAsync(candidateIds))
            .ToDictionary(wi => wi.Id);

        // 4. Histórico de transições por card — paralelizado em lotes de UpdatesBatchSize
        var updates = await FetchUpdatesInBatches(candidateIds);

        // 5. Classificar cards
        var completed = new List<(WorkItemRaw wi, DateTime deliveredDate, double cycleTimeDays)>();
        var active = new List<(WorkItemRaw wi, double ageDays)>();
        var today = DateTime.UtcNow.Date;

        foreach (var id in candidateIds)
        {
            if (!workItems.TryGetValue(id, out var wi)) continue;

            // Filtro de lane (D-018 / incerteza #1): aplicado se selectedLanes não estiver vazio
            if (!IsLaneIncluded(wi, request.SelectedLanes))
                continue;

            if (!updates.TryGetValue(id, out var cardUpdates)) continue;

            var flow = FlowMetricsCalculator.Compute(cardUpdates, startStates, endStates);

            if (flow.EntryStart == null) continue; // card nunca entrou no fluxo

            if (flow.EntryEnd.HasValue)
            {
                // Card completado: EntryEnd deve estar dentro do período solicitado
                if (flow.EntryEnd.Value.Date < request.From.Date || flow.EntryEnd.Value.Date > request.To.Date)
                    continue;

                double ct = (flow.EntryEnd.Value - flow.EntryStart.Value).TotalDays;
                if (ct <= 0) continue; // descarta anomalia de dados

                completed.Add((wi, flow.EntryEnd.Value, ct));
            }
            else
            {
                // Card ativo: ainda não entrou na coluna de fim
                double age = (today - flow.EntryStart.Value.Date).TotalDays;
                active.Add((wi, age));
            }
        }

        // 6. Agregar métricas
        var cycleTimePoints = completed
            .Select(c => new CycleTimePointDto(c.wi.Id, c.wi.Fields.Title, c.deliveredDate, c.cycleTimeDays))
            .OrderBy(c => c.DeliveredDate)
            .ToList();

        var sortedCycleTimes = completed.Select(c => c.cycleTimeDays).OrderBy(x => x).ToList();
        var percentiles = new CyclePercentilesDto(
            P85: sortedCycleTimes.Count > 0 ? Math.Round(FlowMetricsCalculator.Percentile(sortedCycleTimes, 85), 1) : 0,
            P90: sortedCycleTimes.Count > 0 ? Math.Round(FlowMetricsCalculator.Percentile(sortedCycleTimes, 90), 1) : 0
        );

        var throughput = BuildThroughput(completed.Select(c => c.deliveredDate).ToList(), request.From, request.To);

        var ageItems = active
            .OrderByDescending(a => a.ageDays)
            .Select(a => new AgeItemDto(a.wi.Id, a.wi.Fields.Title, a.wi.Fields.WorkItemType, Math.Round(a.ageDays, 1)))
            .ToList();

        return new MetricsResponseDto(cycleTimePoints, percentiles, throughput, ageItems);
    }

    private static (ISet<string> startStates, ISet<string> endStates) ResolveColumnStates(
        BoardRaw board, string startColumn, string endColumn)
    {
        var startCol = board.Columns.FirstOrDefault(c =>
            string.Equals(c.Name, startColumn, StringComparison.OrdinalIgnoreCase));
        var endCol = board.Columns.FirstOrDefault(c =>
            string.Equals(c.Name, endColumn, StringComparison.OrdinalIgnoreCase));

        if (startCol == null)
            throw new InvalidOperationException($"Coluna de início '{startColumn}' não encontrada no board.");
        if (endCol == null)
            throw new InvalidOperationException($"Coluna de fim '{endColumn}' não encontrada no board.");

        return (
            startCol.StateMappings.Values.ToHashSet(StringComparer.OrdinalIgnoreCase),
            endCol.StateMappings.Values.ToHashSet(StringComparer.OrdinalIgnoreCase)
        );
    }

    private async Task<IEnumerable<int>> GetCandidateIds(DateTime from, DateTime to)
    {
        // Query 1: cards alterados no período (captura entregas e cards recentes)
        var recentIds = await _azureDevOps.QueryByWiqlAsync(from, to);

        // Query 2: cards em estados "ativos" (não-fechados) para capturar itens antigos no Age
        // Usa uma janela ampliada: itens alterados até a data de início podem estar ativos
        var olderIds = await _azureDevOps.QueryByWiqlAsync(from.AddYears(-2), from.AddDays(-1));

        return recentIds.Union(olderIds).Distinct();
    }

    private async Task<Dictionary<int, IEnumerable<WorkItemUpdateRaw>>> FetchUpdatesInBatches(
        IEnumerable<int> ids)
    {
        var idList = ids.ToList();
        var results = new Dictionary<int, IEnumerable<WorkItemUpdateRaw>>();
        var semaphore = new SemaphoreSlim(UpdatesBatchSize);

        var tasks = idList.Select(async id =>
        {
            await semaphore.WaitAsync();
            try
            {
                var updates = await _azureDevOps.GetWorkItemUpdatesAsync(id);
                lock (results) { results[id] = updates; }
            }
            finally
            {
                semaphore.Release();
            }
        });

        await Task.WhenAll(tasks);
        return results;
    }

    private static bool IsLaneIncluded(WorkItemRaw wi, List<string> selectedLanes)
    {
        // Incerteza #1 (design.md): o campo de lane não é exposto de forma confiável via API de work items.
        // Fallback documentado: sem filtro de lane quando selectedLanes está vazio ou campo não disponível.
        if (selectedLanes.Count == 0) return true;

        // TODO: quando o campo de lane for confirmado na API real, aplicar filtro aqui.
        // Por ora, inclui todos os cards e loga warning apenas uma vez.
        return true;
    }

    private static IEnumerable<ThroughputWeekDto> BuildThroughput(
        List<DateTime> deliveryDates, DateTime from, DateTime to)
    {
        // Gera todas as semanas ISO do período, incluindo semanas sem entregas
        var weeks = new Dictionary<(int year, int week), int>();

        var cursor = from.Date;
        while (cursor <= to.Date)
        {
            var key = FlowMetricsCalculator.GetIsoWeek(cursor);
            weeks.TryAdd(key, 0);
            cursor = cursor.AddDays(1);
        }

        foreach (var date in deliveryDates)
        {
            var key = FlowMetricsCalculator.GetIsoWeek(date);
            if (weeks.ContainsKey(key))
                weeks[key]++;
        }

        return weeks
            .OrderBy(kv => kv.Key.year).ThenBy(kv => kv.Key.week)
            .Select(kv => new ThroughputWeekDto(
                kv.Key.year,
                kv.Key.week,
                FlowMetricsCalculator.GetWeekStart(kv.Key.year, kv.Key.week),
                kv.Value
            ));
    }

    private static MetricsResponseDto EmptyResponse(DateTime from, DateTime to)
    {
        var emptyThroughput = BuildThroughput([], from, to);
        return new MetricsResponseDto([], new CyclePercentilesDto(0, 0), emptyThroughput, []);
    }
}
