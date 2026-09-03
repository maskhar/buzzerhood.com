import migration12 from '../../database/migrations/0012_campaign_engine_core.sql?raw';
import migration13 from '../../database/migrations/0013_campaign_safe_projections.sql?raw';
import { describe, expect, it } from 'vitest';
describe('campaign engine security migration', () => {
  it('uses versioned content submissions with race protection', () => {
    expect(migration12).toContain('unique(deliverable_id,version)');
    expect(migration12).toContain('pg_advisory_xact_lock');
  });
  it('keeps workflow status changes behind RPCs', () => {
    expect(migration12).toContain('transition_campaign');
    expect(migration12).toContain('invalid campaign transition');
    expect(migration12).not.toMatch(/grants+updates+ons+buzzerhood.campaignss+tos+authenticated/i);
  });
  it('removes raw private table reads before granting safe projections', () => {
    expect(migration13).toMatch(/revoke select on buzzerhood.campaigns,buzzerhood.campaign_partner_assignments/i);
    expect(migration13).toContain('client_campaigns');
    expect(migration13).toContain('partner_assignments');
  });
  it('hides sensitive columns from client and partner views', () => {
    const protectedSection = migration13.slice(migration13.indexOf('create or replace view buzzerhood.client_campaigns'), migration13.indexOf('create or replace view buzzerhood.internal_campaigns'));
    expect(protectedSection).not.toContain('internal_notes');
    expect(protectedSection).not.toContain('rate_snapshot');
    expect(protectedSection).not.toContain('estimated_budget');
  });
  it('requires internal permission for approval and publication verification', () => {
    expect(migration12).toContain("input_context='internal' and not buzzerhood.has_permission('campaigns.manage')");
    expect(migration12).toContain("if not buzzerhood.has_permission('campaigns.manage') then raise exception 'permission denied'; end if;");
  });
});
