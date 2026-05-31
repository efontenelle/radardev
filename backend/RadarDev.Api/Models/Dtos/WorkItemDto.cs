namespace RadarDev.Api.Models.Dtos;

public record WorkItemDto(
    int Id,
    string Title,
    string Type,
    string State,
    DateTime CreatedDate,
    DateTime? ChangedDate
);
