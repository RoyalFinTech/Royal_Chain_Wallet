/**
 * Device registration (Module 4).
 *
 * Generates a stable, non-identifying local device fingerprint so
 * multi-device session/security features (already surfaced in the
 * Security Center UI) have a real backing concept ahead of a device
 * table connection. Never derived from anything personally identifying.
 */

const DEVICE_ID_KEY = "rcw.device.id";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

/** Stable per-browser-install identifier. Not a hardware fingerprint. */
export function getLocalDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = randomId();
    window.localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export type Platform = "ios" | "android" | "web";

export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent ?? "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "web";
}

export interface DeviceInfo {
  id: string;
  platform: Platform;
  label: string;
}

export function getCurrentDeviceInfo(): DeviceInfo {
  const platform = detectPlatform();
  const label =
    platform === "ios" ? "iPhone" : platform === "android" ? "Android device" : "Web browser";
  return { id: getLocalDeviceId(), platform, label };
}
