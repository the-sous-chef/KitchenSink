# Adversarial Findings: Feature 002 Research

### [FIXED] "For this feature, we need REST API + Lambda REQUEST authorizer"

Evidence: The research compared REST API + Lambda REQUEST authorizer only against HTTP API JWT authorizer. AWS also supports HTTP API Lambda authorizers (REQUEST type), which provide custom claim logic and context injection at lower cost/complexity than REST API. The choice was based on an incomplete decision set.
Fix Applied: Section 1 now explicitly names HTTP API Lambda REQUEST authorizer as the missing comparison point and acknowledges it should be evaluated before locking in REST API.
Impact: Decision may shift to HTTP API + Lambda authorizer if the use case doesn't require REST-specific features.

### [VALID] "HTTP API JWT authorizer cannot enforce custom claim values at the authorizer level"

Evidence: AWS documents HTTP API JWT authorizers as validating signature plus standard claims (`iss`, `aud`/`client_id`, `exp`, `nbf`, `iat`) and optional route scopes, then passing claims downstream. The docs do not provide a hook for custom claim evaluation or custom deny logic inside the JWT authorizer itself.
Impact: If gateway-level denial for claims like `status=suspended` is mandatory, HTTP API JWT authorizer alone is insufficient.

### [FIXED] "`jwks-rsa` with `cache: true` fetches the JWKS once per Lambda cold start and holds it in module scope"

Evidence: `node-jwks-rsa` does not implement a module-global JWKS cache. Its source wraps `getSigningKey` with an LRU memoizer keyed by `kid`, with TTL `cacheMaxAge`. The cache lives on each `JwksClient` instance. Storing the client in module scope helps a warm Lambda reuse that instance, but that is application behavior, not library behavior. It also caches keys-by-`kid`, not "the JWKS set once per cold start" as stated.
Fix Applied: Section 1 JWKS description updated — clarifies per-client, per-`kid` caching behavior, and that new/missing `kid`s, cache evictions, or multiple instances can trigger additional fetches.
Impact: JWKS cache behavior is less deterministic than described; engineers should not assume "once per cold start" only.

### [VALID] "API Gateway caches Lambda authorizer results and can skip Lambda invocations during TTL"

Evidence: AWS documents authorizer-result caching for both REST and HTTP Lambda authorizers. Cache keys come from the identity source(s), and within the configured TTL API Gateway uses the cached authorizer result instead of invoking Lambda again.
Impact: The performance side of the two-layer caching story is real; TTL choice materially affects Lambda cost and latency.

### [FIXED] "Token revocation is immediate but cached policies can linger"

Evidence: Auth0 documents that once issued, access tokens and ID tokens cannot be revoked in the same way as server-side session IDs. JWT access tokens are self-contained; Auth0 explicitly recommends short lifetimes instead. That means changing `app_metadata`, suspending a user, or revoking refresh tokens does not immediately invalidate an in-flight access token. Revocation lag = token lifetime + authorizer cache TTL.
Fix Applied: Section 1 sentence corrected — "token revocation is immediate" removed; replaced with correct JWT revocation model: suspension lag = token lifetime + authorizer cache TTL.
Impact: Suspension enforcement requires short token lifetimes or short authorizer TTL; cached policies are not the only lag source.

---

## Summary of Fixes Applied

| Finding                            | Status   | Fix                                                                                                |
| ---------------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| REST vs HTTP comparison incomplete | ✅ FIXED | Added HTTP API Lambda authorizer as explicit comparison point                                      |
| JWKS cache description overstated  | ✅ FIXED | Corrected to per-client, per-`kid` LRU with realistic fetch triggers                               |
| "Token revocation is immediate"    | ✅ FIXED | Corrected to JWT self-contained revocation model; suspension lag = token lifetime + authorizer TTL |
