namespace RadarDev.Api.Models.Raw;

public class WiqlResultRaw
{
    public List<WorkItemRefRaw> WorkItems { get; set; } = [];
}

public class WorkItemRefRaw
{
    public int Id { get; set; }
    public string Url { get; set; } = string.Empty;
}
