/**
 * Biometric authentication architecture (Module 4).
 *
 * The Security Center already exposes a biometrics toggle in the UI.
 * This formalizes what that toggle should call: a thin wrapper around the
 * platform WebAuthn API (browser) with room for a native bridge
 * (Face ID / fingerprint) once wrapped in a native shell. Everything here
 * degrades gracefully — `isAvailable()` returns false in any environment
 * without platform support, and the UI already treats biometrics as a
 * preference rather than a hard requirement.
 */

export interface BiometricCapability {
  available: boolean;
  reason?: string;
}

export interface BiometricAuthenticator {
  checkAvailability(): Promise<BiometricCapability>;
  enroll(userId: string): Promise<{ credentialId: string }>;
  verify(credentialId: string): Promise<boolean>;
  removeEnrollment(credentialId: string): Promise<void>;
}

/**
 * WebAuthn-backed implementation. Works in any browser with platform
 * authenticator support (Face ID / Touch ID / Windows Hello via the
 * browser, or fingerprint on Android Chrome). No server relying-party
 * verification is wired yet — enroll()/verify() here only check platform
 * capability and local credential presence, matching the "architecture,
 * not live integration" scope of this phase.
 */
class WebAuthnBiometricAuthenticator implements BiometricAuthenticator {
  async checkAvailability(): Promise<BiometricCapability> {
    if (typeof window === "undefined" || !window.PublicKeyCredential) {
      return { available: false, reason: "WebAuthn not supported in this environment." };
    }
    try {
      const available =
        await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available
        ? { available: true }
        : { available: false, reason: "No platform authenticator found." };
    } catch {
      return { available: false, reason: "Could not query platform authenticator." };
    }
  }

  async enroll(userId: string): Promise<{ credentialId: string }> {
    void userId;
    throw new Error(
      "Biometric enrollment requires a relying-party server challenge, which is not yet configured " +
        "(pending Authentication service integration in a later phase).",
    );
  }

  async verify(credentialId: string): Promise<boolean> {
    void credentialId;
    throw new Error(
      "Biometric verification requires a relying-party server challenge (not yet configured).",
    );
  }

  async removeEnrollment(credentialId: string): Promise<void> {
    void credentialId;
  }
}

export const biometricAuthenticator: BiometricAuthenticator = new WebAuthnBiometricAuthenticator();
