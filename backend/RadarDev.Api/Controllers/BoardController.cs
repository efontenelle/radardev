using Microsoft.AspNetCore.Mvc;
using RadarDev.Api.Services;

namespace RadarDev.Api.Controllers;

[ApiController]
[Route("api/board")]
public class BoardController : ControllerBase
{
    private readonly IBoardService _boardService;

    public BoardController(IBoardService boardService)
    {
        _boardService = boardService;
    }

    [HttpGet("columns")]
    public async Task<IActionResult> GetColumns()
    {
        var board = await _boardService.GetBoardAsync();
        return Ok(board);
    }
}
