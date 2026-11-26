using BottleFactory.Api.MachineStatus;
using TwinCAT.Ads;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<AdsMachineStatusReader>();
var app = builder.Build();

app.MapGet("/api/health", () =>
    Results.Ok(new { status = "API running" }));

app.MapGet("/api/machine/status", async (
    AdsMachineStatusReader reader, HttpContext context, ILogger<AdsMachineStatusReader> logger) =>
{
    context.Response.Headers.CacheControl = "no-store";
    using var timeout = CancellationTokenSource.CreateLinkedTokenSource(context.RequestAborted);
    timeout.CancelAfter(TimeSpan.FromSeconds(3));

    try
    {
        return Results.Ok(await reader.ReadAsync(timeout.Token));
    }
    catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
    {
        throw;
    }
    catch (Exception ex) when (ex is AdsErrorException or TwinCAT.ClientNotConnectedException
        or System.Net.Sockets.SocketException or PlcStatusUnavailableException
        or OperationCanceledException or TimeoutException)
    {
        logger.LogWarning(ex, "Machine telemetry unavailable");
        return Results.Problem(
            title: "Machine telemetry unavailable",
            detail: ex switch
            {
                PlcStatusUnavailableException => ex.Message,
                OperationCanceledException or TimeoutException => "The ADS read timed out.",
                _ => "Could not read the local TwinCAT runtime on ADS port 851."
            },
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }
});

app.Run();
