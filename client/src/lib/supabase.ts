/**
 * RailSecurix - Supabase Client Integration
 * 
 * Configures the official Supabase JavaScript/TypeScript client.
 * Strictly non-destructive: acts as an opt-in integration that coexists
 * with the existing authentication, session, and SQLite backend without
 * replacing or altering existing data flows.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://siregnigyxceylxbzzow.supabase.co').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

/**
 * Validates whether a valid Supabase key has been provided (not empty and not a placeholder).
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_ANON_KEY.includes('PASTE_MY_SUPABASE_PUBLISHABLE_KEY_HERE') &&
    !SUPABASE_ANON_KEY.startsWith('[')
  );
}

/**
 * Singleton Supabase Client instance (null if unconfigured or placeholder).
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Returns the Supabase client or throws a descriptive error if not yet configured.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not yet fully configured. Please set a valid VITE_SUPABASE_ANON_KEY in your environment.'
    );
  }
  return supabase;
}

/**
 * Safe, non-destructive connectivity test for Supabase.
 * Checks reachability of the Supabase project without writing or altering data.
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  configured: boolean;
  projectUrl: string;
  message: string;
  latencyMs?: number;
}> {
  const startTime = Date.now();

  if (!isSupabaseConfigured()) {
    // Non-destructive check of project reachability
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/`, { method: 'GET' });
      const latencyMs = Date.now() - startTime;
      // HTTP 401 is expected from Supabase when project URL is live but no key is passed
      if (res.status === 401 || res.status === 200) {
        return {
          success: true,
          configured: false,
          projectUrl: SUPABASE_URL,
          message:
            'Supabase project endpoint is reachable and responsive. Awaiting valid VITE_SUPABASE_ANON_KEY in .env.local to activate the authenticated client.',
          latencyMs,
        };
      }
      return {
        success: false,
        configured: false,
        projectUrl: SUPABASE_URL,
        message: `Endpoint returned unexpected status ${res.status}.`,
        latencyMs,
      };
    } catch (err: any) {
      return {
        success: false,
        configured: false,
        projectUrl: SUPABASE_URL,
        message: `Network error reaching Supabase endpoint: ${err.message}`,
      };
    }
  }

  // When key is configured, perform an authenticated health check
  try {
    const client = getSupabaseClient();
    const { error } = await client.auth.getSession();
    const latencyMs = Date.now() - startTime;

    if (error) {
      return {
        success: false,
        configured: true,
        projectUrl: SUPABASE_URL,
        message: `Supabase auth ping returned error: ${error.message}`,
        latencyMs,
      };
    }

    return {
      success: true,
      configured: true,
      projectUrl: SUPABASE_URL,
      message: 'Supabase client connected and authenticated successfully.',
      latencyMs,
    };
  } catch (err: any) {
    return {
      success: false,
      configured: true,
      projectUrl: SUPABASE_URL,
      message: `Failed to connect to Supabase: ${err.message}`,
    };
  }
}
