using System.Text.Json.Serialization;

namespace RadarDev.Api.Models.Raw;

public class WorkItemUpdatesResultRaw
{
    public List<WorkItemUpdateRaw> Value { get; set; } = [];
}

public class WorkItemUpdateRaw
{
    public int Rev { get; set; }
    public RevisedByRaw RevisedBy { get; set; } = new();
    public DateTime RevisedDate { get; set; }
    public WorkItemUpdateFieldsRaw? Fields { get; set; }
}

public class RevisedByRaw
{
    public string DisplayName { get; set; } = string.Empty;
}

public class WorkItemUpdateFieldsRaw
{
    [JsonPropertyName("System.State")]
    public FieldChangeRaw<string>? State { get; set; }
}

public class FieldChangeRaw<T>
{
    public T? OldValue { get; set; }
    public T? NewValue { get; set; }
}
