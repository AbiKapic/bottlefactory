using TwinCAT.Ads;

namespace BottleFactory.Api.MachineStatus;

internal sealed record MachineStatus(
    bool Connected,
    uint CompletedBottles,
    bool? Busy,
    bool? ValveOpen,
    bool? Done,
    bool? BottlePresent,
    bool? RunRequest,
    bool? StopRequest,
    uint? ConveyorPosition,
    uint? CappingProgress,
    bool? BottleCapped,
    uint? FillPercent,
    uint? TransferPhase,
    uint? PlaceProgress,
    DateTimeOffset SampledAt,
    IReadOnlyList<string> MissingSymbols);

internal sealed class AdsMachineStatusReader
{
    private const string Station = "MAIN.fbCinnamon.";

    public async Task<MachineStatus> ReadAsync(CancellationToken cancellationToken)
    {
        using var client = new AdsClient();
        client.Connect(AmsNetId.Local, 851);

        var state = await client.ReadStateAsync(cancellationToken);
        if (!state.Succeeded)
            throw new PlcStatusUnavailableException($"Reading PLC runtime state failed ({state.ErrorCode}).");
        if (state.State.AdsState != AdsState.Run)
            throw new PlcStatusUnavailableException($"The PLC runtime is in {state.State.AdsState} mode.");

        var missingSymbols = new List<string>();
        var completed = await ReadSignalAsync<uint>(Station + "nCompleted")
            ?? throw new PlcStatusUnavailableException($"Required ADS symbol {Station}nCompleted was not found.");

        return new MachineStatus(
            Connected: true,
            CompletedBottles: completed,
            Busy: await ReadSignalAsync<bool>(Station + "bBusy"),
            ValveOpen: await ReadSignalAsync<bool>(Station + "bValveOpen"),
            Done: await ReadSignalAsync<bool>(Station + "bDone"),
            BottlePresent: await ReadSignalAsync<bool>("MAIN.bBottlePresent"),
            RunRequest: await ReadSignalAsync<bool>("MAIN.bCinnamonRun"),
            StopRequest: await ReadSignalAsync<bool>("MAIN.bCinnamonStop"),
            ConveyorPosition: await ReadSignalAsync<uint>("MAIN.nConveyorPosition", reportMissing: false),
            CappingProgress: await ReadSignalAsync<uint>("MAIN.fbCapping.nArmProgress", reportMissing: false),
            BottleCapped: await ReadSignalAsync<bool>("MAIN.bBottleCapped", reportMissing: false),
            FillPercent: await ReadSignalAsync<uint>(Station + "nFillPercent", reportMissing: false),
            TransferPhase: await ReadSignalAsync<uint>("MAIN.nTransferPhase", reportMissing: false),
            PlaceProgress: await ReadSignalAsync<uint>("MAIN.nPlaceProgress", reportMissing: false),
            SampledAt: DateTimeOffset.UtcNow,
            MissingSymbols: missingSymbols);

        async Task<T?> ReadSignalAsync<T>(string path, bool reportMissing = true) where T : struct
        {
            var result = await client.ReadValueAsync<T>(path, cancellationToken);
            if (result.Succeeded)
                return result.Value;
            if (result.ErrorCode == AdsErrorCode.DeviceSymbolNotFound)
            {
                if (reportMissing) missingSymbols.Add(path);
                return null;
            }

            cancellationToken.ThrowIfCancellationRequested();
            throw new PlcStatusUnavailableException($"Reading ADS symbol {path} failed ({result.ErrorCode}).");
        }
    }
}

internal sealed class PlcStatusUnavailableException(string message) : Exception(message);
