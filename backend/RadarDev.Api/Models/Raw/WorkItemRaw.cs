using System.Text.Json.Serialization;

namespace RadarDev.Api.Models.Raw;

public class WorkItemRaw
{
    public int Id { get; set; }
    public WorkItemFieldsRaw Fields { get; set; } = new();
}

public class WorkItemBatchResultRaw
{
    public List<WorkItemRaw> Value { get; set; } = [];
}

public class WorkItemFieldsRaw
{
    [JsonPropertyName("System.Title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("System.WorkItemType")]
    public string WorkItemType { get; set; } = string.Empty;

    [JsonPropertyName("System.State")]
    public string State { get; set; } = string.Empty;

    [JsonPropertyName("System.CreatedDate")]
    public DateTime CreatedDate { get; set; }

    [JsonPropertyName("System.ChangedDate")]
    public DateTime? ChangedDate { get; set; }
}
