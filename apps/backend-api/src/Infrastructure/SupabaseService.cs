using System.Net;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using BackendApi.Domain;
using Microsoft.Extensions.Options;

namespace BackendApi.Infrastructure;

public sealed class SupabaseService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _httpClient;
    private readonly SupabaseOptions _options;
    private readonly SupabaseBootstrapContext _bootstrap;

    public SupabaseService(HttpClient httpClient, IOptions<SupabaseOptions> options, SupabaseBootstrapContext bootstrap)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _bootstrap = bootstrap;

        if (!string.IsNullOrWhiteSpace(_options.Url))
        {
            _httpClient.BaseAddress = new Uri($"{_options.Url.TrimEnd('/')}/rest/v1/");
        }
        if (!string.IsNullOrWhiteSpace(_options.ServiceKey))
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _options.ServiceKey);
            _httpClient.DefaultRequestHeaders.Remove("apikey");
            _httpClient.DefaultRequestHeaders.Add("apikey", _options.ServiceKey);
        }
    }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_options.Url) &&
        !string.IsNullOrWhiteSpace(_options.ServiceKey);

    public SupabaseBootstrapContext Bootstrap => _bootstrap;

    private static readonly string MockAuthFile = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), ".local_auth.json");

    private static string HashPassword(string password, string salt)
    {
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var bytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password + salt));
        return Convert.ToBase64String(bytes);
    }

    public async Task<bool> VerifyUserPasswordAsync(string email, string password, CancellationToken cancellationToken = default)
    {
        // En producción, esto debería validar contra la tabla 'users'
        var user = await GetSingleAsync<DbUser>($"users?email=eq.{Uri.EscapeDataString(email)}&select=id,password_hash,password_salt", cancellationToken);
        
        if (user is null || string.IsNullOrEmpty(user.PasswordHash) || string.IsNullOrEmpty(user.PasswordSalt))
        {
            return false;
        }

        return user.PasswordHash == HashPassword(password, user.PasswordSalt);
    }

    public async Task SetUserPasswordAsync(Guid userId, string password, CancellationToken cancellationToken = default)
    {
        var salt = Guid.NewGuid().ToString("N");
        var hash = HashPassword(password, salt);

        await PatchAsync("users", $"id=eq.{userId}", new
        {
            password_hash = hash,
            password_salt = salt
        }, cancellationToken);
    }

    public async Task EnsureBootstrapDataAsync(CancellationToken cancellationToken = default)
    {
        if (!IsConfigured) return;

        const string tenantSlug = "taller-centro";
        var tenant = await GetSingleAsync<DbTenant>($"tenants?slug=eq.{Uri.EscapeDataString(tenantSlug)}&select=id,name,slug", cancellationToken);
        if (tenant is null)
        {
            tenant = await InsertSingleAsync<DbTenant>("tenants", new
            {
                name = "Taller Centro",
                slug = tenantSlug,
                status = "active",
                plan = "starter",
                contact_name = "Admin Demo",
                contact_email = "admin@taller.com",
                contact_phone = "8180000000"
            }, cancellationToken, "id,name,slug");
        }

        _bootstrap.TenantId = tenant!.Id;
        _bootstrap.TenantName = tenant.Name;
        _bootstrap.TenantSlug = tenant.Slug;

        var branch = await GetSingleAsync<DbBranch>($"branches?tenant_id=eq.{tenant.Id}&code=eq.MTX&select=id,name", cancellationToken);
        if (branch is null)
        {
            branch = await InsertSingleAsync<DbBranch>("branches", new
            {
                tenant_id = tenant.Id,
                name = "Matriz",
                code = "MTX",
                city = "Monterrey",
                state = "Nuevo Leon",
                is_active = true
            }, cancellationToken, "id,name");
        }

        _bootstrap.BranchId = branch!.Id;

        var user = await GetSingleAsync<DbUser>($"users?tenant_id=eq.{tenant.Id}&email=eq.{Uri.EscapeDataString("admin@taller.com")}&select=id,tenant_id,full_name,email,role,is_active,branch_id,referral_code,balance", cancellationToken);
        if (user is null)
        {
            var referralCode = await GenerateUniqueReferralCodeAsync(cancellationToken);
            user = await InsertSingleAsync<DbUser>("users", new
            {
                tenant_id = tenant.Id,
                branch_id = branch.Id,
                full_name = "Admin Demo",
                email = "admin@taller.com",
                phone = "8180000000",
                role = "admin",
                is_active = true,
                referral_code = referralCode,
                balance = 0
            }, cancellationToken, "id,tenant_id,full_name,email,role,is_active,branch_id,referral_code,balance");
        }
        else if (string.IsNullOrWhiteSpace(user.ReferralCode))
        {
            user = await PatchSingleAsync<DbUser>(
                "users",
                $"id=eq.{user.Id}",
                new
                {
                    referral_code = await GenerateUniqueReferralCodeAsync(cancellationToken),
                    balance = user.Balance
                },
                cancellationToken,
                "id,tenant_id,full_name,email,role,is_active,branch_id,referral_code,balance") ?? user;
        }

        _bootstrap.UserId = user!.Id;
        _bootstrap.UserEmail = user.Email;
        _bootstrap.UserFullName = user.FullName;
        _bootstrap.UserRole = user.Role;
        _bootstrap.UserReferralCode = user.ReferralCode ?? string.Empty;
        _bootstrap.UserBalance = user.Balance;

        // Proporcionamos password real en el seed
        await SetUserPasswordAsync(user.Id, "Admin123!", cancellationToken);

        var subscription = await GetSingleAsync<DbSubscription>($"subscriptions?tenant_id=eq.{tenant.Id}&order=created_at.desc&limit=1&select=id,tenant_id,plan_code,plan_name,price_mxn,billing_interval,status,current_period_start,current_period_end,grace_until", cancellationToken);
        if (subscription is null)
        {
            var now = DateTimeOffset.UtcNow;
            var defaultPlan = SubscriptionPlans.Essential;
            subscription = await InsertSingleAsync<DbSubscription>("subscriptions", new
            {
                tenant_id = tenant.Id,
                plan_code = defaultPlan.Code,
                plan_name = defaultPlan.Name,
                price_mxn = defaultPlan.PriceMxn,
                billing_interval = defaultPlan.BillingInterval,
                status = "trialing",
                current_period_start = now,
                current_period_end = now.AddDays(30),
                grace_until = now.AddDays(35)
            }, cancellationToken, "id,tenant_id,plan_code,plan_name,price_mxn,billing_interval,status,current_period_start,current_period_end,grace_until");
        }

        _bootstrap.SubscriptionId = subscription!.Id;
        _bootstrap.SubscriptionStatus = subscription.Status;
        _bootstrap.SubscriptionPlanCode = subscription.PlanCode;
        _bootstrap.SubscriptionPlanName = subscription.PlanName;
        _bootstrap.SubscriptionPriceMxn = subscription.PriceMxn;
        _bootstrap.BillingInterval = subscription.BillingInterval;
        _bootstrap.CurrentPeriodStart = subscription.CurrentPeriodStart;
        _bootstrap.CurrentPeriodEnd = subscription.CurrentPeriodEnd;
        _bootstrap.GraceUntil = subscription.GraceUntil;
    }

    public async Task<RegistrationResult> RegisterShopAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var normalizedSlug = request.ShopSlug.Trim().ToLowerInvariant();

        if (await ExistsAsync($"tenants?slug=eq.{Uri.EscapeDataString(normalizedSlug)}&select=id", cancellationToken))
        {
            throw new InvalidOperationException("El slug del shop ya está en uso");
        }

        if (await ExistsAsync($"users?email=eq.{Uri.EscapeDataString(normalizedEmail)}&select=id", cancellationToken))
        {
            throw new InvalidOperationException("Ya existe un usuario con ese correo");
        }

        DbUser? referrer = null;
        if (!string.IsNullOrWhiteSpace(request.ReferralCode))
        {
            referrer = await GetSingleAsync<DbUser>(
                $"users?referral_code=eq.{Uri.EscapeDataString(request.ReferralCode.Trim().ToUpperInvariant())}&select=id,tenant_id,branch_id,full_name,email,role,is_active,referral_code,balance",
                cancellationToken);

            if (referrer is null)
            {
                throw new InvalidOperationException("El código de referido no es válido");
            }
        }

        var tenant = await InsertSingleAsync<DbTenant>("tenants", new
        {
            name = request.ShopName.Trim(),
            slug = normalizedSlug,
            status = "active",
            plan = "starter",
            contact_name = request.FullName.Trim(),
            contact_email = normalizedEmail,
            contact_phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim()
        }, cancellationToken, "id,name,slug");

        var branch = await InsertSingleAsync<DbBranch>("branches", new
        {
            tenant_id = tenant!.Id,
            name = "Matriz",
            code = "MTX",
            is_active = true
        }, cancellationToken, "id,name");

        var referralCode = await GenerateUniqueReferralCodeAsync(cancellationToken);
        var user = await InsertSingleAsync<DbUser>("users", new
        {
            tenant_id = tenant.Id,
            branch_id = branch!.Id,
            full_name = request.FullName.Trim(),
            email = normalizedEmail,
            phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            role = "admin",
            is_active = true,
            referral_code = referralCode,
            balance = 0
        }, cancellationToken, "id,tenant_id,full_name,email,role,is_active,branch_id,referral_code,balance");

        await SetUserPasswordAsync(user!.Id, request.Password, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var selectedPlan = SubscriptionPlans.Resolve(request.PlanCode);
        await InsertSingleAsync<DbSubscription>("subscriptions", new
        {
            tenant_id = tenant.Id,
            plan_code = selectedPlan.Code,
            plan_name = selectedPlan.Name,
            price_mxn = selectedPlan.PriceMxn,
            billing_interval = selectedPlan.BillingInterval,
            status = "trialing",
            current_period_start = now,
            current_period_end = now.AddDays(30),
            grace_until = now.AddDays(35)
        }, cancellationToken, "id,tenant_id,plan_code,plan_name,price_mxn,billing_interval,status,current_period_start,current_period_end,grace_until");

        if (referrer is not null)
        {
            await InsertSingleAsync<DbReferral>("referrals", new
            {
                referrer_user_id = referrer.Id,
                referred_user_id = user!.Id,
                referred_tenant_id = tenant.Id,
                referral_code_used = referrer.ReferralCode,
                status = "pending",
                commission_amount = 150.00m
            }, cancellationToken, "id,referrer_user_id,referred_user_id,status,commission_amount,referral_code_used");
        }

        return new RegistrationResult(tenant.Id, tenant.Name, tenant.Slug, user!.Id, user.ReferralCode ?? string.Empty, referrer?.Id);
    }

    public async Task RefreshSubscriptionContextAsync(CancellationToken cancellationToken = default)
    {
        if (!IsConfigured || _bootstrap.TenantId == Guid.Empty)
        {
            return;
        }

        var subscription = await GetSingleAsync<DbSubscription>($"subscriptions?tenant_id=eq.{_bootstrap.TenantId}&order=created_at.desc&limit=1&select=id,tenant_id,plan_code,plan_name,price_mxn,billing_interval,status,current_period_start,current_period_end,grace_until", cancellationToken);
        if (subscription is null)
        {
            _bootstrap.SubscriptionId = Guid.Empty;
            _bootstrap.SubscriptionStatus = "missing";
            _bootstrap.SubscriptionPlanCode = string.Empty;
            _bootstrap.SubscriptionPlanName = string.Empty;
            _bootstrap.SubscriptionPriceMxn = 0;
            _bootstrap.BillingInterval = string.Empty;
            _bootstrap.CurrentPeriodStart = null;
            _bootstrap.CurrentPeriodEnd = null;
            _bootstrap.GraceUntil = null;
            return;
        }

        _bootstrap.SubscriptionId = subscription.Id;
        _bootstrap.SubscriptionStatus = subscription.Status;
        _bootstrap.SubscriptionPlanCode = subscription.PlanCode;
        _bootstrap.SubscriptionPlanName = subscription.PlanName;
        _bootstrap.SubscriptionPriceMxn = subscription.PriceMxn;
        _bootstrap.BillingInterval = subscription.BillingInterval;
        _bootstrap.CurrentPeriodStart = subscription.CurrentPeriodStart;
        _bootstrap.CurrentPeriodEnd = subscription.CurrentPeriodEnd;
        _bootstrap.GraceUntil = subscription.GraceUntil;
    }

    public Task<DbSubscriptionPayment?> GetLatestSubscriptionPaymentAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        GetSingleAsync<DbSubscriptionPayment>(
            $"subscription_payments?tenant_id=eq.{tenantId}&order=paid_at.desc&limit=1&select=id,subscription_id,provider,provider_payment_id,provider_payment_status,amount,currency_id,payer_email,paid_at,created_at",
            cancellationToken);

    public async Task<bool> ConfirmReferralCommissionAsync(Guid referredUserId, string paymentId, decimal commissionAmount, CancellationToken cancellationToken = default)
    {
        var result = await PostRpcAsync<bool?>(
            "confirm_referral_commission",
            new
            {
                p_referred_user_id = referredUserId,
                p_provider_payment_id = paymentId,
                p_payment_provider = "mercadopago",
                p_commission_amount = commissionAmount
            },
            cancellationToken);

        return result ?? false;
    }

    public Task<DbUser?> GetPrimaryUserByTenantAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        GetSingleAsync<DbUser>(
            $"users?tenant_id=eq.{tenantId}&order=created_at.asc&limit=1&select=id,tenant_id,branch_id,full_name,email,role,is_active,referral_code,balance",
            cancellationToken);

    public Task<DbReferralStatus?> GetReferralByReferredTenantAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        GetSingleAsync<DbReferralStatus>(
            $"referrals?referred_tenant_id=eq.{tenantId}&order=created_at.desc&limit=1&select=id,status,commission_amount,payment_provider,provider_payment_id,confirmed_at",
            cancellationToken);

    public async Task<IReadOnlyList<object>> ListReferralsAsync(CancellationToken cancellationToken = default)
    {
        var rows = await GetManyAsync<DbReferralListItem>(
            $"referrals?referrer_user_id=eq.{_bootstrap.UserId}&order=created_at.desc&select=id,referred_tenant_id,referral_code_used,status,commission_amount,payment_provider,provider_payment_id,confirmed_at,created_at",
            cancellationToken);

        var tenantIds = rows
            .Where(x => x.ReferredTenantId.HasValue)
            .Select(x => x.ReferredTenantId!.Value)
            .Distinct()
            .ToArray();

        Dictionary<Guid, DbTenant> tenantsById = new();
        if (tenantIds.Length > 0)
        {
            var tenantFilter = string.Join(",", tenantIds.Select(x => x.ToString()));
            var tenants = await GetManyAsync<DbTenant>($"tenants?id=in.({tenantFilter})&select=id,name,slug", cancellationToken);
            tenantsById = tenants.ToDictionary(x => x.Id, x => x);
        }

        return rows
            .Select(x =>
            {
                tenantsById.TryGetValue(x.ReferredTenantId ?? Guid.Empty, out var tenant);
                return (object)new
                {
                    x.Id,
                    x.Status,
                    x.CommissionAmount,
                    x.ReferralCodeUsed,
                    x.PaymentProvider,
                    x.ProviderPaymentId,
                    x.ConfirmedAt,
                    x.CreatedAt,
                    referredShop = x.ReferredTenantId.HasValue
                        ? new
                        {
                            Id = x.ReferredTenantId,
                            Name = tenant?.Name ?? "Shop referido",
                            Slug = tenant?.Slug ?? "sin-slug"
                        }
                        : null
                };
            })
            .ToArray();
    }

    public async Task<bool> UpdateSubscriptionFromPaymentAsync(
        Guid tenantId,
        string paymentStatus,
        string paymentId,
        string? payerEmail,
        decimal? amount,
        string? currencyId,
        string? planCode,
        CancellationToken cancellationToken = default)
    {
        var subscription = await GetSingleAsync<DbSubscription>(
            $"subscriptions?tenant_id=eq.{tenantId}&order=created_at.desc&limit=1&select=id,current_period_end,metadata_json",
            cancellationToken);

        if (subscription is null)
        {
            return false;
        }

        var now = DateTimeOffset.UtcNow;
        var normalizedStatus = NormalizeSubscriptionStatusFromPayment(paymentStatus);
        var selectedPlan = SubscriptionPlans.Resolve(planCode);
        var periodStart = now;
        var periodEnd = normalizedStatus == "active"
            ? MaxDate(subscription.CurrentPeriodEnd, now).AddDays(30)
            : subscription.CurrentPeriodEnd;

        var metadataJson = new Dictionary<string, object?>
        {
            ["last_payment_id"] = paymentId,
            ["last_payment_status"] = paymentStatus,
            ["last_payment_email"] = payerEmail,
            ["last_payment_amount"] = amount,
            ["last_payment_currency"] = currencyId,
            ["last_payment_at"] = now
        };

        await PatchAsync(
            "subscriptions",
            $"id=eq.{subscription.Id}",
            new
            {
                status = normalizedStatus,
                plan_code = selectedPlan.Code,
                plan_name = selectedPlan.Name,
                price_mxn = selectedPlan.PriceMxn,
                billing_interval = selectedPlan.BillingInterval,
                current_period_start = normalizedStatus == "active" ? periodStart : now,
                current_period_end = periodEnd,
                grace_until = normalizedStatus == "active" ? periodEnd?.AddDays(5) : now.AddDays(5),
                metadata_json = metadataJson
            },
            cancellationToken);

        await UpsertSubscriptionPaymentAsync(
            tenantId,
            subscription.Id,
            paymentId,
            paymentStatus,
            payerEmail,
            amount,
            currencyId,
            now,
            cancellationToken);

        if (_bootstrap.TenantId == tenantId)
        {
            await RefreshSubscriptionContextAsync(cancellationToken);
        }

        return true;
    }

    public async Task<(IReadOnlyList<object> Items, int Total)> ListCustomersAsync(string? search, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var rows = await GetManyAsync<DbCustomer>($"customers?tenant_id=eq.{_bootstrap.TenantId}&order=created_at.desc&select=id,full_name,phone,email,tag", cancellationToken);
        IEnumerable<DbCustomer> query = rows;
        if (!string.IsNullOrWhiteSpace(search))
        {
            var text = search.Trim().ToLowerInvariant();
            query = query.Where(x =>
                x.FullName.ToLowerInvariant().Contains(text) ||
                (x.Phone ?? string.Empty).Contains(text) ||
                (x.Email ?? string.Empty).ToLowerInvariant().Contains(text));
        }

        var total = query.Count();
        var items = query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => (object)new
            {
                x.Id,
                x.FullName,
                x.Phone,
                x.Email,
                x.Tag
            })
            .ToArray();

        return (items, total);
    }

    public Task<DbCustomer?> GetCustomerByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        GetSingleAsync<DbCustomer>($"customers?id=eq.{id}&tenant_id=eq.{_bootstrap.TenantId}&select=id,tenant_id,full_name,phone,email,tag,notes,created_at", cancellationToken);

    public Task<DbCustomer?> CreateCustomerAsync(CreateCustomerRequest request, CancellationToken cancellationToken = default) =>
        InsertSingleAsync<DbCustomer>("customers", new
        {
            tenant_id = _bootstrap.TenantId,
            full_name = request.FullName.Trim(),
            phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
            tag = string.IsNullOrWhiteSpace(request.Tag) ? "nuevo" : request.Tag.Trim().ToLowerInvariant(),
            notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim()
        }, cancellationToken, "id,tenant_id,full_name,phone,email,tag,notes,created_at");

    public async Task<(IReadOnlyList<object> Items, int Total)> ListServiceOrdersAsync(string? status, Guid? branchId, string? search, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var rows = await GetManyAsync<DbServiceOrder>($"service_orders?tenant_id=eq.{_bootstrap.TenantId}&order=created_at.desc&select=id,folio,status,device_type,device_model,promised_date,branch_id", cancellationToken);
        IEnumerable<DbServiceOrder> query = rows;

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalized = status.Trim().ToLowerInvariant();
            query = query.Where(x => x.Status == normalized);
        }

        if (branchId.HasValue && branchId.Value != Guid.Empty)
        {
            query = query.Where(x => x.BranchId == branchId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var text = search.Trim().ToLowerInvariant();
            query = query.Where(x =>
                x.Folio.ToLowerInvariant().Contains(text) ||
                x.DeviceType.ToLowerInvariant().Contains(text) ||
                (x.DeviceModel ?? string.Empty).ToLowerInvariant().Contains(text));
        }

        var total = query.Count();
        var items = query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => (object)new
            {
                x.Id,
                x.Folio,
                x.Status,
                x.DeviceType,
                x.DeviceModel,
                x.PromisedDate
            })
            .ToArray();

        return (items, total);
    }

    public async Task<(IReadOnlyList<object> Items, int Total)> ListServiceRequestsAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var rows = await GetManyAsync<DbServiceRequest>(
            $"service_requests?tenant_id=eq.{_bootstrap.TenantId}&order=created_at.desc&select=id,branch_id,folio,customer_name,customer_phone,customer_email,device_type,device_model,issue_description,urgency,status,quoted_total,deposit_amount,balance_amount,created_at",
            cancellationToken);

        var total = rows.Count;
        var items = rows
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => (object)new
            {
                x.Id,
                x.Folio,
                x.CustomerName,
                x.CustomerPhone,
                x.CustomerEmail,
                x.DeviceType,
                x.DeviceModel,
                x.IssueDescription,
                x.Urgency,
                x.Status,
                x.QuotedTotal,
                x.DepositAmount,
                x.BalanceAmount,
                x.CreatedAt
            })
            .ToArray();

        return (items, total);
    }

    public async Task<object> CreateServiceRequestAsync(CreateServiceRequestRequest request, CancellationToken cancellationToken = default)
    {
        var nextNumber = await GetNextServiceRequestNumberAsync(cancellationToken);
        var folio = $"COT-{nextNumber:000000}";
        var serviceRequest = await InsertSingleAsync<DbServiceRequest>("service_requests", new
        {
            tenant_id = _bootstrap.TenantId,
            branch_id = request.BranchId ?? _bootstrap.BranchId,
            folio,
            customer_name = request.CustomerName.Trim(),
            customer_phone = string.IsNullOrWhiteSpace(request.CustomerPhone) ? null : request.CustomerPhone.Trim(),
            customer_email = string.IsNullOrWhiteSpace(request.CustomerEmail) ? null : request.CustomerEmail.Trim(),
            device_type = string.IsNullOrWhiteSpace(request.DeviceType) ? null : request.DeviceType.Trim(),
            device_model = string.IsNullOrWhiteSpace(request.DeviceModel) ? null : request.DeviceModel.Trim(),
            issue_description = string.IsNullOrWhiteSpace(request.IssueDescription) ? null : request.IssueDescription.Trim(),
            urgency = string.IsNullOrWhiteSpace(request.Urgency) ? "normal" : request.Urgency.Trim().ToLowerInvariant(),
            status = "pendiente",
            quoted_total = request.QuotedTotal ?? 0,
            deposit_amount = request.DepositAmount ?? 0,
            deposit_amount = request.DepositAmount ?? 0,
            balance_amount = request.BalanceAmount ?? Math.Max((request.QuotedTotal ?? 0) - (request.DepositAmount ?? 0), 0),
            solicitud_origen_ip = request.SolicitudOrigenIp
        }, cancellationToken, "id,folio,customer_name,customer_phone,customer_email,device_type,device_model,issue_description,urgency,status,quoted_total,deposit_amount,balance_amount,created_at,solicitud_origen_ip");

        return new
        {
            serviceRequest!.Id,
            serviceRequest.Folio,
            serviceRequest.CustomerName,
            serviceRequest.DeviceType,
            serviceRequest.DeviceModel,
            serviceRequest.Status,
            serviceRequest.QuotedTotal,
            serviceRequest.DepositAmount,
            serviceRequest.BalanceAmount,
            serviceRequest.CreatedAt
        };
    }

    public Task<DbServiceOrder?> GetServiceOrderByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        GetSingleAsync<DbServiceOrder>($"service_orders?id=eq.{id}&tenant_id=eq.{_bootstrap.TenantId}&select=id,tenant_id,branch_id,customer_id,folio,status,device_type,device_brand,device_model,reported_issue,priority,promised_date,estimated_cost,created_at", cancellationToken);

    public Task<DbServiceOrder?> GetServiceOrderByFolioAsync(string folio, CancellationToken cancellationToken = default) =>
        GetSingleAsync<DbServiceOrder>($"service_orders?folio=eq.{Uri.EscapeDataString(folio)}&tenant_id=eq.{_bootstrap.TenantId}&select=id,tenant_id,branch_id,customer_id,folio,status,device_type,device_brand,device_model,reported_issue,priority,promised_date,estimated_cost,created_at", cancellationToken);

    public async Task<(IReadOnlyList<object> Orders, IReadOnlyList<object> Tasks)> GetTechnicianQueueAsync(CancellationToken cancellationToken = default)
    {
        var orders = await GetManyAsync<DbTechnicianOrder>(
            $"service_orders?tenant_id=eq.{_bootstrap.TenantId}&status=in.(recibido,diagnostico,reparacion,listo)&order=created_at.desc&select=id,folio,status,device_type,device_brand,device_model,reported_issue,internal_diagnosis,final_cost,priority,promised_date,created_at",
            cancellationToken);
        var tasks = await GetManyAsync<DbTask>(
            $"tasks?tenant_id=eq.{_bootstrap.TenantId}&status=in.(pendiente,en_proceso)&order=created_at.desc&select=id,branch_id,service_order_id,service_request_id,title,description,status,priority,assigned_user_id,due_date,created_at",
            cancellationToken);

        return (
            orders.Select(x => (object)new
            {
                x.Id,
                x.Folio,
                x.Status,
                x.DeviceType,
                x.DeviceBrand,
                x.DeviceModel,
                x.ReportedIssue,
                x.InternalDiagnosis,
                x.FinalCost,
                x.Priority,
                x.PromisedDate,
                x.CreatedAt
            }).ToArray(),
            tasks.Select(x => (object)new
            {
                x.Id,
                x.Title,
                x.Description,
                x.Status,
                x.Priority,
                x.DueDate
            }).ToArray()
        );
    }

    public async Task<object?> UpdateTechnicianOrderAsync(Guid orderId, UpdateTechnicianOrderRequest request, CancellationToken cancellationToken = default)
    {
        var order = await GetSingleAsync<DbTechnicianOrder>(
            $"service_orders?id=eq.{orderId}&tenant_id=eq.{_bootstrap.TenantId}&select=id,folio,status,device_type,device_brand,device_model,reported_issue,internal_diagnosis,final_cost,priority,promised_date,created_at",
            cancellationToken);
        if (order is null) return null;

        var nextStatus = string.IsNullOrWhiteSpace(request.Status) ? order.Status : request.Status.Trim().ToLowerInvariant();
        var updated = await PatchSingleAsync<DbTechnicianOrder>(
            $"service_orders?id=eq.{orderId}&tenant_id=eq.{_bootstrap.TenantId}",
            new
            {
                status = nextStatus,
                internal_diagnosis = string.IsNullOrWhiteSpace(request.InternalDiagnosis) ? order.InternalDiagnosis : request.InternalDiagnosis.Trim(),
                final_cost = request.FinalCost ?? order.FinalCost,
                caso_resolucion_tecnica = request.CasoResolucionTecnica ?? null,
                completed_at = nextStatus == "listo" ? DateTimeOffset.UtcNow : (DateTimeOffset?)null,
                updated_by = _bootstrap.UserId
            },
            cancellationToken,
            "id,folio,status,device_type,device_brand,device_model,reported_issue,internal_diagnosis,final_cost,priority,promised_date,created_at,caso_resolucion_tecnica");

        return updated is null ? null : new
        {
            updated.Id,
            updated.Folio,
            updated.Status,
            updated.InternalDiagnosis,
            updated.FinalCost
        };
    }

    public async Task<(IReadOnlyList<object> Items, int Total)> ListArchivedOrdersAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var rows = await GetManyAsync<DbArchivedOrder>(
            $"service_orders?tenant_id=eq.{_bootstrap.TenantId}&status=in.(archivado,entregado,cancelado)&order=updated_at.desc&select=id,folio,status,device_type,device_brand,device_model,reported_issue,final_cost,archived_at,delivered_at,updated_at",
            cancellationToken);

        var total = rows.Count;
        var items = rows
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => (object)new
            {
                x.Id,
                x.Folio,
                x.Status,
                x.DeviceType,
                x.DeviceBrand,
                x.DeviceModel,
                x.ReportedIssue,
                x.FinalCost,
                x.ArchivedAt,
                x.DeliveredAt,
                x.UpdatedAt
            })
            .ToArray();

        return (items, total);
    }

    public async Task<object?> ArchiveServiceOrderAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var order = await PatchSingleAsync<DbArchivedOrder>(
            $"service_orders?id=eq.{orderId}&tenant_id=eq.{_bootstrap.TenantId}",
            new
            {
                status = "archivado",
                archived_at = DateTimeOffset.UtcNow,
                updated_by = _bootstrap.UserId
            },
            cancellationToken,
            "id,folio,status,device_type,device_brand,device_model,reported_issue,final_cost,archived_at,delivered_at,updated_at");

        return order is null ? null : new
        {
            order.Id,
            order.Folio,
            order.Status,
            order.ArchivedAt
        };
    }

    public async Task<DbServiceOrder?> CreateServiceOrderAsync(CreateServiceOrderRequest request, CancellationToken cancellationToken = default)
    {
        var nextNumber = await GetNextOrderNumberAsync(cancellationToken);
        var folio = $"ORD-{nextNumber:000000}";

        return await InsertSingleAsync<DbServiceOrder>("service_orders", new
        {
            tenant_id = _bootstrap.TenantId,
            branch_id = request.BranchId,
            customer_id = request.CustomerId,
            service_request_id = request.ServiceRequestId,
            folio,
            status = "recibido",
            priority = string.IsNullOrWhiteSpace(request.Priority) ? "normal" : request.Priority.Trim().ToLowerInvariant(),
            device_type = request.DeviceType.Trim(),
            device_brand = string.IsNullOrWhiteSpace(request.DeviceBrand) ? null : request.DeviceBrand.Trim(),
            device_model = string.IsNullOrWhiteSpace(request.DeviceModel) ? null : request.DeviceModel.Trim(),
            serial_number = string.IsNullOrWhiteSpace(request.SerialNumber) ? null : request.SerialNumber.Trim(),
            reported_issue = request.ReportedIssue.Trim(),
            promised_date = request.PromisedDate,
            estimated_cost = request.EstimatedCost ?? 0,
            received_at = DateTimeOffset.UtcNow,
            created_by = _bootstrap.UserId,
            updated_by = _bootstrap.UserId
        }, cancellationToken, "id,tenant_id,branch_id,customer_id,folio,status,device_type,device_brand,device_model,reported_issue,priority,promised_date,estimated_cost,created_at");
    }

    public Task<bool> CustomerExistsAsync(Guid customerId, CancellationToken cancellationToken = default) =>
        ExistsAsync($"customers?id=eq.{customerId}&tenant_id=eq.{_bootstrap.TenantId}&select=id", cancellationToken);

    public async Task<IReadOnlyList<object>> ListSuppliersAsync(CancellationToken cancellationToken = default)
    {
        var rows = await GetManyAsync<DbSupplier>(
            $"suppliers?tenant_id=eq.{_bootstrap.TenantId}&is_active=is.true&order=business_name.asc&select=id,business_name,contact_name,phone,email,categories",
            cancellationToken);

        return rows
            .Select(x => (object)new
            {
                x.Id,
                x.BusinessName,
                x.ContactName,
                x.Phone,
                x.Email,
                x.Categories
            })
            .ToArray();
    }

    public Task<DbSupplier?> CreateSupplierAsync(CreateSupplierRequest request, CancellationToken cancellationToken = default) =>
        InsertSingleAsync<DbSupplier>("suppliers", new
        {
            tenant_id = _bootstrap.TenantId,
            business_name = request.BusinessName.Trim(),
            contact_name = string.IsNullOrWhiteSpace(request.ContactName) ? null : request.ContactName.Trim(),
            phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
            categories = string.IsNullOrWhiteSpace(request.Categories) ? null : request.Categories.Trim(),
            notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            is_active = true
        }, cancellationToken, "id,tenant_id,business_name,contact_name,phone,email,categories");

    public async Task<(IReadOnlyList<object> Items, int Total)> ListProductsAsync(string? search, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var rows = await GetManyAsync<DbProduct>(
            $"products?tenant_id=eq.{_bootstrap.TenantId}&is_active=is.true&order=created_at.desc&select=id,sku,name,category,brand,compatible_model,primary_supplier_id,cost,sale_price,minimum_stock,unit,location",
            cancellationToken);
        var suppliers = await GetManyAsync<DbSupplier>(
            $"suppliers?tenant_id=eq.{_bootstrap.TenantId}&select=id,business_name",
            cancellationToken);
        var inventory = await GetManyAsync<DbBranchInventory>(
            $"branch_inventory?tenant_id=eq.{_bootstrap.TenantId}&branch_id=eq.{_bootstrap.BranchId}&select=product_id,stock_current",
            cancellationToken);

        IEnumerable<DbProduct> query = rows;
        if (!string.IsNullOrWhiteSpace(search))
        {
            var text = search.Trim().ToLowerInvariant();
            query = query.Where(x =>
                x.Name.ToLowerInvariant().Contains(text) ||
                x.Sku.ToLowerInvariant().Contains(text) ||
                (x.Brand ?? string.Empty).ToLowerInvariant().Contains(text));
        }

        var supplierMap = suppliers.ToDictionary(x => x.Id, x => x.BusinessName);
        var inventoryMap = inventory.ToDictionary(x => x.ProductId, x => x.StockCurrent);
        var total = query.Count();
        var items = query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => (object)new
            {
                x.Id,
                x.Sku,
                x.Name,
                x.Category,
                x.Brand,
                x.CompatibleModel,
                x.Cost,
                x.SalePrice,
                x.MinimumStock,
                x.Unit,
                x.Location,
                SupplierName = x.PrimarySupplierId.HasValue && supplierMap.TryGetValue(x.PrimarySupplierId.Value, out var supplierName)
                    ? supplierName
                    : null,
                StockCurrent = inventoryMap.TryGetValue(x.Id, out var stockCurrent) ? stockCurrent : 0
            })
            .ToArray();

        return (items, total);
    }

    public async Task<DbProduct?> CreateProductAsync(CreateProductRequest request, CancellationToken cancellationToken = default)
    {
        var product = await InsertSingleAsync<DbProduct>("products", new
        {
            tenant_id = _bootstrap.TenantId,
            sku = request.Sku.Trim().ToUpperInvariant(),
            name = request.Name.Trim(),
            category = string.IsNullOrWhiteSpace(request.Category) ? null : request.Category.Trim(),
            brand = string.IsNullOrWhiteSpace(request.Brand) ? null : request.Brand.Trim(),
            compatible_model = string.IsNullOrWhiteSpace(request.CompatibleModel) ? null : request.CompatibleModel.Trim(),
            primary_supplier_id = request.PrimarySupplierId,
            cost = request.Cost ?? 0,
            sale_price = request.SalePrice ?? 0,
            minimum_stock = request.MinimumStock ?? 0,
            unit = string.IsNullOrWhiteSpace(request.Unit) ? null : request.Unit.Trim(),
            location = string.IsNullOrWhiteSpace(request.Location) ? null : request.Location.Trim(),
            notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            is_active = true
        }, cancellationToken, "id,tenant_id,sku,name,category,brand,compatible_model,primary_supplier_id,cost,sale_price,minimum_stock,unit,location,created_at");

        var initialStock = request.InitialStock ?? 0;
        if (product is not null && initialStock > 0)
        {
            await UpsertBranchInventoryAsync(product.Id, initialStock, cancellationToken);
            await InsertSingleAsync<DbInventoryMovement>("inventory_movements", new
            {
                tenant_id = _bootstrap.TenantId,
                branch_id = _bootstrap.BranchId,
                product_id = product.Id,
                movement_type = "entrada",
                quantity = initialStock,
                unit_cost = request.Cost ?? 0,
                reference = "Alta inicial",
                notes = "Stock inicial del producto",
                created_by = _bootstrap.UserId
            }, cancellationToken, "id,product_id,movement_type,quantity");
        }

        return product;
    }

    public async Task<(IReadOnlyList<object> Items, int Total)> ListPurchaseOrdersAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var rows = await GetManyAsync<DbPurchaseOrder>(
            $"purchase_orders?tenant_id=eq.{_bootstrap.TenantId}&order=created_at.desc&select=id,folio,status,supplier_id,expected_date,total,created_at",
            cancellationToken);
        var suppliers = await GetManyAsync<DbSupplier>($"suppliers?tenant_id=eq.{_bootstrap.TenantId}&select=id,business_name", cancellationToken);
        var supplierMap = suppliers.ToDictionary(x => x.Id, x => x.BusinessName);

        var total = rows.Count;
        var items = rows
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => (object)new
            {
                x.Id,
                x.Folio,
                x.Status,
                x.ExpectedDate,
                x.Total,
                SupplierName = x.SupplierId.HasValue && supplierMap.TryGetValue(x.SupplierId.Value, out var supplierName)
                    ? supplierName
                    : "Sin proveedor"
            })
            .ToArray();

        return (items, total);
    }

    public async Task<object> CreatePurchaseOrderAsync(CreatePurchaseOrderRequest request, CancellationToken cancellationToken = default)
    {
        var nextNumber = await GetNextPurchaseOrderNumberAsync(cancellationToken);
        var folio = $"PO-{nextNumber:000000}";
        var subtotal = request.Items.Sum(item => item.QtyOrdered * item.UnitCost);

        var order = await InsertSingleAsync<DbPurchaseOrder>("purchase_orders", new
        {
            tenant_id = _bootstrap.TenantId,
            branch_id = request.BranchId ?? _bootstrap.BranchId,
            supplier_id = request.SupplierId,
            related_service_order_id = request.RelatedServiceOrderId,
            folio,
            status = "borrador",
            reference = string.IsNullOrWhiteSpace(request.Reference) ? null : request.Reference.Trim(),
            payment_terms = string.IsNullOrWhiteSpace(request.PaymentTerms) ? null : request.PaymentTerms.Trim(),
            expected_date = request.ExpectedDate,
            subtotal,
            tax_amount = 0,
            total = subtotal,
            notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            created_by = _bootstrap.UserId,
            updated_by = _bootstrap.UserId
        }, cancellationToken, "id,folio,status,supplier_id,expected_date,total,created_at");

        foreach (var item in request.Items)
        {
            await InsertSingleAsync<DbPurchaseOrderItem>("purchase_order_items", new
            {
                tenant_id = _bootstrap.TenantId,
                purchase_order_id = order!.Id,
                product_id = item.ProductId,
                sku_snapshot = string.IsNullOrWhiteSpace(item.SkuSnapshot) ? null : item.SkuSnapshot.Trim(),
                product_name_snapshot = item.ProductNameSnapshot.Trim(),
                qty_ordered = item.QtyOrdered,
                qty_received = 0,
                unit_cost = item.UnitCost,
                subtotal = item.QtyOrdered * item.UnitCost
            }, cancellationToken, "id,purchase_order_id");
        }

        return new
        {
            order!.Id,
            order.Folio,
            order.Status,
            order.ExpectedDate,
            order.Total
        };
    }

    public async Task<(IReadOnlyList<object> Items, int Total)> ListExpensesAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var rows = await GetManyAsync<DbExpense>(
            $"expenses?tenant_id=eq.{_bootstrap.TenantId}&order=expense_date.desc,created_at.desc&select=id,branch_id,supplier_id,service_order_id,purchase_order_id,expense_type,category,concept,description,amount,payment_method,expense_date,created_at",
            cancellationToken);
        var suppliers = await GetManyAsync<DbSupplier>($"suppliers?tenant_id=eq.{_bootstrap.TenantId}&select=id,business_name", cancellationToken);
        var supplierMap = suppliers.ToDictionary(x => x.Id, x => x.BusinessName);

        var total = rows.Count;
        var items = rows
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => (object)new
            {
                x.Id,
                x.ExpenseType,
                x.Category,
                x.Concept,
                x.Description,
                x.Amount,
                x.PaymentMethod,
                x.ExpenseDate,
                x.CreatedAt,
                SupplierName = x.SupplierId.HasValue && supplierMap.TryGetValue(x.SupplierId.Value, out var supplierName)
                    ? supplierName
                    : null
            })
            .ToArray();

        return (items, total);
    }

    public async Task<object> CreateExpenseAsync(CreateExpenseRequest request, CancellationToken cancellationToken = default)
    {
        var expense = await InsertSingleAsync<DbExpense>("expenses", new
        {
            tenant_id = _bootstrap.TenantId,
            branch_id = request.BranchId ?? _bootstrap.BranchId,
            supplier_id = request.SupplierId,
            service_order_id = request.ServiceOrderId,
            purchase_order_id = request.PurchaseOrderId,
            expense_type = request.ExpenseType.Trim().ToLowerInvariant(),
            category = request.Category.Trim().ToLowerInvariant(),
            concept = request.Concept.Trim(),
            description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            amount = request.Amount ?? 0,
            payment_method = string.IsNullOrWhiteSpace(request.PaymentMethod) ? null : request.PaymentMethod.Trim().ToLowerInvariant(),
            receipt_url = string.IsNullOrWhiteSpace(request.ReceiptUrl) ? null : request.ReceiptUrl.Trim(),
            notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            expense_date = request.ExpenseDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
            created_by = _bootstrap.UserId
        }, cancellationToken, "id,expense_type,category,concept,amount,payment_method,expense_date,created_at");

        return new
        {
            expense!.Id,
            expense.ExpenseType,
            expense.Category,
            expense.Concept,
            expense.Amount,
            expense.PaymentMethod,
            expense.ExpenseDate,
            expense.CreatedAt
        };
    }

    public async Task<object> GetFinanceSummaryAsync(CancellationToken cancellationToken = default)
    {
        var serviceOrders = await GetManyAsync<DbServiceOrder>(
            $"service_orders?tenant_id=eq.{_bootstrap.TenantId}&select=id,status,estimated_cost,created_at",
            cancellationToken);
        var expenses = await GetManyAsync<DbExpense>(
            $"expenses?tenant_id=eq.{_bootstrap.TenantId}&select=id,amount,expense_date",
            cancellationToken);
        var purchaseOrders = await GetManyAsync<DbPurchaseOrder>(
            $"purchase_orders?tenant_id=eq.{_bootstrap.TenantId}&select=id,status,total,created_at",
            cancellationToken);
        var customers = await GetManyAsync<DbCustomer>(
            $"customers?tenant_id=eq.{_bootstrap.TenantId}&select=id",
            cancellationToken);

        var projectedRevenue = serviceOrders.Sum(x => x.EstimatedCost);
        var expenseTotal = expenses.Sum(x => x.Amount);
        var purchaseCommitted = purchaseOrders.Sum(x => x.Total);
        var activeOrders = serviceOrders.Count(x => x.Status is not ("entregado" or "archivado" or "cancelado"));
        var netProjected = projectedRevenue - expenseTotal - purchaseCommitted;

        var monthlyRevenue = serviceOrders
            .GroupBy(x => new { x.CreatedAt.Year, x.CreatedAt.Month })
            .OrderByDescending(x => x.Key.Year)
            .ThenByDescending(x => x.Key.Month)
            .Take(6)
            .Select(x => (object)new
            {
                Label = $"{x.Key.Year:D4}-{x.Key.Month:D2}",
                Revenue = x.Sum(item => item.EstimatedCost)
            })
            .ToArray();

        var monthlyExpenses = expenses
            .GroupBy(x => new { x.ExpenseDate.Year, x.ExpenseDate.Month })
            .OrderByDescending(x => x.Key.Year)
            .ThenByDescending(x => x.Key.Month)
            .Take(6)
            .Select(x => (object)new
            {
                Label = $"{x.Key.Year:D4}-{x.Key.Month:D2}",
                Expenses = x.Sum(item => item.Amount)
            })
            .ToArray();

        return new
        {
            projectedRevenue,
            expenseTotal,
            purchaseCommitted,
            netProjected,
            activeOrders,
            customers = customers.Count,
            averageTicket = serviceOrders.Count == 0 ? 0 : decimal.Round(projectedRevenue / serviceOrders.Count, 2),
            monthlyRevenue,
            monthlyExpenses
        };
    }

    public async Task<IReadOnlyList<object>> ListBranchesAsync(CancellationToken cancellationToken = default)
    {
        var rows = await GetManyAsync<DbBranchExtended>(
            $"branches?tenant_id=eq.{_bootstrap.TenantId}&order=name.asc&select=id,name,code,address,city,state,phone,is_active,created_at",
            cancellationToken);

        return rows.Select(x => (object)new
        {
            x.Id,
            x.Name,
            x.Code,
            x.Address,
            x.City,
            x.State,
            x.Phone,
            x.IsActive,
            x.CreatedAt
        }).ToArray();
    }

    public Task<DbBranchExtended?> CreateBranchAsync(CreateBranchRequest request, CancellationToken cancellationToken = default) =>
        InsertSingleAsync<DbBranchExtended>("branches", new
        {
            tenant_id = _bootstrap.TenantId,
            name = request.Name.Trim(),
            code = string.IsNullOrWhiteSpace(request.Code) ? null : request.Code.Trim().ToUpperInvariant(),
            address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim(),
            city = string.IsNullOrWhiteSpace(request.City) ? null : request.City.Trim(),
            state = string.IsNullOrWhiteSpace(request.State) ? null : request.State.Trim(),
            phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            is_active = true
        }, cancellationToken, "id,name,code,address,city,state,phone,is_active,created_at");

    public async Task<(IReadOnlyList<object> Items, int Total)> ListTasksAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var rows = await GetManyAsync<DbTask>(
            $"tasks?tenant_id=eq.{_bootstrap.TenantId}&order=created_at.desc&select=id,branch_id,service_order_id,service_request_id,title,description,status,priority,assigned_user_id,due_date,created_at",
            cancellationToken);
        var users = await GetManyAsync<DbUser>(
            $"users?tenant_id=eq.{_bootstrap.TenantId}&select=id,tenant_id,branch_id,full_name,email,role,is_active,referral_code,balance",
            cancellationToken);
        var userMap = users.ToDictionary(x => x.Id, x => x.FullName);

        var total = rows.Count;
        var items = rows
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => (object)new
            {
                x.Id,
                x.Title,
                x.Description,
                x.Status,
                x.Priority,
                x.DueDate,
                x.CreatedAt,
                AssignedUserName = x.AssignedUserId.HasValue && userMap.TryGetValue(x.AssignedUserId.Value, out var userName)
                    ? userName
                    : null
            })
            .ToArray();

        return (items, total);
    }

    public async Task<object> CreateTaskAsync(CreateTaskRequest request, CancellationToken cancellationToken = default)
    {
        var task = await InsertSingleAsync<DbTask>("tasks", new
        {
            tenant_id = _bootstrap.TenantId,
            branch_id = request.BranchId ?? _bootstrap.BranchId,
            service_order_id = request.ServiceOrderId,
            service_request_id = request.ServiceRequestId,
            title = request.Title.Trim(),
            description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            status = string.IsNullOrWhiteSpace(request.Status) ? "pendiente" : request.Status.Trim().ToLowerInvariant(),
            priority = string.IsNullOrWhiteSpace(request.Priority) ? "media" : request.Priority.Trim().ToLowerInvariant(),
            assigned_user_id = request.AssignedUserId,
            due_date = request.DueDate,
            created_by = _bootstrap.UserId,
            updated_by = _bootstrap.UserId
        }, cancellationToken, "id,title,description,status,priority,assigned_user_id,due_date,created_at");

        await InsertSingleAsync<DbTaskHistory>("task_history", new
        {
            tenant_id = _bootstrap.TenantId,
            task_id = task!.Id,
            event_type = "created",
            comment = "Tarea creada desde el panel nativo",
            changed_by = _bootstrap.UserId
        }, cancellationToken, "id,task_id");

        return new
        {
            task.Id,
            task.Title,
            task.Description,
            task.Status,
            task.Priority,
            task.DueDate,
            task.CreatedAt
        };
    }

    public async Task<object> GetOperationalReportAsync(CancellationToken cancellationToken = default)
    {
        var serviceOrders = await GetManyAsync<DbServiceOrder>(
            $"service_orders?tenant_id=eq.{_bootstrap.TenantId}&select=id,status,device_type,reported_issue,estimated_cost,created_at",
            cancellationToken);
        var tasks = await GetManyAsync<DbTask>(
            $"tasks?tenant_id=eq.{_bootstrap.TenantId}&select=id,status,priority,created_at",
            cancellationToken);
        var products = await GetManyAsync<DbProduct>(
            $"products?tenant_id=eq.{_bootstrap.TenantId}&is_active=is.true&select=id,sku,name,minimum_stock",
            cancellationToken);
        var inventory = await GetManyAsync<DbBranchInventory>(
            $"branch_inventory?tenant_id=eq.{_bootstrap.TenantId}&branch_id=eq.{_bootstrap.BranchId}&select=product_id,stock_current",
            cancellationToken);

        var inventoryMap = inventory.ToDictionary(x => x.ProductId, x => x.StockCurrent);
        var criticalStock = products
            .Where(product => inventoryMap.TryGetValue(product.Id, out var current) && current <= product.MinimumStock)
            .Select(product => (object)new
            {
                product.Sku,
                product.Name,
                MinimumStock = product.MinimumStock,
                StockCurrent = inventoryMap.TryGetValue(product.Id, out var current) ? current : 0
            })
            .Take(10)
            .ToArray();

        var issues = serviceOrders
            .GroupBy(x => x.ReportedIssue ?? "Sin descripcion")
            .OrderByDescending(x => x.Count())
            .Take(5)
            .Select(x => (object)new
            {
                issue = x.Key,
                total = x.Count()
            })
            .ToArray();

        return new
        {
            ordersTotal = serviceOrders.Count,
            ordersOpen = serviceOrders.Count(x => x.Status is not ("entregado" or "archivado" or "cancelado")),
            ordersDelivered = serviceOrders.Count(x => x.Status == "entregado"),
            tasksOpen = tasks.Count(x => x.Status is not ("completada" or "cancelada")),
            tasksUrgent = tasks.Count(x => x.Priority == "urgente"),
            estimatedRevenue = serviceOrders.Sum(x => x.EstimatedCost),
            criticalStock,
            commonIssues = issues
        };
    }

    private async Task<int> GetNextOrderNumberAsync(CancellationToken cancellationToken)
    {
        var rows = await GetManyAsync<DbServiceOrder>($"service_orders?tenant_id=eq.{_bootstrap.TenantId}&select=folio&order=created_at.desc&limit=1", cancellationToken);
        var current = rows.FirstOrDefault()?.Folio;
        if (string.IsNullOrWhiteSpace(current)) return 1;
        var parts = current.Split('-', StringSplitOptions.RemoveEmptyEntries);
        return parts.Length == 2 && int.TryParse(parts[1], out var number) ? number + 1 : 1;
    }

    private async Task<int> GetNextServiceRequestNumberAsync(CancellationToken cancellationToken)
    {
        var rows = await GetManyAsync<DbServiceRequest>($"service_requests?tenant_id=eq.{_bootstrap.TenantId}&select=folio&order=created_at.desc&limit=1", cancellationToken);
        var current = rows.FirstOrDefault()?.Folio;
        if (string.IsNullOrWhiteSpace(current)) return 1;
        var parts = current.Split('-', StringSplitOptions.RemoveEmptyEntries);
        return parts.Length == 2 && int.TryParse(parts[1], out var number) ? number + 1 : 1;
    }

    private async Task<int> GetNextPurchaseOrderNumberAsync(CancellationToken cancellationToken)
    {
        var rows = await GetManyAsync<DbPurchaseOrder>($"purchase_orders?tenant_id=eq.{_bootstrap.TenantId}&select=folio&order=created_at.desc&limit=1", cancellationToken);
        var current = rows.FirstOrDefault()?.Folio;
        if (string.IsNullOrWhiteSpace(current)) return 1;
        var parts = current.Split('-', StringSplitOptions.RemoveEmptyEntries);
        return parts.Length == 2 && int.TryParse(parts[1], out var number) ? number + 1 : 1;
    }

    private async Task UpsertBranchInventoryAsync(Guid productId, decimal stockCurrent, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "branch_inventory?on_conflict=tenant_id,branch_id,product_id");
        request.Content = new StringContent(JsonSerializer.Serialize(new[]
        {
            new
            {
                tenant_id = _bootstrap.TenantId,
                branch_id = _bootstrap.BranchId,
                product_id = productId,
                stock_current = stockCurrent
            }
        }, JsonOptions), Encoding.UTF8, "application/json");
        request.Headers.Add("Prefer", "resolution=merge-duplicates,return=minimal");

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        await EnsureSuccessAsync(response);
    }

    private async Task<bool> ExistsAsync(string relativeUrl, CancellationToken cancellationToken)
    {
        var result = await GetManyAsync<JsonElement>(relativeUrl, cancellationToken);
        return result.Count > 0;
    }

    public async Task<T?> GetSingleAsync<T>(string relativeUrl, CancellationToken cancellationToken) where T : class
    {
        var items = await GetManyAsync<T>(relativeUrl, cancellationToken);
        return items.FirstOrDefault();
    }

    private async Task<T?> PatchSingleAsync<T>(string relativeUrl, object payload, CancellationToken cancellationToken, string select) where T : class
    {
        using var request = new HttpRequestMessage(HttpMethod.Patch, $"{relativeUrl}&select={Uri.EscapeDataString(select)}");
        request.Content = new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json");
        request.Headers.Add("Prefer", "return=representation");

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        await EnsureSuccessAsync(response);
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var items = await JsonSerializer.DeserializeAsync<List<T>>(stream, JsonOptions, cancellationToken);
        return items?.FirstOrDefault();
    }

    private async Task<IReadOnlyList<T>> GetManyAsync<T>(string relativeUrl, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, relativeUrl);
        using var response = await _httpClient.SendAsync(request, cancellationToken);
        await EnsureSuccessAsync(response);
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var items = await JsonSerializer.DeserializeAsync<List<T>>(stream, JsonOptions, cancellationToken);
        return items ?? [];
    }

    private async Task<T?> InsertSingleAsync<T>(string tableName, object payload, CancellationToken cancellationToken, string select) where T : class
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, $"{tableName}?select={Uri.EscapeDataString(select)}");
        request.Content = new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json");
        request.Headers.Add("Prefer", "return=representation");

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        await EnsureSuccessAsync(response);
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var items = await JsonSerializer.DeserializeAsync<List<T>>(stream, JsonOptions, cancellationToken);
        return items is null ? null : items.FirstOrDefault();
    }

    private async Task<T?> PatchSingleAsync<T>(string tableName, string filterQuery, object payload, CancellationToken cancellationToken, string select) where T : class
    {
        using var request = new HttpRequestMessage(new HttpMethod("PATCH"), $"{tableName}?{filterQuery}&select={Uri.EscapeDataString(select)}");
        request.Content = new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json");
        request.Headers.Add("Prefer", "return=representation");

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        await EnsureSuccessAsync(response);
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var items = await JsonSerializer.DeserializeAsync<List<T>>(stream, JsonOptions, cancellationToken);
        return items is null ? null : items.FirstOrDefault();
    }

    private async Task PatchAsync(string tableName, string filterQuery, object payload, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(new HttpMethod("PATCH"), $"{tableName}?{filterQuery}");
        request.Content = new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json");
        request.Headers.Add("Prefer", "return=minimal");

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        await EnsureSuccessAsync(response);
    }

    private async Task<T?> PostRpcAsync<T>(string functionName, object payload, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, $"rpc/{functionName}");
        request.Content = new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json");

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        await EnsureSuccessAsync(response);
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        return await JsonSerializer.DeserializeAsync<T>(stream, JsonOptions, cancellationToken);
    }

    private async Task<string> GenerateUniqueReferralCodeAsync(CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 25; attempt++)
        {
            var code = CreateReferralCode();
            var exists = await ExistsAsync($"users?referral_code=eq.{Uri.EscapeDataString(code)}&select=id", cancellationToken);
            if (!exists)
            {
                return code;
            }
        }

        throw new InvalidOperationException("No se pudo generar un código de referido único");
    }

    private static string CreateReferralCode()
    {
        const string letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        Span<byte> buffer = stackalloc byte[7];
        RandomNumberGenerator.Fill(buffer);

        Span<char> code = stackalloc char[8];
        code[0] = letters[buffer[0] % letters.Length];
        code[1] = letters[buffer[1] % letters.Length];
        code[2] = letters[buffer[2] % letters.Length];
        code[3] = '-';
        code[4] = (char)('0' + (buffer[3] % 10));
        code[5] = (char)('0' + (buffer[4] % 10));
        code[6] = (char)('0' + (buffer[5] % 10));
        code[7] = (char)('0' + (buffer[6] % 10));

        return new string(code);
    }

    private async Task UpsertSubscriptionPaymentAsync(
        Guid tenantId,
        Guid subscriptionId,
        string paymentId,
        string paymentStatus,
        string? payerEmail,
        decimal? amount,
        string? currencyId,
        DateTimeOffset paidAt,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "subscription_payments?on_conflict=provider,provider_payment_id");
        request.Content = new StringContent(JsonSerializer.Serialize(new[]
        {
            new
            {
                tenant_id = tenantId,
                subscription_id = subscriptionId,
                provider = "mercadopago",
                provider_payment_id = paymentId,
                provider_payment_status = paymentStatus,
                amount,
                currency_id = currencyId,
                payer_email = payerEmail,
                paid_at = paidAt,
                raw_payload_json = new
                {
                    payment_id = paymentId,
                    payment_status = paymentStatus,
                    payer_email = payerEmail,
                    amount,
                    currency_id = currencyId,
                    paid_at = paidAt
                }
            }
        }, JsonOptions), Encoding.UTF8, "application/json");
        request.Headers.Add("Prefer", "resolution=merge-duplicates,return=minimal");

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        await EnsureSuccessAsync(response);
    }

    private static DateTimeOffset MaxDate(DateTimeOffset? existing, DateTimeOffset fallback) =>
        existing.HasValue && existing.Value > fallback ? existing.Value : fallback;

    private static string NormalizeSubscriptionStatusFromPayment(string paymentStatus) =>
        paymentStatus.ToLowerInvariant() switch
        {
            "approved" or "authorized" => "active",
            "pending" or "in_process" => "past_due",
            "rejected" or "cancelled" or "refunded" or "charged_back" => "suspended",
            _ => "past_due"
        };

    private static async Task EnsureSuccessAsync(HttpResponseMessage response)
    {
        if (response.IsSuccessStatusCode) return;
        var body = await response.Content.ReadAsStringAsync();
        throw new HttpRequestException($"Supabase error {(int)response.StatusCode} {response.StatusCode}: {body}", null, response.StatusCode);
    }

    public sealed record DbTenant(Guid Id, string Name, string Slug);
    public sealed record DbBranch(Guid Id, string Name);
    public sealed record DbUser(Guid Id, Guid TenantId, Guid? BranchId, string FullName, string Email, string Role, bool IsActive, string? PasswordHash = null, string? PasswordSalt = null, string? ReferralCode = null, decimal Balance = 0);
    public sealed record DbSubscription(Guid Id, Guid TenantId, string PlanCode, string PlanName, decimal PriceMxn, string BillingInterval, string Status, DateTimeOffset? CurrentPeriodStart, DateTimeOffset? CurrentPeriodEnd, DateTimeOffset? GraceUntil, JsonElement? MetadataJson = null);
    public sealed record DbSubscriptionPayment(Guid Id, Guid SubscriptionId, string Provider, string ProviderPaymentId, string ProviderPaymentStatus, decimal? Amount, string? CurrencyId, string? PayerEmail, DateTimeOffset PaidAt, DateTimeOffset CreatedAt);
    public sealed record DbReferral(Guid Id, Guid ReferrerUserId, Guid ReferredUserId, string Status, decimal CommissionAmount, string ReferralCodeUsed);
    public sealed record DbReferralStatus(Guid Id, string Status, decimal CommissionAmount, string? PaymentProvider, string? ProviderPaymentId, DateTimeOffset? ConfirmedAt);
    public sealed record DbReferralListItem(Guid Id, Guid? ReferredTenantId, string ReferralCodeUsed, string Status, decimal CommissionAmount, string? PaymentProvider, string? ProviderPaymentId, DateTimeOffset? ConfirmedAt, DateTimeOffset CreatedAt);
    public sealed record DbCustomer(Guid Id, Guid TenantId, string FullName, string? Phone, string? Email, string Tag, string? Notes, DateTimeOffset CreatedAt);
    public sealed record DbServiceRequest(Guid Id, Guid? BranchId, string Folio, string CustomerName, string? CustomerPhone, string? CustomerEmail, string? DeviceType, string? DeviceModel, string? IssueDescription, string? Urgency, string Status, decimal QuotedTotal, decimal DepositAmount, decimal BalanceAmount, DateTimeOffset CreatedAt, string? SolicitudOrigenIp = null);
    public sealed record DbServiceOrder(Guid Id, Guid TenantId, Guid BranchId, Guid CustomerId, string Folio, string Status, string DeviceType, string? DeviceBrand, string? DeviceModel, string ReportedIssue, string Priority, DateOnly? PromisedDate, decimal EstimatedCost, DateTimeOffset CreatedAt, string? CasoResolucionTecnica = null);
    public sealed record DbTechnicianOrder(Guid Id, string Folio, string Status, string? DeviceType, string? DeviceBrand, string? DeviceModel, string? ReportedIssue, string? InternalDiagnosis, decimal FinalCost, string? Priority, DateOnly? PromisedDate, DateTimeOffset CreatedAt, string? CasoResolucionTecnica = null);
    public sealed record DbArchivedOrder(Guid Id, string Folio, string Status, string? DeviceType, string? DeviceBrand, string? DeviceModel, string? ReportedIssue, decimal FinalCost, DateTimeOffset? ArchivedAt, DateTimeOffset? DeliveredAt, DateTimeOffset UpdatedAt);
    public sealed record DbTask(Guid Id, Guid? BranchId, Guid? ServiceOrderId, Guid? ServiceRequestId, string Title, string? Description, string Status, string Priority, Guid? AssignedUserId, DateTimeOffset? DueDate, DateTimeOffset CreatedAt);
    public sealed record DbTaskHistory(Guid Id, Guid TaskId);
    public sealed record DbSupplier(Guid Id, string BusinessName, string? ContactName, string? Phone, string? Email, string? Categories);
    public sealed record DbProduct(Guid Id, Guid TenantId, string Sku, string Name, string? Category, string? Brand, string? CompatibleModel, Guid? PrimarySupplierId, decimal Cost, decimal SalePrice, decimal MinimumStock, string? Unit, string? Location, DateTimeOffset CreatedAt);
    public sealed record DbBranchInventory(Guid ProductId, decimal StockCurrent);
    public sealed record DbPurchaseOrder(Guid Id, string Folio, string Status, Guid? SupplierId, DateOnly? ExpectedDate, decimal Total, DateTimeOffset CreatedAt);
    public sealed record DbPurchaseOrderItem(Guid Id, Guid PurchaseOrderId);
    public sealed record DbInventoryMovement(Guid Id, Guid ProductId, string MovementType, decimal Quantity);
    public sealed record DbExpense(Guid Id, Guid? BranchId, Guid? SupplierId, Guid? ServiceOrderId, Guid? PurchaseOrderId, string ExpenseType, string Category, string Concept, string? Description, decimal Amount, string? PaymentMethod, DateOnly ExpenseDate, DateTimeOffset CreatedAt);
    public sealed record DbBranchExtended(Guid Id, string Name, string? Code, string? Address, string? City, string? State, string? Phone, bool IsActive, DateTimeOffset CreatedAt);
    public sealed record RegistrationResult(Guid TenantId, string TenantName, string TenantSlug, Guid UserId, string ReferralCode, Guid? ReferrerUserId);
}
