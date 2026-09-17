/**
 * Safe Internal Redirect Helper
 *
 * Ensures that redirect parameters (e.g. ?redirectTo= or ?next=)
 * strictly resolve to internal application paths and cannot be exploited
 * for Open Redirect attacks (e.g. //evil.example, https://attacker.com, javascript:...).
 */

export function getSafeInternalRedirect(
  target: string | null | undefined,
  fallback: string = "/dashboard"
): string {
  if (!target || typeof target !== "string") {
    return fallback
  }

  const trimmed = target.trim()

  // 1. Must start with a single slash
  if (!trimmed.startsWith("/")) {
    return fallback
  }

  // 2. Reject protocol-relative URLs (e.g. //evil.com, ///evil.com)
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback
  }

  // 3. Reject backslash trickery or carriage returns/null bytes
  if (/[\r\n\t\0\\]/.test(trimmed)) {
    return fallback
  }

  // 4. Reject javascript: or other pseudo-protocols
  if (/^javascript:/i.test(trimmed) || /^data:/i.test(trimmed) || /^vbscript:/i.test(trimmed)) {
    return fallback
  }

  // 5. Verify using URL constructor against dummy base to ensure it remains on the same origin path
  try {
    const dummyOrigin = "http://localhost"
    const parsed = new URL(trimmed, dummyOrigin)
    if (parsed.origin !== dummyOrigin) {
      return fallback
    }

    // Must still start with single slash and not protocol-relative
    if (!parsed.pathname.startsWith("/") || parsed.pathname.startsWith("//")) {
      return fallback
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}
