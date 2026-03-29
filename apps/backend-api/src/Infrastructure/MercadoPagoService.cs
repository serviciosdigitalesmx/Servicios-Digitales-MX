using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using BackendApi.Domain;
using Microsoft.Extensions.Options;

namespace BackendApi.Infrastructure;

public sealed class MercadoPagoService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    private readonly HttpClient _httpClient;
    private readonly MercadoPagoOptions _options;

    public MercadoPagoService(HttpClient httpClient, IOptions<MercadoPagoOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _httpClient.BaseAddress = new Uri("https://api.mercadopago.com/");

        if (!string.IsNullOrWhiteSpace(_options.AccessToken))
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _options.AccessToken);
        }
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_options.AccessToken);

    public async Task<MercadoPagoPreferenceResponse> CreateSubscriptionPreferenceAsync(
        MercadoPagoPreferenceRequest request,
        CancellationToken cancellationToken = default)
    {
        var webhookBaseUrl = string.IsNullOrWhiteSpace(_options.WebhookBaseUrl)
            ? null
            : _options.WebhookBaseUrl.TrimEnd('/');

        var payload = new
        {
            items = new[]
            {
                new
                {
                    title = request.Title,
                    description = request.Description,
                    quantity = 1,
                    currency_id = request.CurrencyId,
                    unit_price = request.UnitPrice
                }
            },
            payer = new
            {
                name = request.PayerName,
                email = request.PayerEmail
            },
            back_urls = new
            {
                success = $"{_options.BaseUrl.TrimEnd('/')}/billing?status=success",
                pending = $"{_options.BaseUrl.TrimEnd('/')}/billing?status=pending",
                failure = $"{_options.BaseUrl.TrimEnd('/')}/billing?status=failure"
            },
            notification_url = webhookBaseUrl is null ? null : $"{webhookBaseUrl}/api/webhooks/mercadopago",
            external_reference = request.ExternalReference,
            statement_descriptor = "SERVICIOSDMX",
            metadata = new
            {
                shop_id = request.ShopId,
                tenant_id = request.ShopId,
                subscription_plan = request.PlanCode
            }
        };

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "checkout/preferences");
        httpRequest.Content = new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json");

        using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException($"Mercado Pago error {(int)response.StatusCode}: {body}");
        }

        var parsed = JsonSerializer.Deserialize<MercadoPagoPreferenceApiResponse>(body, JsonOptions)
                     ?? throw new InvalidOperationException("Mercado Pago no devolvio una preferencia valida");

        return new MercadoPagoPreferenceResponse(
            parsed.Id,
            parsed.InitPoint ?? string.Empty,
            parsed.SandboxInitPoint ?? string.Empty
        );
    }

    public async Task<MercadoPagoPaymentDetails?> GetPaymentDetailsAsync(string paymentId, CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, $"v1/payments/{paymentId}");
        using var response = await _httpClient.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException($"Mercado Pago payment lookup error {(int)response.StatusCode}: {body}");
        }

        var parsed = JsonSerializer.Deserialize<MercadoPagoPaymentApiResponse>(body, JsonOptions);
        if (parsed is null)
        {
            return null;
        }

        return new MercadoPagoPaymentDetails(
            parsed.Id.ToString(),
            parsed.Status ?? "unknown",
            parsed.StatusDetail,
            parsed.ExternalReference,
            parsed.Metadata is null
                ? null
                : new MercadoPagoPaymentMetadata(parsed.Metadata.ShopId, parsed.Metadata.TenantId, parsed.Metadata.SubscriptionPlan),
            parsed.Payer is null ? null : new MercadoPagoPaymentPayer(parsed.Payer.Email),
            parsed.TransactionAmount,
            parsed.CurrencyId
        );
    }

    private sealed record MercadoPagoPreferenceApiResponse(
        string Id,
        [property: JsonPropertyName("init_point")] string? InitPoint,
        [property: JsonPropertyName("sandbox_init_point")] string? SandboxInitPoint
    );

    private sealed record MercadoPagoPaymentApiResponse(
        long Id,
        string? Status,
        [property: JsonPropertyName("status_detail")] string? StatusDetail,
        [property: JsonPropertyName("external_reference")] string? ExternalReference,
        [property: JsonPropertyName("transaction_amount")] decimal? TransactionAmount,
        [property: JsonPropertyName("currency_id")] string? CurrencyId,
        MercadoPagoPaymentApiMetadata? Metadata,
        MercadoPagoPaymentApiPayer? Payer
    );

    private sealed record MercadoPagoPaymentApiMetadata(
        [property: JsonPropertyName("shop_id")] string? ShopId,
        [property: JsonPropertyName("tenant_id")] string? TenantId,
        [property: JsonPropertyName("subscription_plan")] string? SubscriptionPlan
    );

    private sealed record MercadoPagoPaymentApiPayer(
        string? Email
    );
}
