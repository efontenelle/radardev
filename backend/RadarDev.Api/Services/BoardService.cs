using RadarDev.Api.Models.Dtos;

namespace RadarDev.Api.Services;

public interface IBoardService
{
    Task<BoardDto> GetBoardAsync();
}

public class BoardService : IBoardService
{
    private readonly IAzureDevOpsService _azureDevOps;

    public BoardService(IAzureDevOpsService azureDevOps)
    {
        _azureDevOps = azureDevOps;
    }

    public async Task<BoardDto> GetBoardAsync()
    {
        var raw = await _azureDevOps.GetBoardAsync();

        var columnTypeOrder = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        {
            ["incoming"] = 0,
            ["inProgress"] = 1,
            ["outgoing"] = 2
        };

        var columns = raw.Columns
            .OrderBy(c => columnTypeOrder.TryGetValue(c.ColumnType, out var order) ? order : 1)
            .Select((c, index) => new BoardColumnDto(
                c.Name,
                index,
                string.Join(", ", c.StateMappings.Values)
            ));

        var lanes = raw.Rows.Select(r => r.Name);

        return new BoardDto(raw.Name, columns, lanes);
    }
}
