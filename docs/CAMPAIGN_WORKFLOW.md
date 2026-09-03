# Campaign Workflow

## Scope and authority

This document records the B3 Backend workflow implemented by `/api/v1` and migration `0018`. HTTP authorization, active membership checks, transaction-local Backend identity, PostgreSQL RLS, and schema-qualified workflow functions all participate in enforcement. UI visibility is not authorization.

## Campaign lifecycle

The normal lifecycle is:

`draft -> submitted -> internal_review -> planning -> active -> publishing -> monitoring -> reporting -> completed`

Internal review may instead move `internal_review -> changes_requested`; an authorized Client edits the draft fields and the Backend returns it through `draft -> submitted`. Cancellation or archival is an explicit Internal command. Every transition is locked, validated against the prior state, and appended to `campaign_status_history`; callers cannot PATCH a status directly.

Client members can create, edit, read, and submit Campaigns only for active memberships in their own Organization. Internal actors need effective `campaigns.manage` for review and operational commands. Cross-tenant resources are denied or concealed.

## Assignment and delivery

Only Internal Campaign managers may invite an approved Partner with an active Partner member, and only while a Campaign is in `planning` or `active`. Each Partner sees only its own assignment and agreed execution fee. Internal procurement notes, rate snapshots, total Campaign budget, and other assignments are excluded from Partner DTOs.

An invited Partner may accept or decline exactly once. Internal users plan deliverables against an eligible assignment. A Partner may submit content only for its own accepted/active assignment and an eligible deliverable.

## Versioned content review

Submitting a revision inserts a new `content_submissions` row. The next version number is allocated under a transaction advisory lock; old caption, concept, asset reference, URL, author, and review history are never overwritten.

The enforced order is:

1. Partner submits the latest version (`draft_submitted`).
2. Internal `campaigns.manage` approves it (`internal_approved`) or requests revision (`revision_requested`).
3. The owning Client Organization approves it (`client_approved`) or requests revision.

Only the latest version can be reviewed. A Partner cannot act as Internal or Client reviewer, another Client cannot review it, and Client review before Internal approval is rejected.

## Publication and metrics

The assigned Partner may submit publication proof only after Client approval. The publication must belong to the same deliverable, reference an approved submission for that deliverable, use an HTTP(S) URL, and—when supplied—use the same Partner's platform account.

Only effective `campaigns.manage` can verify or reject a submitted publication; the Partner cannot self-verify. Metric snapshots may be appended only after verification by the assigned Partner or authorized Internal actor. Snapshots are not updated in place and preserve metric type, numeric value, source, optional reporting period, recorder, and timestamp.

## Privacy and audit guarantees

- Client A cannot read or mutate Client B Campaigns.
- Partner A cannot read Partner B assignments, deliverables, submissions, publications, or metrics.
- Partner DTOs exclude Campaign budget, internal notes, rate snapshots, unrelated assignments, and verification-only notes.
- Operational logs contain event and resource/actor identifiers, not tokens, secrets, content bodies, private notes, or credentials.
- Migration `0018` is additive; migrations `0001`-`0017`, shared Supabase services, and existing production rows remain intact.

## Transition state

The B3 API is dark-deployed. The React Campaign UI remains on its legacy Supabase data path until the explicit B4 cutover and rollback gates pass.

FRONTEND DESIGN/CUTOVER DEFERRED TO B4

SUPABASE APPLICATION ACCESS REMAINS TRANSITIONAL — RETIREMENT NOT STARTED
