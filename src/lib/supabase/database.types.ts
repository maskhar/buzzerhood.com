/* Generated from live self-hosted PostgreSQL schema buzzerhood. Do not edit manually. */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  buzzerhood: {
    Tables: {
      "organization_members": {
        Row: {
          id: string;
          organization_id: string;
          profile_id: string;
          role: Database["buzzerhood"]["Enums"]["membership_role"];
          status: Database["buzzerhood"]["Enums"]["membership_status"];
          invited_by: string | null;
          joined_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          profile_id: string;
          role?: Database["buzzerhood"]["Enums"]["membership_role"];
          status?: Database["buzzerhood"]["Enums"]["membership_status"];
          invited_by?: string | null;
          joined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          profile_id?: string;
          role?: Database["buzzerhood"]["Enums"]["membership_role"];
          status?: Database["buzzerhood"]["Enums"]["membership_status"];
          invited_by?: string | null;
          joined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      "organizations": {
        Row: {
          id: string;
          kind: Database["buzzerhood"]["Enums"]["organization_kind"];
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          kind: Database["buzzerhood"]["Enums"]["organization_kind"];
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          kind?: Database["buzzerhood"]["Enums"]["organization_kind"];
          name?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      "partner_audience_metrics": {
        Row: {
          id: string;
          platform_account_id: string;
          metric_type: Database["buzzerhood"]["Enums"]["metric_type"];
          metric_value: number;
          period_start: string | null;
          period_end: string | null;
          observed_at: string;
          metric_source: string;
          raw_value: Json | null;
        };
        Insert: {
          id?: string;
          platform_account_id: string;
          metric_type: Database["buzzerhood"]["Enums"]["metric_type"];
          metric_value: number;
          period_start?: string | null;
          period_end?: string | null;
          observed_at?: string;
          metric_source: string;
          raw_value?: Json | null;
        };
        Update: {
          id?: string;
          platform_account_id?: string;
          metric_type?: Database["buzzerhood"]["Enums"]["metric_type"];
          metric_value?: number;
          period_start?: string | null;
          period_end?: string | null;
          observed_at?: string;
          metric_source?: string;
          raw_value?: Json | null;
        };
        Relationships: [];
      };
      "partner_platform_accounts": {
        Row: {
          id: string;
          partner_id: string;
          platform: string;
          handle: string | null;
          profile_url: string | null;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          partner_id: string;
          platform: string;
          handle?: string | null;
          profile_url?: string | null;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          partner_id?: string;
          platform?: string;
          handle?: string | null;
          profile_url?: string | null;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      "partner_rates": {
        Row: {
          id: string;
          partner_id: string;
          service_type: string;
          amount: number;
          currency: string;
          effective_from: string;
          effective_to: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          partner_id: string;
          service_type: string;
          amount: number;
          currency?: string;
          effective_from?: string;
          effective_to?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          partner_id?: string;
          service_type?: string;
          amount?: number;
          currency?: string;
          effective_from?: string;
          effective_to?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      "partners": {
        Row: {
          id: string;
          organization_id: string | null;
          display_name: string;
          partner_type: string | null;
          tier: string | null;
          category: string | null;
          niche: string | null;
          verification_status: string;
          is_public: boolean;
          source_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          display_name: string;
          partner_type?: string | null;
          tier?: string | null;
          category?: string | null;
          niche?: string | null;
          verification_status?: string;
          is_public?: boolean;
          source_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          display_name?: string;
          partner_type?: string | null;
          tier?: string | null;
          category?: string | null;
          niche?: string | null;
          verification_status?: string;
          is_public?: boolean;
          source_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      "permissions": {
        Row: {
          id: string;
          key: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          description?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      "profiles": {
        Row: {
          id: string;
          display_name: string | null;
          avatar_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      "role_permissions": {
        Row: {
          role_id: string;
          permission_id: string;
          created_at: string;
        };
        Insert: {
          role_id: string;
          permission_id: string;
          created_at?: string;
        };
        Update: {
          role_id?: string;
          permission_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      "roles": {
        Row: {
          id: string;
          key: string;
          label: string;
          scope: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          label: string;
          scope: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          label?: string;
          scope?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      "schema_migrations": {
        Row: {
          version: string;
          filename: string;
          applied_at: string;
        };
        Insert: {
          version: string;
          filename: string;
          applied_at?: string;
        };
        Update: {
          version?: string;
          filename?: string;
          applied_at?: string;
        };
        Relationships: [];
      };
      "user_roles": {
        Row: {
          profile_id: string;
          role_id: string;
          granted_by: string | null;
          granted_at: string;
          revoked_at: string | null;
        };
        Insert: {
          profile_id: string;
          role_id: string;
          granted_by?: string | null;
          granted_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          profile_id?: string;
          role_id?: string;
          granted_by?: string | null;
          granted_at?: string;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      assignment_status: "proposed" | "accepted" | "declined" | "active" | "completed" | "cancelled";
      campaign_status: "draft" | "submitted" | "in_review" | "approved" | "active" | "reporting" | "completed" | "cancelled";
      deliverable_status: "pending" | "submitted" | "revision_requested" | "approved" | "published" | "cancelled";
      membership_role: "member" | "manager" | "owner";
      membership_status: "invited" | "active" | "suspended" | "removed";
      metric_type: "followers" | "subscribers" | "members" | "monthly_visitors" | "views" | "reach" | "impressions" | "engagement" | "engagement_rate";
      organization_kind: "client" | "partner" | "internal";
      submission_status: "draft" | "submitted" | "revision_requested" | "approved" | "rejected";
      system_role_key: "super_admin" | "admin" | "internal_team";
    };
    CompositeTypes: Record<string, never>;
  };
};
