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

    public AzureDevOpsService(IHttpClientFactory factory, IOptions<AzureDevOpsConfig> options)
    {
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

    public Task<IEnumerable<WorkItemRaw>> GetWorkItemsBatchAsync(IEnumerable<int> ids)
        => throw new NotImplementedException();

    public Task<IEnumerable<WorkItemUpdateRaw>> GetWorkItemUpdatesAsync(int workItemId)
        => throw new NotImplementedException();

    public Task<BoardRaw> GetBoardAsync()
        => throw new NotImplementedException();
}
