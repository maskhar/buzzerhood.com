# Buzzerhood API v1 Contract

## Implemented in B1

- `POST /api/v1/auth/register`, `login`, `refresh`, `logout`, `logout-all`.
- `GET /api/v1/auth/me` returns safe profile, existing roles and permissions.
- `GET /health` and `GET /ready` expose minimal liveness/readiness only.

Register/login bodies are strict Zod objects. Refresh/logout require Origin and
double-submit CSRF validation. Errors use a stable safe envelope and never
return SQL, stacks, hashes or token internals. OpenAPI is configuration-gated
and disabled in production. Registration returns 403 while production policy
is closed.

## Conventions

Base path: `/api/v1`. JSON request/response unless a future storage endpoint explicitly negotiates another media type. UUID path parameters are validated before service execution. Times are ISO 8601 UTC. List endpoints use `limit` (default 25, max 100) and opaque `cursor` when growth warrants it.

Authentication uses `Authorization: Bearer <access-token>`. Refresh credentials are cookies and are never accepted in JSON. `POST`, `PATCH`, and workflow commands accept only documented fields; unknown fields are rejected.

Successful single-resource responses are the resource DTO. Lists use:

```json
{ "items": [], "page": { "nextCursor": null } }
```

Error shape:

```json
{
  "error": {
    "code": "CAMPAIGN_INVALID_TRANSITION",
    "message": "The campaign cannot move to that state.",
    "details": [{ "path": "to", "issue": "invalid_transition" }],
    "requestId": "..."
  }
}
```

Standard status mapping: `400` malformed request, `401` unauthenticated/session expired, `403` authenticated but forbidden, `404` not found or deliberately concealed cross-tenant resource, `409` uniqueness/workflow conflict, `422` semantically invalid input, `429` throttled, `500` internal. Raw SQL/constraint/stack output is never returned.

Stable code families include `VALIDATION_FAILED`, `AUTH_INVALID_CREDENTIALS`, `AUTH_SESSION_EXPIRED`, `AUTH_REFRESH_REPLAYED`, `AUTH_ACCOUNT_INACTIVE`, `ORG_FORBIDDEN`, `PARTNER_NOT_FOUND`, `PARTNER_CLAIM_CONFLICT`, `CAMPAIGN_INVALID_TRANSITION`, `CONTENT_NOT_APPROVED`, and `PUBLICATION_NOT_ALLOWED`.

## Auth contract (B1)

| Method/path | Auth | Request | Success | Cookie/status/errors |
|---|---|---|---|---|
| `POST /auth/register` | Public/policy-gated | `{email,password}` | `201` safe user + access token when activation policy permits | Sets refresh cookie only for active verified flow. `409 AUTH_EMAIL_EXISTS` may be generic by policy; `422`; `429`. |
| `POST /auth/login` | Public | `{email,password}` | `200 {accessToken,expiresIn,user}` | Sets rotated-session HttpOnly cookie. `401 AUTH_INVALID_CREDENTIALS`; `403 AUTH_ACCOUNT_INACTIVE`; `429`. |
| `POST /auth/refresh` | Refresh cookie + CSRF controls | no token body | `200 {accessToken,expiresIn}` | Replaces cookie. `401 AUTH_SESSION_EXPIRED`; replay revokes family. |
| `POST /auth/logout` | Refresh cookie; access token optional | empty | `204` | Revokes current session/family and clears cookie; idempotent. |
| `POST /auth/logout-all` | Bearer + CSRF controls when cookie sent | empty | `204` | Revokes all user refresh sessions and clears cookie. |
| `GET /auth/me` | Bearer | none | `200 {user,profile,workspaces}` | `401`. No password/session token/permission dump. |

Later-but-required account lifecycle: `POST /auth/forgot-password`, `POST /auth/reset-password`, and `POST /auth/verify-email`. They use generic responses, expiring single-use tokens, throttling, and no secret in logs. Exact delivery provider is deferred.

## Me/workspaces

- `GET /me/workspaces` — active client, partner, and authorized internal workspace summaries derived server-side.
- `GET /me/partner-applications` — current user's applications and review status.
- `GET /me/partner-claims` — current user's claim status; evidence exposure is limited to owner/admin need.

## Organizations

