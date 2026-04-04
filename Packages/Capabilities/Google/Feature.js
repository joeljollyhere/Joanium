import defineFeature from '../Core/DefineFeature.js';

async function getGoogleWorkspaceModule() {
  return import('./GoogleWorkspace.js');
}

async function getProfileEmail(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Token validation failed (${response.status})`);
  }

  const profile = await response.json();
  return profile.email ?? null;
}

export default defineFeature({
  id: 'google-workspace',
  name: 'Google Workspace',
  connectors: {
    services: [
      {
        id: 'google',
        name: 'Google Workspace',
        icon: 'Google',
        description:
          'Connect once with one Client ID and get access to your enabled Google services.',
        helpUrl: 'https://console.cloud.google.com/apis/credentials',
        helpText: 'Create OAuth credentials ->',
        oauthType: 'google',
        connectMethod: 'oauthStart',
        connectLabel: 'Sign in with Google',
        connectingLabel: 'Opening Google sign-in...',
        serviceRefreshMethod: 'detectServices',
        subServices: [],
        setupSteps: [
          'Go to Google Cloud Console and create or select a project',
          'Enable the Google APIs you want to use',
          'Create an OAuth 2.0 Client ID with Desktop App type',
          'Copy the Client ID and Client Secret below',
        ],
        capabilities: [],
        fields: [
          {
            key: 'clientId',
            label: 'Client ID',
            placeholder: 'xxxxxxxxxxxx.apps.googleusercontent.com',
            type: 'text',
            hint: 'Google Cloud Console -> APIs & Services -> Credentials -> OAuth 2.0 Client IDs',
          },
          {
            key: 'clientSecret',
            label: 'Client Secret',
            placeholder: 'GOCSPX-...',
            type: 'password',
            hint: 'Keep it private.',
          },
        ],
        automations: [],
        defaultState: {
          enabled: false,
          credentials: {},
        },
        async validate(ctx) {
          const creds = ctx.connectorEngine?.getCredentials('google');
          if (!creds?.accessToken) return { ok: false, error: 'No credentials stored' };

          const { getFreshCreds } = await getGoogleWorkspaceModule();
          const freshCreds = await getFreshCreds(creds);
          const email = await getProfileEmail(freshCreds.accessToken);
          if (email) ctx.connectorEngine?.updateCredentials('google', { email });
          return { ok: true, email };
        },
      },
    ],
  },
  lifecycle: {
    async onBoot(ctx) {
      const { setConnectorEngine } = await getGoogleWorkspaceModule();
      setConnectorEngine(ctx.connectorEngine);
    },
  },
  main: {
    methods: {
      async oauthStart(ctx, { clientId, clientSecret }) {
        if (!clientId?.trim() || !clientSecret?.trim()) {
          return { ok: false, error: 'Client ID and Client Secret are required' };
        }

        const { startOAuthFlow, detectServices } = await getGoogleWorkspaceModule();
        const tokens = await startOAuthFlow(clientId.trim(), clientSecret.trim());
        const services = await detectServices(tokens).catch(() => ({}));
        tokens.services = services;

        ctx.connectorEngine?.saveConnector('google', tokens);
        ctx.invalidateSystemPrompt?.();

        return { ok: true, email: tokens.email, services };
      },

      async detectServices(ctx) {
        const creds = ctx.connectorEngine?.getCredentials('google');
        if (!creds?.accessToken) {
          return { ok: false, error: 'Google Workspace not connected' };
        }

        const { detectServices } = await getGoogleWorkspaceModule();
        const services = await detectServices(creds);
        ctx.connectorEngine?.updateCredentials('google', { services });
        ctx.invalidateSystemPrompt?.();
        return { ok: true, services };
      },
    },
  },
  prompt: {
    async getContext(ctx) {
      const creds = ctx.connectorEngine?.getCredentials('google');
      if (!creds?.email) return null;

      return {
        connectedServices: [`Google Workspace (${creds.email})`],
        sections: [],
      };
    },
  },
});
