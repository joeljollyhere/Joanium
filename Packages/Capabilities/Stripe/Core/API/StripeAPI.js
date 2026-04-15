const BASE = 'https://api.stripe.com/v1';

function headers(creds) {
  return {
    Authorization: `Bearer ${creds.token}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
}

async function stripeFetch(path, creds) {
  const res = await fetch(`${BASE}${path}`, { headers: headers(creds) });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message ?? `Stripe API error: ${res.status}`);
  }
  return res.json();
}

// ── Existing ───────────────────────────────────────────────────────────────

export async function getBalance(creds) {
  const b = await stripeFetch('/balance', creds);
  return {
    available: (b.available ?? []).map((a) => ({
      amount: a.amount / 100,
      currency: a.currency.toUpperCase(),
    })),
    pending: (b.pending ?? []).map((p) => ({
      amount: p.amount / 100,
      currency: p.currency.toUpperCase(),
    })),
  };
}

export async function listCustomers(creds, limit = 10) {
  const data = await stripeFetch(`/customers?limit=${limit}`, creds);
  return (data.data ?? []).map((c) => ({
    id: c.id,
    email: c.email ?? null,
    name: c.name ?? null,
    created: c.created,
    currency: c.currency ?? null,
  }));
}

export async function listCharges(creds, limit = 10) {
  const data = await stripeFetch(`/charges?limit=${limit}`, creds);
  return (data.data ?? []).map((c) => ({
    id: c.id,
    amount: c.amount / 100,
    currency: c.currency?.toUpperCase() ?? '',
    status: c.status,
    description: c.description ?? null,
    receiptEmail: c.receipt_email ?? null,
    created: c.created,
  }));
}

export async function listSubscriptions(creds, limit = 10) {
  const data = await stripeFetch(`/subscriptions?limit=${limit}&status=all`, creds);
  return (data.data ?? []).map((s) => ({
    id: s.id,
    status: s.status,
    customerId: s.customer,
    currentPeriodEnd: s.current_period_end,
    cancelAtPeriodEnd: s.cancel_at_period_end,
    created: s.created,
  }));
}

// ── New: List endpoints ────────────────────────────────────────────────────

export async function listInvoices(creds, limit = 10) {
  const data = await stripeFetch(`/invoices?limit=${limit}`, creds);
  return (data.data ?? []).map((i) => ({
    id: i.id,
    customerId: i.customer,
    customerEmail: i.customer_email ?? null,
    amountDue: i.amount_due / 100,
    amountPaid: i.amount_paid / 100,
    currency: i.currency?.toUpperCase() ?? '',
    status: i.status,
    dueDate: i.due_date ?? null,
    created: i.created,
  }));
}

export async function listPaymentIntents(creds, limit = 10) {
  const data = await stripeFetch(`/payment_intents?limit=${limit}`, creds);
  return (data.data ?? []).map((p) => ({
    id: p.id,
    amount: p.amount / 100,
    currency: p.currency?.toUpperCase() ?? '',
    status: p.status,
    customerId: p.customer ?? null,
    description: p.description ?? null,
    created: p.created,
  }));
}

export async function listProducts(creds, limit = 10) {
  const data = await stripeFetch(`/products?limit=${limit}`, creds);
  return (data.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    active: p.active,
    created: p.created,
  }));
}

export async function listPrices(creds, limit = 10) {
  const data = await stripeFetch(`/prices?limit=${limit}`, creds);
  return (data.data ?? []).map((p) => ({
    id: p.id,
    productId: p.product,
    unitAmount: p.unit_amount != null ? p.unit_amount / 100 : null,
    currency: p.currency?.toUpperCase() ?? '',
    type: p.type,
    recurring: p.recurring
      ? { interval: p.recurring.interval, intervalCount: p.recurring.interval_count }
      : null,
    active: p.active,
    created: p.created,
  }));
}

export async function listRefunds(creds, limit = 10) {
  const data = await stripeFetch(`/refunds?limit=${limit}`, creds);
  return (data.data ?? []).map((r) => ({
    id: r.id,
    amount: r.amount / 100,
    currency: r.currency?.toUpperCase() ?? '',
    chargeId: r.charge,
    status: r.status,
    reason: r.reason ?? null,
    created: r.created,
  }));
}

export async function listDisputes(creds, limit = 10) {
  const data = await stripeFetch(`/disputes?limit=${limit}`, creds);
  return (data.data ?? []).map((d) => ({
    id: d.id,
    amount: d.amount / 100,
    currency: d.currency?.toUpperCase() ?? '',
    chargeId: d.charge,
    status: d.status,
    reason: d.reason,
    created: d.created,
  }));
}

export async function listPayouts(creds, limit = 10) {
  const data = await stripeFetch(`/payouts?limit=${limit}`, creds);
  return (data.data ?? []).map((p) => ({
    id: p.id,
    amount: p.amount / 100,
    currency: p.currency?.toUpperCase() ?? '',
    status: p.status,
    arrivalDate: p.arrival_date,
    description: p.description ?? null,
    created: p.created,
  }));
}

export async function listEvents(creds, limit = 10) {
  const data = await stripeFetch(`/events?limit=${limit}`, creds);
  return (data.data ?? []).map((e) => ({
    id: e.id,
    type: e.type,
    objectId: e.data?.object?.id ?? null,
    created: e.created,
  }));
}

export async function listCoupons(creds, limit = 10) {
  const data = await stripeFetch(`/coupons?limit=${limit}`, creds);
  return (data.data ?? []).map((c) => ({
    id: c.id,
    name: c.name ?? null,
    percentOff: c.percent_off ?? null,
    amountOff: c.amount_off != null ? c.amount_off / 100 : null,
    currency: c.currency?.toUpperCase() ?? null,
    duration: c.duration,
    timesRedeemed: c.times_redeemed,
    valid: c.valid,
    created: c.created,
  }));
}

export async function listPromotionCodes(creds, limit = 10) {
  const data = await stripeFetch(`/promotion_codes?limit=${limit}`, creds);
  return (data.data ?? []).map((p) => ({
    id: p.id,
    code: p.code,
    couponId: p.coupon?.id ?? null,
    active: p.active,
    timesRedeemed: p.times_redeemed,
    created: p.created,
  }));
}

export async function listTaxRates(creds, limit = 10) {
  const data = await stripeFetch(`/tax_rates?limit=${limit}`, creds);
  return (data.data ?? []).map((t) => ({
    id: t.id,
    displayName: t.display_name,
    percentage: t.percentage,
    inclusive: t.inclusive,
    active: t.active,
    country: t.country ?? null,
    state: t.state ?? null,
    created: t.created,
  }));
}

export async function listCheckoutSessions(creds, limit = 10) {
  const data = await stripeFetch(`/checkout/sessions?limit=${limit}`, creds);
  return (data.data ?? []).map((s) => ({
    id: s.id,
    status: s.status,
    paymentStatus: s.payment_status,
    customerId: s.customer ?? null,
    customerEmail: s.customer_email ?? null,
    amountTotal: s.amount_total != null ? s.amount_total / 100 : null,
    currency: s.currency?.toUpperCase() ?? null,
    created: s.created,
  }));
}

export async function listBalanceTransactions(creds, limit = 10) {
  const data = await stripeFetch(`/balance_transactions?limit=${limit}`, creds);
  return (data.data ?? []).map((t) => ({
    id: t.id,
    amount: t.amount / 100,
    fee: t.fee / 100,
    net: t.net / 100,
    currency: t.currency?.toUpperCase() ?? '',
    type: t.type,
    status: t.status,
    created: t.created,
  }));
}

export async function listTransfers(creds, limit = 10) {
  const data = await stripeFetch(`/transfers?limit=${limit}`, creds);
  return (data.data ?? []).map((t) => ({
    id: t.id,
    amount: t.amount / 100,
    currency: t.currency?.toUpperCase() ?? '',
    destination: t.destination,
    description: t.description ?? null,
    created: t.created,
  }));
}

export async function listSetupIntents(creds, limit = 10) {
  const data = await stripeFetch(`/setup_intents?limit=${limit}`, creds);
  return (data.data ?? []).map((s) => ({
    id: s.id,
    status: s.status,
    customerId: s.customer ?? null,
    paymentMethodId: s.payment_method ?? null,
    created: s.created,
  }));
}

export async function listWebhookEndpoints(creds, limit = 10) {
  const data = await stripeFetch(`/webhook_endpoints?limit=${limit}`, creds);
  return (data.data ?? []).map((w) => ({
    id: w.id,
    url: w.url,
    status: w.status,
    enabledEvents: w.enabled_events,
    created: w.created,
  }));
}

// ── New: Get by ID ─────────────────────────────────────────────────────────

export async function getCustomer(creds, id) {
  const c = await stripeFetch(`/customers/${id}`, creds);
  return {
    id: c.id,
    email: c.email ?? null,
    name: c.name ?? null,
    currency: c.currency ?? null,
    balance: c.balance != null ? c.balance / 100 : null,
    delinquent: c.delinquent,
    created: c.created,
  };
}

export async function getCharge(creds, id) {
  const c = await stripeFetch(`/charges/${id}`, creds);
  return {
    id: c.id,
    amount: c.amount / 100,
    currency: c.currency?.toUpperCase() ?? '',
    status: c.status,
    description: c.description ?? null,
    receiptEmail: c.receipt_email ?? null,
    customerId: c.customer ?? null,
    created: c.created,
  };
}

export async function getSubscription(creds, id) {
  const s = await stripeFetch(`/subscriptions/${id}`, creds);
  return {
    id: s.id,
    status: s.status,
    customerId: s.customer,
    currentPeriodEnd: s.current_period_end,
    cancelAtPeriodEnd: s.cancel_at_period_end,
    created: s.created,
  };
}

export async function getInvoice(creds, id) {
  const i = await stripeFetch(`/invoices/${id}`, creds);
  return {
    id: i.id,
    customerId: i.customer,
    customerEmail: i.customer_email ?? null,
    amountDue: i.amount_due / 100,
    amountPaid: i.amount_paid / 100,
    currency: i.currency?.toUpperCase() ?? '',
    status: i.status,
    dueDate: i.due_date ?? null,
    created: i.created,
  };
}

export async function getPaymentIntent(creds, id) {
  const p = await stripeFetch(`/payment_intents/${id}`, creds);
  return {
    id: p.id,
    amount: p.amount / 100,
    currency: p.currency?.toUpperCase() ?? '',
    status: p.status,
    customerId: p.customer ?? null,
    description: p.description ?? null,
    created: p.created,
  };
}

export async function getProduct(creds, id) {
  const p = await stripeFetch(`/products/${id}`, creds);
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    active: p.active,
    created: p.created,
  };
}

export async function getRefund(creds, id) {
  const r = await stripeFetch(`/refunds/${id}`, creds);
  return {
    id: r.id,
    amount: r.amount / 100,
    currency: r.currency?.toUpperCase() ?? '',
    chargeId: r.charge,
    status: r.status,
    reason: r.reason ?? null,
    created: r.created,
  };
}

export async function getDispute(creds, id) {
  const d = await stripeFetch(`/disputes/${id}`, creds);
  return {
    id: d.id,
    amount: d.amount / 100,
    currency: d.currency?.toUpperCase() ?? '',
    chargeId: d.charge,
    status: d.status,
    reason: d.reason,
    evidenceDueBy: d.evidence_details?.due_by ?? null,
    created: d.created,
  };
}

export async function getPayout(creds, id) {
  const p = await stripeFetch(`/payouts/${id}`, creds);
  return {
    id: p.id,
    amount: p.amount / 100,
    currency: p.currency?.toUpperCase() ?? '',
    status: p.status,
    arrivalDate: p.arrival_date,
    description: p.description ?? null,
    created: p.created,
  };
}

export async function getCoupon(creds, id) {
  const c = await stripeFetch(`/coupons/${id}`, creds);
  return {
    id: c.id,
    name: c.name ?? null,
    percentOff: c.percent_off ?? null,
    amountOff: c.amount_off != null ? c.amount_off / 100 : null,
    currency: c.currency?.toUpperCase() ?? null,
    duration: c.duration,
    timesRedeemed: c.times_redeemed,
    valid: c.valid,
    created: c.created,
  };
}
