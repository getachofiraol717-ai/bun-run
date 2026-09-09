// Supabase Edge Functions shared CORS configuration
export const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
  "https://knowledge-universe.app",
  "https://ku-ethiopia.web.app",
];

export function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers?.get("origin");
  const isAllowed = origin && (
    allowedOrigins.includes(origin) ||
    origin.endsWith(".lovableproject.com") ||
    origin.endsWith(".run.app") ||
    origin.startsWith("http://localhost:")
  );

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-chapa-signature",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-chapa-signature",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