- `GET /organizations` — organizations visible through active membership or explicit internal permission.
- `POST /organizations` — create client organization and owner membership atomically.
- `GET /organizations/:organizationId` — authorized summary.
- `PATCH /organizations/:organizationId` — explicit editable fields (`name` initially); owner/manager/internal policy.
- `GET /organizations/:organizationId/members` — membership-safe DTO.

Invitation and membership mutation endpoints are marked later until lifecycle/product decisions are approved; the API must not invent them during B1.

## Public network and partners

- `GET /network?search=&platform=&tier=&cursor=&limit=` — public safe projection only.
- `GET /network/:partnerId` — public partner detail; excludes rates, claims, memberships, legal/private data, and source payload.
- `POST /partner-applications` — authenticated; explicit partner kind/profile fields; creates invited ownership pending internal review.
- `POST /partner-claims` — authenticated `{partnerId,evidence}`; conflict-safe.
- `GET /partners/:partnerId` — active partner member or authorized internal actor; DTO varies by policy.
- `PATCH /partners/:partnerId` — allowlisted public profile fields only.
- `GET|POST /partners/:partnerId/platforms`; `PATCH|DELETE /partners/:partnerId/platforms/:platformId` — membership/permission checked and platform ownership constrained.
- `GET|POST /partners/:partnerId/metrics` — immutable snapshots preferred; metric type/value/period/source validated.
- `GET|POST /partners/:partnerId/rates`; `PATCH /partners/:partnerId/rates/:rateId` — private; no public/client leakage; deactivation rather than history rewrite.

## Campaigns and briefs

- `GET /campaigns` — actor-scoped list; DTO selected by client/partner/internal context.
- `POST /campaigns` — client member creates draft in an authorized organization.
- `GET /campaigns/:campaignId` — scoped detail; partner DTO excludes total budget/internal notes and unrelated assignments.
- `PATCH /campaigns/:campaignId` — allowlisted draft/admin fields; cannot arbitrarily set state/actor.
- `GET|PUT /campaigns/:campaignId/brief` — authorized brief fields; state rules enforced.
- `POST /campaigns/:campaignId/transitions` — `{to,reason}`; existing database state machine is authoritative.

## Assignments and deliverables

- `GET /campaigns/:campaignId/assignments` — client/internal gets allowed list; partner accesses only its assignment through `/assignments/:id`.
- `POST /campaigns/:campaignId/assignments` — internal `campaigns.manage`; explicit partner, fee snapshot, currency; sensitive fields omitted from client/partner DTOs as policy requires.
- `GET /assignments/:assignmentId` — scoped resource.
- `POST /assignments/:assignmentId/response` — partner `{response: accepted|declined, reason?}`.
- `GET|POST /assignments/:assignmentId/deliverables` — read scoped; create internal/authorized planning action.
- `GET|PATCH /deliverables/:deliverableId` — allowlisted planning fields and valid states; no arbitrary status assignment.

## Content

- `GET /deliverables/:deliverableId/submissions` — ordered immutable versions.
- `POST /deliverables/:deliverableId/submissions` — partner content `{captionBody,conceptNotes?,assetReference?,contentUrl?}`; allocates next version atomically.
- `GET /submissions/:submissionId/reviews` — scoped history.
- `POST /submissions/:submissionId/reviews` — authorized internal/client `{context,decision,note?}`; server verifies claimed context.

Prior submission versions are never overwritten. A later edit is another submission.

## Publications and metrics

- `GET|POST /deliverables/:deliverableId/publications` — partner submission only after client approval; URL/platform account ownership validated.
- `POST /publications/:publicationId/verification` — internal authorized `{decision,note?}`; partner cannot self-verify.
- `GET|POST /publications/:publicationId/metrics` — scoped immutable snapshots with metric type, value, period, source, note.

## Admin

- `GET /admin/partners?status=` and `GET /admin/partners/:partnerId` — `partners.manage` and internal DTO.
- `GET /admin/partner-applications?status=` — review queue.
- `POST /admin/partner-applications/:partnerId/approve|reject` — `{note?}`.
- `GET /admin/partner-claims?status=` — review queue; evidence is limited to this authorized purpose.
- `POST /admin/partner-claims/:claimId/approve|reject` — `{note?}`; approval uses the conflict/locking invariant.
- Role/user administration endpoints are not generic CRUD. They are specified only with a reviewed bootstrap/access-management workflow.

