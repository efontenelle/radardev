namespace RadarDev.Api.Models.Raw;

public class BoardRaw
{
    public string Name { get; set; } = string.Empty;
    public List<BoardColumnRaw> Columns { get; set; } = [];
    public List<TeamSettingsIterationRaw> Rows { get; set; } = [];
}

public class BoardColumnRaw
{
    public string Name { get; set; } = string.Empty;
    public string ColumnType { get; set; } = string.Empty;
    public Dictionary<string, string> StateMappings { get; set; } = [];
}

public class TeamSettingsIterationRaw
{
    public string Name { get; set; } = string.Empty;
}
