using Microsoft.Extensions.Options;

namespace RadarDev.Api.Configuration;

public class AzureDevOpsConfig
{
    public const string SectionName = "AzureDevOps";

    public string Pat { get; set; } = string.Empty;
    public string Organization { get; set; } = string.Empty;
    public string Project { get; set; } = string.Empty;
    public string BoardName { get; set; } = string.Empty;
}

public class AzureDevOpsConfigValidator : IValidateOptions<AzureDevOpsConfig>
{
    public ValidateOptionsResult Validate(string? name, AzureDevOpsConfig options)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(options.Pat))
            errors.Add("AzureDevOps:Pat is required.");

        if (string.IsNullOrWhiteSpace(options.Organization))
            errors.Add("AzureDevOps:Organization is required.");

        if (string.IsNullOrWhiteSpace(options.Project))
            errors.Add("AzureDevOps:Project is required.");

        if (string.IsNullOrWhiteSpace(options.BoardName))
            errors.Add("AzureDevOps:BoardName is required.");

        return errors.Count > 0
            ? ValidateOptionsResult.Fail(errors)
            : ValidateOptionsResult.Success;
    }
}
