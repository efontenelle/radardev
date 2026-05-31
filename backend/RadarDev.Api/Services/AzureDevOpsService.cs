using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using RadarDev.Api.Configuration;
using RadarDev.Api.Models.Raw;

namespace RadarDev.Api.Services;

public interface IAzureDevOpsService
{
    Task<IEnumerable<int>> QueryByWiqlAsync(DateTime from, DateTime to);
    Task<IEnumerable<WorkItemRaw>> GetWorkItemsBatchAsync(IEnumerable<int> ids);
    Task<IEnumerable<WorkItemUpdateRaw>> GetWorkItemUpdatesAsync(int workItemId);
    Task<BoardRaw> GetBoardAsync();
}

public class AzureDevOpsService : IAzureDevOpsService
{
    private readonly HttpClient _httpClient;
    private readonly AzureDevOpsConfig _config;
    private readonly ILogger<AzureDevOpsService> _logger;

    public AzureDevOpsService(IHttpClientFactory factory, IOptions<AzureDevOpsConfig> options, ILogger<AzureDevOpsService> logger)
    {
        _logger = logger;
        _config = options.Value;
        _httpClient = factory.CreateClient("AzureDevOps");

        var encoded = Convert.ToBase64String(Encoding.ASCII.GetBytes($":{_config.Pat}"));
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", encoded);
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<IEnumerable<int>> QueryByWiqlAsync(DateTime from, DateTime to)
    {
        var url = $"https://dev.azure.com/{_config.Organization}/{_config.Project}/_apis/wit/wiql?api-version=7.1";

        var query = $"SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = '{_config.Project}' AND [System.ChangedDate] >= '{from:yyyy-MM-dd}' AND [System.ChangedDate] <= '{to:yyyy-MM-dd}'";
        var body = JsonSerializer.Serialize(new { query });

        using var content = new StringContent(body, Encoding.UTF8, "application/json");
        var response = await _httpClient.PostAsync(url, content);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<WiqlResultRaw>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        return result?.WorkItems.Select(w => w.Id) ?? [];
    }

    public async Task<IEnumerable<WorkItemRaw>> GetWorkItemsBatchAsync(IEnumerable<int> ids)
    {
        var allItems = new List<WorkItemRaw>();
        var idList = ids.ToList();
        const int batchSize = 200;
        var fields = "System.Id,System.Title,System.WorkItemType,System.State,System.CreatedDate,System.ChangedDate";

        for (int i = 0; i < idList.Count; i += batchSize)
        {
            var batch = idList.Skip(i).Take(batchSize);
            var idsParam = string.Join(",", batch);
            var url = $"https://dev.azure.com/{_config.Organization}/{_config.Project}/_apis/wit/workitems?ids={idsParam}&fields={fields}&api-version=7.1";

            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<WorkItemBatchResultRaw>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            if (result?.Value != null)
                allItems.AddRange(result.Value);
        }

        return allItems;
    }

    public async Task<IEnumerable<WorkItemUpdateRaw>> GetWorkItemUpdatesAsync(int workItemId)
    {
        var url = $"https://dev.azure.com/{_config.Organization}/{_config.Project}/_apis/wit/workitems/{workItemId}/updates?api-version=7.1";

        var response = await _httpClient.GetAsync(url);
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<WorkItemUpdatesResultRaw>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        return result?.Value ?? [];
    }

    public async Task<BoardRaw> GetBoardAsync()
    {
        var team = Uri.EscapeDataString(_config.ResolvedTeamName);
        var board = Uri.EscapeDataString(_config.BoardName);
        var url = $"https://dev.azure.com/{_config.Organization}/{_config.Project}/{team}/_apis/work/boards/{board}?api-version=7.1";

        _logger.LogInformation("GetBoardAsync URL: {Url}", url);

        var response = await _httpClient.GetAsync(url);
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<BoardRaw>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        return result ?? new BoardRaw();
    }
}


