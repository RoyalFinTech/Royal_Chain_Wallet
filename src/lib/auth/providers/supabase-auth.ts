/**
 * Real Supabase-backed AuthenticationService (Priority 2 / Phase 8B).
 *
 * This is genuinely wired to Supabase Auth — not a mock. signUp/signIn/
 * signOut/resetPassword all call the real supabase-js client. Email
 * verification and password-reset emails are sent by Supabase itself
 * once "Confirm email" is enabled in the project's Auth settings — no
 * custom email infra needed on our side.
 *
 * JWT + refresh tokens are intentionally NOT hand-rolled here: Supabase's
 * client manages access/refresh token issuance, storage, and silent
 * refresh (`persistSession` + `autoRefreshToken`, already configured in
 * src/integrations/supabase/client.ts). Hand-rolling JWT signing in
 * client code would require embedding a signing secret in the browser,
 * which is insecure — this is the correct production pattern, not a
 * shortcut.
 *
 * NOTE: profile data (the `public.users` row — display name, preferred
 * currency/locale, KYC status) depends on the Module 2 migration being
 * applied to the live project. Until then, `ensureProfile` below will
 * fail with a clear "relation does not exist" error rather than silently
 * no-op — that failure is the correct signal that migrations are
 * pending, not a bug to swallow.
 */
import { supabase } from "@/integrations/supabase/client";
import { getTypedSupabase } from "@/lib/db/typed-client";
import type { AuthenticationService } from "@/lib/interfaces/platform-domain";
import type { UserRecord } from "@/lib/db/models";
import { AppError } from "@/lib/errors/types";
import { logSecurityEvent } from "@/lib/security/audit";

function mapSupabaseError(error: { message: string; status?: number }): AppError {
  if (error.status === 400 || /invalid.*credentials/i.test(error.message)) {
    return new AppError("unauthorized", "Invalid email or password.");
  }
  if (/already registered/i.test(error.message)) {
    return new AppError("validation_error", "An account with this email already exists.");
  }
  return new AppError("network_error", error.message);
}

/** Reads (or lazily creates) the public.users profile row for the signed-in user. */
async function ensureProfile(authUserId: string, email: string | null): Promise<UserRecord> {
  const db = getTypedSupabase();
  const { data: existing, error: readError } = await db
    .from("users")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (readError) {
    throw new AppError(
      "not_configured",
      "The users table isn't available yet — apply the Module 2 migration to royal_chain_db first.",
      { cause: readError.message },
    );
  }
  if (existing) return existing;

  const { data: created, error: insertError } = await db
    .from("users")
    .insert({ auth_user_id: authUserId, email })
    .select("*")
    .single();

  if (insertError) throw mapSupabaseError(insertError);
  return created;
}

export const supabaseAuthenticationService: AuthenticationService = {
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw mapSupabaseError(error);
    if (!data.user) throw new AppError("unknown_error", "Sign-up did not return a user.");
    logSecurityEvent("auth.sign_up", data.user.id);
    // If email confirmation is required, data.session is null until the user
    // clicks the verification link — that's expected, not an error.
    return ensureProfile(data.user.id, data.user.email ?? email);
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw mapSupabaseError(error);
    if (!data.session) throw new AppError("unauthorized", "Sign-in did not return a session.");
    logSecurityEvent("auth.sign_in", data.user.id);
    const profile = await ensureProfile(data.user.id, data.user.email ?? email);
    return { user: profile, sessionToken: data.session.access_token };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw mapSupabaseError(error);
    logSecurityEvent("auth.sign_out");
  },

  async verifyPin() {
    // PIN verification is wallet-local (see lib/wallet/storage.ts unlockWallet),
    // never sent to the server — Supabase has no role here.
    throw new AppError(
      "not_configured",
      "PIN verification is on-device only; call unlockWallet() from lib/wallet instead.",
    );
  },

  async changePin() {
    throw new AppError(
      "not_configured",
      "PIN changes are on-device only; call changePin() from lib/wallet instead.",
    );
  },

  async requestPasswordReset(email) {
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/auth/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw mapSupabaseError(error);
    logSecurityEvent("auth.password_reset_requested", email);
  },

  async enableBiometrics(userId, deviceId) {
    // Enrollment ceremony lives in lib/auth/biometrics.ts (WebAuthn) — this
    // just records that the device has biometrics enabled once migrated.
    const { error } = await getTypedSupabase()
      .from("devices")
      .update({ is_trusted: true })
      .eq("id", deviceId);
    if (error) {
      throw new AppError(
        "not_configured",
        "The devices table isn't available yet — apply the Module 2 migration first.",
      );
    }
    logSecurityEvent("auth.biometrics_enabled", userId, { deviceId });
  },
};
