namespace BackendApi.Infrastructure;

public sealed class SupabaseOptions
{
    public string Url { get; set; } = string.Empty;
    public string ServiceKey { get; set; } = string.Empty;
    public string EvidenceBucket { get; set; } = "sdmx-evidence";
}
