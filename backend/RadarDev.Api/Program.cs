using Microsoft.Extensions.Options;
using RadarDev.Api.Configuration;
using RadarDev.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
builder.Services.AddControllers();

// Typed configuration with startup validation
builder.Services.Configure<AzureDevOpsConfig>(
    builder.Configuration.GetSection("AzureDevOps"));
builder.Services.AddSingleton<IValidateOptions<AzureDevOpsConfig>, AzureDevOpsConfigValidator>();

// Named HttpClient for Azure DevOps
builder.Services.AddHttpClient("AzureDevOps");

// Application services
builder.Services.AddScoped<IAzureDevOpsService, AzureDevOpsService>();
builder.Services.AddScoped<IWorkItemService, WorkItemService>();
builder.Services.AddScoped<IBoardService, BoardService>();
builder.Services.AddScoped<IMetricsService, MetricsService>();

// CORS for development
builder.Services.AddCors(options =>
{
    options.AddPolicy("Development", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "http://localhost:54735")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("Development");
app.UseHttpsRedirection();
app.MapControllers();

app.Run();
