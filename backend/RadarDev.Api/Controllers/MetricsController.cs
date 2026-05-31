using Microsoft.AspNetCore.Mvc;
using RadarDev.Api.Models.Dtos;
using RadarDev.Api.Services;

namespace RadarDev.Api.Controllers;

[ApiController]
[Route("api/metrics")]
public class MetricsController : ControllerBase
{
    private readonly IMetricsService _metricsService;

    public MetricsController(IMetricsService metricsService)
    {
        _metricsService = metricsService;
    }

    [HttpPost]
    public async Task<IActionResult> GetMetrics(
        [FromBody] MetricsRequestDto request,
        [FromHeader(Name = "X-User-Name")] string? userName = null)
    {
        try
        {
            var result = await _metricsService.CalculateAsync(request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            // Configuração inconsistente: coluna não existe no board atual
            return BadRequest(new { error = ex.Message });
        }
    }
}
