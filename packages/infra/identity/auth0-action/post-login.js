/**
 * Auth0 Post-Login Action v13
 * Action ID: 57dc6f06-f2bf-41b0-ba11-9cec06f3de83
 * Runtime: Node 22
 *
 * Routing logic:
 *   - KitchenSink clients (client name starts with "KitchenSink"):
 *       1. Obtain M2M access token via client_credentials grant
 *       2. POST /v1/users/upsert to identity-webhooks service
 *       3. Inject namespaced JWT claims: sub, account_id, tier
 *   - All other clients (Armoury, etc.):
 *       - Existing Armoury path preserved as-is
 *       - No KitchenSink claims injected
 *
 * Required Action Secrets (configure in Auth0 Dashboard → Actions → Secrets):
 *   AUTH0_DOMAIN               — e.g. your-tenant.us.auth0.com
 *   KITCHENSINK_WEBHOOK_URL    — e.g. https://api.identity.kitchensink.app/v1/users/upsert
 *   KITCHENSINK_M2M_CLIENT_ID  — M2M client ID for identity-webhooks
 *   KITCHENSINK_M2M_CLIENT_SECRET — M2M client secret
 *   KITCHENSINK_M2M_AUDIENCE   — e.g. https://identity.kitchensink.app/
 *   ARMOURY_WEBHOOK_URL        — existing Armoury webhook URL (if applicable)
 */

const CLAIM_NS = 'https://kitchensink.app/claims/';

/**
 * Fetches an M2M access token using the client_credentials grant.
 * Returns the access_token string, or null on failure.
 *
 * @param {string} domain - Auth0 tenant domain (no protocol)
 * @param {string} clientId
 * @param {string} clientSecret
 * @param {string} audience
 * @returns {Promise<string|null>}
 */
async function getM2MToken(domain, clientId, clientSecret, audience) {
    const res = await fetch(`https://${domain}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
            audience,
        }),
    });

    if (!res.ok) {
        console.error('[post-login] M2M token request failed', { status: res.status });
        return null;
    }

    const body = await res.json();
    return body.access_token ?? null;
}

/**
 * Upserts the authenticated user in the KitchenSink identity-webhooks service.
 * Returns the parsed response body, or null on failure.
 *
 * @param {string} webhookUrl
 * @param {string} accessToken
 * @param {{ sub: string, email: string, name: string, picture: string }} user
 * @returns {Promise<{ accountId?: string, tier?: string }|null>}
 */
async function upsertKitchenSinkUser(webhookUrl, accessToken, user) {
    const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            sub: user.sub,
            email: user.email,
            name: user.name,
            picture: user.picture,
        }),
    });

    if (!res.ok) {
        console.error('[post-login] KitchenSink upsert failed', { status: res.status });
        return null;
    }

    return res.json();
}

/**
 * Handles the KitchenSink login path:
 *   1. Obtain M2M token
 *   2. Upsert user
 *   3. Set namespaced claims on the access token
 *
 * Errors are non-fatal — login is never blocked.
 *
 * @param {import('@auth0/actions-types').PostLoginEvent} event
 * @param {import('@auth0/actions-types').PostLoginAPI} api
 */
async function handleKitchenSink(event, api) {
    const {
        AUTH0_DOMAIN,
        KITCHENSINK_WEBHOOK_URL,
        KITCHENSINK_M2M_CLIENT_ID,
        KITCHENSINK_M2M_CLIENT_SECRET,
        KITCHENSINK_M2M_AUDIENCE,
    } = event.secrets;

    const accessToken = await getM2MToken(
        AUTH0_DOMAIN,
        KITCHENSINK_M2M_CLIENT_ID,
        KITCHENSINK_M2M_CLIENT_SECRET,
        KITCHENSINK_M2M_AUDIENCE,
    );

    if (!accessToken) {
        // Non-fatal: log and allow login to proceed without custom claims
        console.error('[post-login] Skipping KS upsert — could not obtain M2M token');
        return;
    }

    const userData = await upsertKitchenSinkUser(KITCHENSINK_WEBHOOK_URL, accessToken, {
        sub: event.user.user_id,
        email: event.user.email,
        name: event.user.name,
        picture: event.user.picture,
    });

    if (!userData) {
        // Non-fatal: log and allow login to proceed without custom claims
        console.error('[post-login] Skipping KS claims — upsert returned no data');
        return;
    }

    api.accessToken.setCustomClaim(`${CLAIM_NS}sub`, event.user.user_id);
    api.accessToken.setCustomClaim(`${CLAIM_NS}account_id`, userData.accountId ?? null);
    api.accessToken.setCustomClaim(`${CLAIM_NS}tier`, userData.tier ?? 'free');

    console.log('[post-login] KitchenSink claims set', {
        sub: event.user.user_id,
        accountId: userData.accountId,
        tier: userData.tier,
    });
}

/**
 * Handles the Armoury / other-client login path.
 * Preserves existing Armoury behavior; no KitchenSink claims are injected.
 *
 * @param {import('@auth0/actions-types').PostLoginEvent} event
 * @param {import('@auth0/actions-types').PostLoginAPI} api
 */
async function handleArmoury(event, api) {
    // Armoury path: preserved as-is.
    // If an Armoury webhook is configured, call it here.
    // No KitchenSink namespaced claims are set for this path.
    const armouryWebhookUrl = event.secrets.ARMOURY_WEBHOOK_URL;

    if (!armouryWebhookUrl) {
        // No Armoury webhook configured — nothing to do.
        return;
    }

    const res = await fetch(armouryWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sub: event.user.user_id,
            email: event.user.email,
            name: event.user.name,
            picture: event.user.picture,
            client_id: event.client.client_id,
            client_name: event.client.name,
        }),
    });

    if (!res.ok) {
        // Non-fatal: log and allow login to proceed
        console.error('[post-login] Armoury webhook failed', { status: res.status });
    }
}

/**
 * Auth0 Post-Login Action entry point.
 *
 * @param {import('@auth0/actions-types').PostLoginEvent} event
 * @param {import('@auth0/actions-types').PostLoginAPI} api
 */
exports.onExecutePostLogin = async (event, api) => {
    const isKitchenSink = typeof event.client.name === 'string' && event.client.name.startsWith('KitchenSink');

    if (isKitchenSink) {
        await handleKitchenSink(event, api);
    } else {
        await handleArmoury(event, api);
    }
};
