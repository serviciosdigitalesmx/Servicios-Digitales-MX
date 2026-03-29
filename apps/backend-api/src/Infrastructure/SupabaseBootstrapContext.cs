namespace BackendApi.Infrastructure;

public sealed class SupabaseBootstrapContext
{
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public Guid UserId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public string TenantSlug { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string UserFullName { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;
    public string UserReferralCode { get; set; } = string.Empty;
    public decimal UserBalance { get; set; }
    public Guid SubscriptionId { get; set; }
    public string SubscriptionStatus { get; set; } = string.Empty;
    public string SubscriptionPlanCode { get; set; } = string.Empty;
    public string SubscriptionPlanName { get; set; } = string.Empty;
    public decimal SubscriptionPriceMxn { get; set; }
    public string BillingInterval { get; set; } = string.Empty;
    public DateTimeOffset? CurrentPeriodStart { get; set; }
    public DateTimeOffset? CurrentPeriodEnd { get; set; }
    public DateTimeOffset? GraceUntil { get; set; }

    public bool HasOperationalAccess =>
        SubscriptionStatus is "trialing" or "active" or "past_due";
}
