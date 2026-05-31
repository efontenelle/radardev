namespace RadarDev.Api.Models.Dtos;

public record MetricsRequestDto(
    string StartColumn,
    string EndColumn,
    List<string> SelectedLanes,
    DateTime From,
    DateTime To
);
