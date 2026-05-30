using Microsoft.AspNetCore.Mvc;
using RadarDev.Api.Services;

namespace RadarDev.Api.Controllers;

[ApiController]
[Route("api/workitems")]
public class WorkItemsController : ControllerBase
{
    private readonly IWorkItemService _workItemService;

    public WorkItemsController(IWorkItemService workItemService)
    {
        _workItemService = workItemService;
    }

    [HttpGet]
    public async Task<IActionResult> GetWorkItems(
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        [FromHeader(Name = "X-User-Name")] string? userName = null)
    {
        var items = await _workItemService.GetWorkItemsAsync(from, to);
        return Ok(items);
    }

    [HttpGet("{id:int}/history")]
    public async Task<IActionResult> GetWorkItemHistory(
        int id,
        [FromHeader(Name = "X-User-Name")] string? userName = null)
    {
        var history = await _workItemService.GetStateHistoryAsync(id);
        return Ok(history);
    }
}
