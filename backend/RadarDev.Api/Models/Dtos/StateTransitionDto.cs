namespace RadarDev.Api.Models.Dtos;

public record StateTransitionDto(
    string? FromState,
    string ToState,
    DateTime TransitionDate,
    string ChangedBy
);
