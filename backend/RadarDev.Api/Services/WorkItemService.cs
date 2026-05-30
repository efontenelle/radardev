using RadarDev.Api.Models.Dtos;
using RadarDev.Api.Models.Raw;

namespace RadarDev.Api.Services;

public interface IWorkItemService
{
    Task<IEnumerable<WorkItemDto>> GetWorkItemsAsync(DateTime from, DateTime to);
    Task<IEnumerable<StateTransitionDto>> GetStateHistoryAsync(int workItemId);
}

public class WorkItemService : IWorkItemService
{
    private readonly IAzureDevOpsService _azureDevOps;

    public WorkItemService(IAzureDevOpsService azureDevOps)
    {
        _azureDevOps = azureDevOps;
    }

    public async Task<IEnumerable<WorkItemDto>> GetWorkItemsAsync(DateTime from, DateTime to)
    {
        var ids = await _azureDevOps.QueryByWiqlAsync(from, to);
        var rawItems = await _azureDevOps.GetWorkItemsBatchAsync(ids);

        return rawItems.Select(wi => new WorkItemDto(
            wi.Id,
            wi.Fields.Title,
            wi.Fields.WorkItemType,
            wi.Fields.State,
            wi.Fields.CreatedDate,
            wi.Fields.ChangedDate
        ));
    }

    public async Task<IEnumerable<StateTransitionDto>> GetStateHistoryAsync(int workItemId)
    {
        var updates = await _azureDevOps.GetWorkItemUpdatesAsync(workItemId);

        return updates
            .Where(u => u.Fields?.State != null)
            .Select(u => new StateTransitionDto(
                u.Fields!.State!.OldValue,
                u.Fields.State.NewValue ?? string.Empty,
                u.RevisedDate,
                u.RevisedBy.DisplayName
            ));
    }
}
