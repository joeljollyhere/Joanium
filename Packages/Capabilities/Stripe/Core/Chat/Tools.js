export const STRIPE_TOOLS = [
  // ── Existing ──────────────────────────────────────────────────────────────
  {
    name: 'stripe_get_balance',
    description:
      'Get the current Stripe account balance — available and pending amounts by currency.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {},
  },
  {
    name: 'stripe_list_charges',
    description:
      'List the most recent Stripe charges with amount, currency, status, and receipt email.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of charges to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // ── New: List tools ────────────────────────────────────────────────────────
  {
    name: 'stripe_list_customers',
    description:
      'List recent Stripe customers with their email, name, currency, and creation date.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of customers to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_subscriptions',
    description:
      'List all Stripe subscriptions (all statuses) with customer ID, period end, and cancellation info.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of subscriptions to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_invoices',
    description: 'List recent Stripe invoices with amount due, amount paid, currency, and status.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of invoices to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_payment_intents',
    description:
      'List recent Stripe PaymentIntents with amount, currency, status, and linked customer.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of payment intents to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_products',
    description: 'List Stripe products with their name, description, and active status.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of products to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_prices',
    description:
      'List Stripe prices including unit amount, currency, billing interval, and linked product.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of prices to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_refunds',
    description:
      'List recent Stripe refunds with amount, currency, status, reason, and linked charge.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of refunds to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_disputes',
    description:
      'List open and resolved Stripe disputes with amount, reason, status, and linked charge.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of disputes to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_payouts',
    description:
      'List Stripe payouts to your bank account with amount, status, and expected arrival date.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of payouts to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_events',
    description: 'List recent Stripe events (webhooks log) with event type and related object ID.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of events to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_coupons',
    description:
      'List Stripe coupons with discount value (percent or fixed), duration, and redemption count.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of coupons to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_promotion_codes',
    description:
      'List Stripe promotion codes with their code string, linked coupon, active status, and redemption count.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of promotion codes to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_tax_rates',
    description:
      'List Stripe tax rates with percentage, inclusive/exclusive flag, country, and active status.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of tax rates to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_checkout_sessions',
    description:
      'List recent Stripe Checkout Sessions with payment status, total amount, and customer info.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of sessions to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_balance_transactions',
    description:
      'List Stripe balance transactions showing gross amount, fee, net amount, and transaction type.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of transactions to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_transfers',
    description:
      'List Stripe transfers to connected accounts with amount, currency, and destination.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of transfers to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_setup_intents',
    description:
      'List Stripe SetupIntents used to save payment methods, with status and linked customer.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of setup intents to return (1–100, default 10)',
        required: false,
      },
    },
  },
  {
    name: 'stripe_list_webhook_endpoints',
    description:
      'List configured Stripe webhook endpoints with their URL, status, and subscribed event types.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      limit: {
        type: 'number',
        description: 'Number of webhook endpoints to return (1–100, default 10)',
        required: false,
      },
    },
  },

  // ── New: Get by ID tools ───────────────────────────────────────────────────
  {
    name: 'stripe_get_customer',
    description:
      'Retrieve a single Stripe customer by ID, including email, name, currency, and balance.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: { type: 'string', description: 'Stripe customer ID (e.g. cus_...)', required: true },
    },
  },
  {
    name: 'stripe_get_charge',
    description:
      'Retrieve a single Stripe charge by ID with full amount, status, receipt email, and customer.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: { type: 'string', description: 'Stripe charge ID (e.g. ch_...)', required: true },
    },
  },
  {
    name: 'stripe_get_subscription',
    description:
      'Retrieve a single Stripe subscription by ID with status, billing period, and cancellation details.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: { type: 'string', description: 'Stripe subscription ID (e.g. sub_...)', required: true },
    },
  },
  {
    name: 'stripe_get_invoice',
    description:
      'Retrieve a single Stripe invoice by ID with amount due, amount paid, status, and due date.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: { type: 'string', description: 'Stripe invoice ID (e.g. in_...)', required: true },
    },
  },
  {
    name: 'stripe_get_payment_intent',
    description:
      'Retrieve a single Stripe PaymentIntent by ID with amount, currency, status, and customer.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: { type: 'string', description: 'Stripe PaymentIntent ID (e.g. pi_...)', required: true },
    },
  },
  {
    name: 'stripe_get_product',
    description:
      'Retrieve a single Stripe product by ID with name, description, and active status.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: { type: 'string', description: 'Stripe product ID (e.g. prod_...)', required: true },
    },
  },
  {
    name: 'stripe_get_refund',
    description:
      'Retrieve a single Stripe refund by ID with amount, status, reason, and linked charge.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: { type: 'string', description: 'Stripe refund ID (e.g. re_...)', required: true },
    },
  },
  {
    name: 'stripe_get_dispute',
    description:
      'Retrieve a single Stripe dispute by ID with amount, reason, status, and evidence due date.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: { type: 'string', description: 'Stripe dispute ID (e.g. dp_...)', required: true },
    },
  },
  {
    name: 'stripe_get_payout',
    description:
      'Retrieve a single Stripe payout by ID with amount, status, and bank arrival date.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: { type: 'string', description: 'Stripe payout ID (e.g. po_...)', required: true },
    },
  },
  {
    name: 'stripe_get_coupon',
    description:
      'Retrieve a single Stripe coupon by ID with discount details, duration, and redemption count.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {
      id: { type: 'string', description: 'Stripe coupon ID', required: true },
    },
  },
];
