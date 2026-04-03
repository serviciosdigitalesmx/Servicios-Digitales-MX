namespace BackendApi.Domain;

public sealed record DemoTenant(
    Guid Id,
    string Name,
    string Slug
);

public sealed record DemoUser(
    Guid Id,
    Guid TenantId,
    Guid? BranchId,
    string FullName,
    string Email,
    string Role,
    bool IsActive
);

public sealed record DemoCustomer(
    Guid Id,
    Guid TenantId,
    string FullName,
    string? Phone,
    string? Email,
    string Tag,
    string? Notes,
    DateTimeOffset CreatedAt
);

public sealed record DemoServiceOrder(
    Guid Id,
    Guid TenantId,
    Guid BranchId,
    Guid CustomerId,
    string Folio,
    string Status,
    string DeviceType,
    string? DeviceBrand,
    string? DeviceModel,
    string ReportedIssue,
    string Priority,
    DateOnly? PromisedDate,
    decimal EstimatedCost,
    DateTimeOffset CreatedAt,
    string? CasoResolucionTecnica = null
);

public sealed record LoginRequest(
    string Email,
    string Password
);

public sealed record RegisterRequest(
    string ShopName,
    string ShopSlug,
    string FullName,
    string Email,
    string? Phone,
    string Password,
    string? ReferralCode,
    string? PlanCode
);

public sealed record BillingCheckoutRequest(
    string? PlanCode,
    Guid? TenantId,
    string? PayerEmail,
    string? PayerName
);

public sealed record CreateCustomerRequest(
    string FullName,
    string? Phone,
    string? Email,
    string? Tag,
    string? Notes
);

public sealed record CreateServiceOrderRequest(
    Guid BranchId,
    Guid CustomerId,
    Guid? ServiceRequestId,
    string DeviceType,
    string? DeviceBrand,
    string? DeviceModel,
    string? SerialNumber,
    string ReportedIssue,
    string? Priority,
    DateOnly? PromisedDate,
    decimal? EstimatedCost
);

public sealed record CreateServiceRequestRequest(
    Guid? BranchId,
    string CustomerName,
    string? CustomerPhone,
    string? CustomerEmail,
    string? DeviceType,
    string? DeviceModel,
    string? IssueDescription,
    string? Urgency,
    decimal? QuotedTotal,
    decimal? DepositAmount,
    decimal? BalanceAmount,
    string? SolicitudOrigenIp = null
);

public sealed record UpdateTechnicianOrderRequest(
    string? Status,
    string? InternalDiagnosis,
    decimal? FinalCost,
    string? CasoResolucionTecnica = null
);

public sealed record CreateSupplierRequest(
    string BusinessName,
    string? ContactName,
    string? Phone,
    string? Email,
    string? Categories,
    string? Notes
);

public sealed record CreateProductRequest(
    string Sku,
    string Name,
    string? Category,
    string? Brand,
    string? CompatibleModel,
    Guid? PrimarySupplierId,
    decimal? Cost,
    decimal? SalePrice,
    decimal? MinimumStock,
    string? Unit,
    string? Location,
    string? Notes,
    decimal? InitialStock
);

public sealed record CreatePurchaseOrderItemRequest(
    Guid? ProductId,
    string? SkuSnapshot,
    string ProductNameSnapshot,
    decimal QtyOrdered,
    decimal UnitCost
);

public sealed record CreatePurchaseOrderRequest(
    Guid? BranchId,
    Guid? SupplierId,
    Guid? RelatedServiceOrderId,
    string? Reference,
    string? PaymentTerms,
    DateOnly? ExpectedDate,
    string? Notes,
    List<CreatePurchaseOrderItemRequest> Items
);

public sealed record CreateExpenseRequest(
    Guid? BranchId,
    Guid? SupplierId,
    Guid? ServiceOrderId,
    Guid? PurchaseOrderId,
    string ExpenseType,
    string Category,
    string Concept,
    string? Description,
    decimal? Amount,
    string? PaymentMethod,
    string? ReceiptUrl,
    string? Notes,
    DateOnly? ExpenseDate
);

public sealed record CreateTaskRequest(
    Guid? BranchId,
    Guid? ServiceOrderId,
    Guid? ServiceRequestId,
    string Title,
    string? Description,
    string? Status,
    string? Priority,
    Guid? AssignedUserId,
    DateTimeOffset? DueDate
);

public sealed record CreateBranchRequest(
    string Name,
    string? Code,
    string? Address,
    string? City,
    string? State,
    string? Phone
);

public sealed record MercadoPagoPreferenceRequest(
    Guid ShopId,
    string PlanCode,
    string Title,
    string Description,
    decimal UnitPrice,
    string CurrencyId,
    string ExternalReference,
    string PayerName,
    string PayerEmail
);

public sealed record MercadoPagoPreferenceResponse(
    string PreferenceId,
    string InitPoint,
    string SandboxInitPoint
);

public sealed record MercadoPagoWebhookRequest(
    string? Action,
    string? Type,
    MercadoPagoWebhookData? Data,
    long? UserId,
    bool? LiveMode
);

public sealed record MercadoPagoWebhookData(
    string? Id
);

public sealed record MercadoPagoPaymentDetails(
    string Id,
    string Status,
    string? StatusDetail,
    string? ExternalReference,
    MercadoPagoPaymentMetadata? Metadata,
    MercadoPagoPaymentPayer? Payer,
    decimal? TransactionAmount,
    string? CurrencyId
);

public sealed record MercadoPagoPaymentMetadata(
    string? ShopId,
    string? TenantId,
    string? SubscriptionPlan
);

public sealed record SubscriptionPlanDefinition(
    string Code,
    string Name,
    decimal PriceMxn,
    string BillingInterval,
    IReadOnlyList<string> Modules
);

public static class SubscriptionPlans
{
    public static readonly SubscriptionPlanDefinition Essential = new(
        "esencial-350",
        "Plan Esencial",
        350.00m,
        "monthly",
        new[]
        {
            "Operativo",
            "Técnico",
            "Solicitudes / Cotizaciones",
            "Archivo",
            "Clientes",
            "Portal por Folio",
            "Billing"
        }
    );

    public static readonly SubscriptionPlanDefinition Professional = new(
        "profesional-650",
        "Plan Profesional",
        650.00m,
        "monthly",
        new[]
        {
            "Todo lo del Esencial",
            "Stock / Inventario",
            "Proveedores",
            "Compras",
            "Gastos",
            "Finanzas",
            "Reportes",
            "Referidos"
        }
    );

    public static readonly SubscriptionPlanDefinition Elite = new(
        "elite-1200",
        "Plan Elite",
        1200.00m,
        "monthly",
        new[]
        {
            "Todo lo del Profesional",
            "Multi-sucursal",
            "Branding Personalizado",
            "Dashboard Ejecutivo",
            "Soporte VIP"
        }
    );

    public static readonly IReadOnlyList<SubscriptionPlanDefinition> All = new[]
    {
        Essential,
        Professional,
        Elite
    };

    public static SubscriptionPlanDefinition Resolve(string? code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return Essential;
        }

        return All.FirstOrDefault(plan => string.Equals(plan.Code, code.Trim(), StringComparison.OrdinalIgnoreCase))
            ?? Essential;
    }
}

public sealed record MercadoPagoPaymentPayer(
    string? Email
);
