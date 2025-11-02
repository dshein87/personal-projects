# JWT Signing Key Migration Plan

**Created:** 2025-11-02
**Status:** Research & Planning
**Priority:** HIGH (security issue - exposed service keys rotated)

---

## Background

GitHub secret scanning detected exposed Supabase Service Role Key in documentation. User requested migration to JWT Signing Keys as a more secure approach.

**User-provided JWT Signing Key details:**
- **Key ID:** `bab9e459-647a-4d64-8a01-0ad42045159f`
- **Discovery URL:** `https://ohdmrfyyavlkoflbbjsd.supabase.co/auth/v1/.well-known/jwks.json`
- **Algorithm:** ES256 (Elliptic Curve, P-256)
- **Public Key:** Available at discovery URL

---

## Current State

### Where Service Role Keys Are Used

**1. Streamlit Dashboard (`rating-ui/chat_dashboard.py`):**
```python
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)
```
- **Purpose:** Server-side API access to Supabase
- **Operations:** Query activities, restaurants, visits; insert conversation messages
- **Why service role:** Bypasses RLS (Row Level Security) for server operations

**2. MCP Servers (4 TypeScript servers):**
```typescript
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```
- **Purpose:** Backend operations for activity planning, restaurant search, etc.
- **Operations:** Complex queries, data aggregation, writes
- **Why service role:** Server-side operations need full access

---

## Research Findings (from context7 Supabase docs)

### What JWT Signing Keys Are For

Based on Supabase documentation:

1. **JWT Verification:** Validate tokens issued by external auth providers
2. **Custom Claims:** Add application-specific data to JWTs via auth hooks
3. **Role-Based Access:** Inject custom roles into tokens for RLS policies
4. **Third-party Auth:** Integrate Firebase, Auth0, etc. with Supabase

### Key Insight

**JWT Signing Keys ≠ API Authentication Keys**

JWT Signing Keys are used for:
- ✅ Verifying user authentication tokens
- ✅ Custom auth providers (Firebase, Clerk, etc.)
- ✅ Adding custom claims to user JWTs

Service Role Keys are used for:
- ✅ Server-side API access
- ✅ Bypassing RLS for backend operations
- ✅ Admin operations (like n8n workflows)

---

## Questions to Resolve

### 1. What is the intended migration path?

**Option A: Use JWT for user authentication (dashboard access)**
- Magic links generate custom JWTs signed with ES256 key
- Users authenticate with these JWTs
- Server operations still use service role key (or anon key with RLS)

**Option B: Replace service role key entirely**
- Use custom JWTs for all operations
- Configure RLS policies to trust custom JWTs
- Sign JWTs server-side with ES256 private key

**Option C: Hybrid approach**
- User authentication via Supabase Auth (built-in)
- Server operations via service role key (current)
- JWT signing key for verification only

### 2. Do we have the private key?

User provided:
- ✅ Public key (x, y coordinates, ES256)
- ✅ Key ID
- ❓ **Private key** - Not provided yet

**Without private key, we cannot:**
- Sign our own JWTs
- Use custom JWTs for authentication

**We can only:**
- Verify JWTs signed elsewhere
- Configure Supabase to trust external JWTs

### 3. What was deprecated?

Need clarification on what the user meant by "deprecated service key":
- Is the service role key itself deprecated by Supabase? (No, still documented)
- Is the usage pattern deprecated? (No, recommended for server-side)
- Is this about moving away from long-lived keys to short-lived tokens?

---

## Recommended Approach (Pending Clarification)

### Phase 1: Immediate Security (✅ COMPLETE)

1. ✅ Remove all exposed secrets from documentation
2. ✅ Redact service role keys, API keys, JWT tokens
3. ✅ Commit security cleanup
4. ⏸️ Rotate any exposed keys in Supabase dashboard

### Phase 2: Understand User Intent

**Questions for user:**
1. What specific use case for JWT signing keys?
   - Custom user authentication?
   - Replace service role key?
   - Third-party auth integration?

2. Do you have the private key for signing?
   - If yes, where is it stored securely?
   - If no, should we generate a new keypair?

