import type { ColumnType, Generated } from 'kysely';

type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface Database {
  'buzzerhood.users': {
    id: string;
    email: string;
    normalized_email: string;
    password_hash: string;
    status: 'active' | 'pending_activation' | 'suspended' | 'disabled';
    email_verified_at: Timestamp | null;
    password_changed_at: Timestamp;
    last_login_at: Timestamp | null;
    created_at: Generated<Timestamp>;
    updated_at: Generated<Timestamp>;
  };
  'buzzerhood.profiles': {
    id: string;
    user_id: string | null;
    display_name: string | null;
    avatar_path: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Generated<Timestamp>;
  };
  'buzzerhood.refresh_sessions': {
    id: string;
    user_id: string;
    family_id: string;
    token_hash: string;
    parent_session_id: string | null;
    replaced_by_session_id: string | null;
    created_at: Generated<Timestamp>;
    expires_at: Timestamp;
    last_used_at: Timestamp | null;
    rotated_at: Timestamp | null;
    revoked_at: Timestamp | null;
    revocation_reason: string | null;
    replay_detected_at: Timestamp | null;
  };
  'buzzerhood.auth_security_events': {
    id: Generated<string>;
    user_id: string | null;
    session_id: string | null;
    event_type: string;
    metadata: unknown;
    created_at: Generated<Timestamp>;
  };
  'buzzerhood.user_roles': { profile_id: string; role_id: string; granted_by: string | null; granted_at: Timestamp; revoked_at: Timestamp | null };
  'buzzerhood.roles': { id: string; key: string; label: string; scope: string; created_at: Timestamp };
  'buzzerhood.permissions': { id: string; key: string; description: string; created_at: Timestamp };
  'buzzerhood.role_permissions': { role_id: string; permission_id: string; created_at: Timestamp };
}
