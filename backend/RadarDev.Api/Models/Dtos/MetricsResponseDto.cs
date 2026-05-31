namespace RadarDev.Api.Models.Dtos;

public record MetricsResponseDto(
    IEnumerable<CycleTimePointDto> CycleTime,
    CyclePercentilesDto Percentiles,
    IEnumerable<ThroughputWeekDto> Throughput,
    IEnumerable<AgeItemDto> Age
);

public record CycleTimePointDto(
    int Id,
    string Title,
    DateTime DeliveredDate,
    double CycleTimeDays
);

public record CyclePercentilesDto(
    double P85,
    double P90
);

public record ThroughputWeekDto(
    int IsoYear,
    int IsoWeek,
    DateTime WeekStart,
    int Count
);

public record AgeItemDto(
    int Id,
    string Title,
    string Type,
    double AgeDays
);