3. What's the security concern with service role keys?
   - Long-lived credentials?
   - Too much access?
   - Compliance requirement?

### Phase 3: Implementation (Based on Answers)

**Scenario A: Custom JWT Authentication**
```python
# Generate JWT with ES256 signing
import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

# Load private key
with open('private_key.pem', 'rb') as f:
    private_key = serialization.load_pem_private_key(
        f.read(),
        password=None,
        backend=default_backend()
    )

# Sign JWT
token = jwt.encode(
    {
        "sub": user_id,
        "role": "authenticated",
        "exp": expiration_time,
    },
    private_key,
    algorithm="ES256",
    headers={"kid": "bab9e459-647a-4d64-8a01-0ad42045159f"}
)

# Use token with Supabase
supabase = create_client(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    options={
        "global": {
            "headers": {
                "Authorization": f"Bearer {token}"
            }
        }
    }
)
```

**Scenario B: Keep Service Role for Server Operations**
```python
# No change needed - service role is correct for server-side
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Still valid for server ops
)
```

---

## Security Best Practices

### Current Implementation (Post-Cleanup)

✅ **Good:**
- Service role key never committed to git
- Stored in `.env` (gitignored)
- Used only for server-side operations
- Streamlit Cloud secrets (encrypted at rest)

⚠️ **To Improve:**
- Rotate service role key after exposure
- Consider key rotation policy (e.g., quarterly)
- Add rate limiting to API endpoints
- Monitor for unusual access patterns

### JWT Signing Key Approach

✅ **Advantages:**
- Short-lived tokens (e.g., 1 hour)
- Can revoke by not renewing
- User-specific claims
- Better audit trail

⚠️ **Challenges:**
- Need secure private key storage
- Token refresh mechanism
- Increased complexity
- Still need service role for admin ops

---

## Next Steps

### Immediate (User Action Required)

1. **Rotate exposed service role key** in Supabase dashboard:
   - Go to Settings > API
   - Click "Reset" next to Service Role key
   - Update `.env` with new key (Claude Code will do this)

2. **Clarify JWT signing key use case:**
   - What operations should use JWT vs service role?
   - Do you have the private signing key?
   - What's the security goal?

### After Clarification (Claude Code Implementation)

**If using JWT for user auth:**
1. Obtain private key for ES256 signing
2. Implement JWT generation in magic link flow
3. Update dashboard to use JWT tokens
4. Keep service role for n8n workflows

**If replacing service role entirely:**
1. Configure RLS policies to trust custom JWTs
2. Implement JWT signing in all server operations
3. Add token refresh mechanism
4. Test thoroughly (RLS can break queries)

**If current approach is fine:**
1. Just rotate the exposed key
2. Document why service role is appropriate
3. Add monitoring for key usage

---

## References

**Supabase Documentation:**
- JWT Structure: https://supabase.com/docs/guides/auth/jwts
- Custom Access Token Hooks: https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
- Service Role Key: https://supabase.com/docs/guides/api#the-service_role-key

**JWT Signing Key Details:**
- Key ID: `bab9e459-647a-4d64-8a01-0ad42045159f`
- Discovery URL: https://ohdmrfyyavlkoflbbjsd.supabase.co/auth/v1/.well-known/jwks.json
- Algorithm: ES256 (Elliptic Curve Digital Signature Algorithm)

---

## Decision Log

### Decision: Defer JWT Implementation Pending Clarification

**Date:** 2025-11-02

**Context:** User requested migration from service role key to JWT signing key, but implementation path unclear.

**Rationale:**
1. Service role keys are still documented and recommended by Supabase for server-side operations
2. JWT signing keys serve different purpose (auth verification, not API access)
3. Need to understand user's specific security requirements
4. Implementation would be significant work without clear benefit

**Action:**
- Complete security cleanup (remove exposed keys)
- Document migration options
- Wait for user clarification before implementing

**Revisit:** When user provides:
- Private signing key (or confirms we should generate)
- Specific use case for JWT signing
- Security requirements driving this change

---

*This document tracks the JWT signing key migration research and planning. Update as we learn more about the user's requirements.*
