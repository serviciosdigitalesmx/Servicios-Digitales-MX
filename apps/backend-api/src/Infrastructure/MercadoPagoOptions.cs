namespace BackendApi.Infrastructure;

public sealed class MercadoPagoOptions
{
    public string AccessToken { get; set; } = string.Empty;
    public string PublicKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "http://localhost:3000";
    public string WebhookBaseUrl { get; set; } = string.Empty;
    public string SupportPhone { get; set; } = "528181234567";
}
