/**
 * Redact sensitive information (API keys, secrets, tokens, passwords)
 * from code or text before transmitting to AI models or logging.
 */

const SECRET_PATTERNS: RegExp[] = [
  /AIzaSy[A-Za-z0-9_-]{33}/g,                           // Google API key
  /sk-[A-Za-z0-9]{32,}/g,                                // OpenAI / Stripe secret key
  /ghp_[A-Za-z0-9]{36}/g,                               // GitHub personal access token
  /gho_[A-Za-z0-9]{36}/g,                               // GitHub OAuth token
  /glpat-[A-Za-z0-9\-_]{20,}/g,                        // GitLab Personal Access Token
  /xox[baprs]-[A-Za-z0-9\-]{10,}/g,                    // Slack token
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, // JWT Token
  /bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,                   // Bearer Token
];

export function redactSecrets(text: string): string {
  if (!text) return text;
  let sanitized = text;

  // Redact specific pattern matches
  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED_SECRET]');
  }

  // Redact key-value secrets
  sanitized = sanitized.replace(
    /(?:password|passwd|secret|private_key|token|api_key)\s*[:=]\s*["']?([^\s"';]+)["']?/gi,
    (match) => {
      const parts = match.split(/[:=]/);
      return `${parts[0]}: "[REDACTED_SECRET]"`;
    }
  );

  return sanitized;
}
