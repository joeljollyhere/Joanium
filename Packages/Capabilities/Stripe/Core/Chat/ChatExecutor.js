import * as StripeAPI from '../API/StripeAPI.js';
import { getStripeCredentials, notConnected } from '../Shared/Common.js';

export async function executeStripeChatTool(ctx, toolName, params) {
  const creds = getStripeCredentials(ctx);
  if (!creds) return notConnected();

  try {
    // ── Existing ────────────────────────────────────────────────────────────
    if (toolName === 'stripe_get_balance') {
      const balance = await StripeAPI.getBalance(creds);
      return { ok: true, balance };
    }

    if (toolName === 'stripe_list_charges') {
      const charges = await StripeAPI.listCharges(creds, params?.limit ?? 10);
      return { ok: true, charges };
    }

    // ── New: List tools ──────────────────────────────────────────────────────
    if (toolName === 'stripe_list_customers') {
      const customers = await StripeAPI.listCustomers(creds, params?.limit ?? 10);
      return { ok: true, customers };
    }

    if (toolName === 'stripe_list_subscriptions') {
      const subscriptions = await StripeAPI.listSubscriptions(creds, params?.limit ?? 10);
      return { ok: true, subscriptions };
    }

    if (toolName === 'stripe_list_invoices') {
      const invoices = await StripeAPI.listInvoices(creds, params?.limit ?? 10);
      return { ok: true, invoices };
    }

    if (toolName === 'stripe_list_payment_intents') {
      const paymentIntents = await StripeAPI.listPaymentIntents(creds, params?.limit ?? 10);
      return { ok: true, paymentIntents };
    }

    if (toolName === 'stripe_list_products') {
      const products = await StripeAPI.listProducts(creds, params?.limit ?? 10);
      return { ok: true, products };
    }

    if (toolName === 'stripe_list_prices') {
      const prices = await StripeAPI.listPrices(creds, params?.limit ?? 10);
      return { ok: true, prices };
    }

    if (toolName === 'stripe_list_refunds') {
      const refunds = await StripeAPI.listRefunds(creds, params?.limit ?? 10);
      return { ok: true, refunds };
    }

    if (toolName === 'stripe_list_disputes') {
      const disputes = await StripeAPI.listDisputes(creds, params?.limit ?? 10);
      return { ok: true, disputes };
    }

    if (toolName === 'stripe_list_payouts') {
      const payouts = await StripeAPI.listPayouts(creds, params?.limit ?? 10);
      return { ok: true, payouts };
    }

    if (toolName === 'stripe_list_events') {
      const events = await StripeAPI.listEvents(creds, params?.limit ?? 10);
      return { ok: true, events };
    }

    if (toolName === 'stripe_list_coupons') {
      const coupons = await StripeAPI.listCoupons(creds, params?.limit ?? 10);
      return { ok: true, coupons };
    }

    if (toolName === 'stripe_list_promotion_codes') {
      const promotionCodes = await StripeAPI.listPromotionCodes(creds, params?.limit ?? 10);
      return { ok: true, promotionCodes };
    }

    if (toolName === 'stripe_list_tax_rates') {
      const taxRates = await StripeAPI.listTaxRates(creds, params?.limit ?? 10);
      return { ok: true, taxRates };
    }

    if (toolName === 'stripe_list_checkout_sessions') {
      const checkoutSessions = await StripeAPI.listCheckoutSessions(creds, params?.limit ?? 10);
      return { ok: true, checkoutSessions };
    }

    if (toolName === 'stripe_list_balance_transactions') {
      const balanceTransactions = await StripeAPI.listBalanceTransactions(
        creds,
        params?.limit ?? 10,
      );
      return { ok: true, balanceTransactions };
    }

    if (toolName === 'stripe_list_transfers') {
      const transfers = await StripeAPI.listTransfers(creds, params?.limit ?? 10);
      return { ok: true, transfers };
    }

    if (toolName === 'stripe_list_setup_intents') {
      const setupIntents = await StripeAPI.listSetupIntents(creds, params?.limit ?? 10);
      return { ok: true, setupIntents };
    }

    if (toolName === 'stripe_list_webhook_endpoints') {
      const webhookEndpoints = await StripeAPI.listWebhookEndpoints(creds, params?.limit ?? 10);
      return { ok: true, webhookEndpoints };
    }

    // ── New: Get by ID tools ─────────────────────────────────────────────────
    if (toolName === 'stripe_get_customer') {
      if (!params?.id) return { ok: false, error: 'Missing required parameter: id' };
      const customer = await StripeAPI.getCustomer(creds, params.id);
      return { ok: true, customer };
    }

    if (toolName === 'stripe_get_charge') {
      if (!params?.id) return { ok: false, error: 'Missing required parameter: id' };
      const charge = await StripeAPI.getCharge(creds, params.id);
      return { ok: true, charge };
    }

    if (toolName === 'stripe_get_subscription') {
      if (!params?.id) return { ok: false, error: 'Missing required parameter: id' };
      const subscription = await StripeAPI.getSubscription(creds, params.id);
      return { ok: true, subscription };
    }

    if (toolName === 'stripe_get_invoice') {
      if (!params?.id) return { ok: false, error: 'Missing required parameter: id' };
      const invoice = await StripeAPI.getInvoice(creds, params.id);
      return { ok: true, invoice };
    }

    if (toolName === 'stripe_get_payment_intent') {
      if (!params?.id) return { ok: false, error: 'Missing required parameter: id' };
      const paymentIntent = await StripeAPI.getPaymentIntent(creds, params.id);
      return { ok: true, paymentIntent };
    }

    if (toolName === 'stripe_get_product') {
      if (!params?.id) return { ok: false, error: 'Missing required parameter: id' };
      const product = await StripeAPI.getProduct(creds, params.id);
      return { ok: true, product };
    }

    if (toolName === 'stripe_get_refund') {
      if (!params?.id) return { ok: false, error: 'Missing required parameter: id' };
      const refund = await StripeAPI.getRefund(creds, params.id);
      return { ok: true, refund };
    }

    if (toolName === 'stripe_get_dispute') {
      if (!params?.id) return { ok: false, error: 'Missing required parameter: id' };
      const dispute = await StripeAPI.getDispute(creds, params.id);
      return { ok: true, dispute };
    }

    if (toolName === 'stripe_get_payout') {
      if (!params?.id) return { ok: false, error: 'Missing required parameter: id' };
      const payout = await StripeAPI.getPayout(creds, params.id);
      return { ok: true, payout };
    }

    if (toolName === 'stripe_get_coupon') {
      if (!params?.id) return { ok: false, error: 'Missing required parameter: id' };
      const coupon = await StripeAPI.getCoupon(creds, params.id);
      return { ok: true, coupon };
    }

    return null;
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