## Reporting, billing, files, notifications

Reserved for B6/later. No speculative deep contract is created in B0. When added, reporting and billing receive explicit privacy/financial state DTOs; file APIs use private object storage and short-lived authorization; notifications do not require Realtime by default.

## OpenAPI and contract ownership

This document is the product-level B0 contract. From B1, NestJS produces the executable OpenAPI definition from the validated implementation. CI checks the OpenAPI artifact/diff. Do not manually maintain a second field-by-field schema here once generated OpenAPI exists; update product conventions and workflows here and implementation schemas there in the same change.

## Compatibility and idempotency

Backend endpoints never expose table names or generic RPC invocation. Existing PostgREST/RPC functions are internal implementation details. Retry-sensitive creates and workflow commands accept an `Idempotency-Key` once implemented; the key is scoped to actor/route and retains request hash/result for a bounded period. Conflicting reuse returns `409`.

## Implemented B2 contract

B2 implements the following resource-oriented routes. All routes except `GET /network` require the B1 Bearer JWT; `/admin/*` additionally requires effective `partners.manage`.

- `GET /me/workspaces`
- `GET|POST /organizations`, `GET|PATCH /organizations/:organizationId`, `GET /organizations/:organizationId/members`
- `GET /network` with validated `search`, `platform`, `tier`, `niche`, `page`, and bounded `limit`
- `POST /partner-applications`, `GET /me/partner-applications`
- `POST /partner-claims`, `GET /me/partner-claims`
- `GET /me/partners`, `GET|PATCH /partners/:partnerId`
- Partner-scoped platform CRUD, metric history read, and rate list/create/update/deactivate routes
- Admin Partner list/detail, application list, claim list, and explicit approve/reject routes

Cross-tenant resources use an IDOR-safe `404`. The public Network DTO is sourced only from `buzzerhood.public_network_partners`; it excludes contacts, rates, memberships, evidence, reviews, provenance, user IDs, and authentication data. Metrics are read-only in B2 because the current architecture has no approved Partner manual-snapshot command.

## Implemented B3 contract

B3 exposes the Campaign workflow through purpose-specific routes. This section is authoritative where the earlier B0 sketch used different route names.

Client Campaign routes:

- `GET|POST /campaigns`, `GET|PATCH /campaigns/:campaignId`
- `POST /campaigns/:campaignId/submit`
- `POST /content-submissions/:submissionId/approve|request-revision`

Internal routes require effective `campaigns.manage`:

- `GET /admin/campaigns`, `GET /admin/campaigns/:campaignId`
- `POST /admin/campaigns/:campaignId/start-review|approve|request-revision|transition`
- `GET|POST /admin/campaigns/:campaignId/assignments`
- `POST /admin/campaign-assignments/:assignmentId/deliverables`
- `POST /admin/content-submissions/:submissionId/approve|request-revision`
- `POST /admin/publications/:publicationId/verify|reject`

Partner execution routes:

- `GET /me/campaign-assignments`, `GET /campaign-assignments/:assignmentId`
- `POST /campaign-assignments/:assignmentId/accept|reject`
- `GET /campaign-assignments/:assignmentId/deliverables`
- `GET|POST /deliverables/:deliverableId/submissions`
- `POST /deliverables/:deliverableId/publications`
- `GET|POST /publications/:publicationId/metrics`

All command bodies are strict and reject unknown/protected fields. Client DTOs may contain their own estimated budget but never assignment procurement notes or rate snapshots. Partner DTOs contain only the assigned Partner's agreed fee and execution brief; they exclude Campaign total budget, internal notes, rate snapshots, and other assignments. Internal DTOs expose operational fields only after `campaigns.manage` authorization. Cross-organization and cross-partner lookups are concealed with `404` where appropriate.

Content submissions are insert-only versions. Only the latest version can be reviewed, Internal approval must precede Client approval, a Partner cannot self-approve or self-verify, publication must reference the matching finally approved submission, and metrics can be appended only after Internal publication verification. See `CAMPAIGN_WORKFLOW.md`.
