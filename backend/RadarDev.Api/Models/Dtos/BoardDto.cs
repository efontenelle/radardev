namespace RadarDev.Api.Models.Dtos;

public record BoardDto(
    string Name,
    IEnumerable<BoardColumnDto> Columns,
    IEnumerable<string> Lanes
);

public record BoardColumnDto(
    string Name,
    int Order,
    string StateMappings
);
