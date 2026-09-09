// YouTube lesson search for the Library "Videos" tab.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const ORDERS = new Set(["relevance", "date", "viewCount", "rating"]);
const DURATIONS = new Set(["any", "short", "medium", "long"]);
const RECENCY: Record<string, number> = { day: 1, week: 7, month: 30, year: 365 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const KEY = Deno.env.get("YOUTUBE_API_KEY");
  if (!KEY) {
    return json({ error: "YOUTUBE_API_KEY not configured", items: [] }, 503);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawQuery = typeof body?.query === "string" ? body.query.trim() : "";
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const grade = Number.isFinite(Number(body?.grade)) ? Number(body.grade) : 0;
    const max = Math.min(Math.max(Number(body?.max) || 12, 1), 24);
    const pageToken = typeof body?.pageToken === "string" ? body.pageToken.trim().slice(0, 200) : "";
    const order = ORDERS.has(body?.order) ? body.order : "relevance";
    const duration = DURATIONS.has(body?.duration) ? body.duration : "any";
    const recency = typeof body?.recency === "string" && RECENCY[body.recency] ? body.recency : "";
    const captions = body?.captions === true;

    if (rawQuery.length > 200 || subject.length > 100) {
      return json({ error: "Invalid query" }, 400);
    }

    const parts = [rawQuery, subject && subject !== "All" ? subject : "", grade ? `grade ${grade}` : "", "lesson"]
      .filter(Boolean)
      .join(" ");
    const q = parts.trim() || "school lesson";

    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("key", KEY);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("safeSearch", "strict");
    url.searchParams.set("videoEmbeddable", "true");
    url.searchParams.set("maxResults", String(max));
    url.searchParams.set("q", q);
    url.searchParams.set("order", order);
    if (duration !== "any") url.searchParams.set("videoDuration", duration);
    if (captions) url.searchParams.set("videoCaption", "closedCaption");
    if (recency) {
      const after = new Date(Date.now() - RECENCY[recency] * 86400000).toISOString();
      url.searchParams.set("publishedAfter", after);
    }
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString());
    const data = await res.json();
    if (!res.ok) {
      return json({ error: data?.error?.message ?? `YouTube API error ${res.status}`, items: [] }, res.status);
    }

    const items = (data.items ?? []).map((it: any) => ({
      id: it.id?.videoId,
      title: it.snippet?.title ?? "Untitled",
      channel: it.snippet?.channelTitle ?? "",
      description: it.snippet?.description ?? "",
      thumbnail: it.snippet?.thumbnails?.medium?.url ?? it.snippet?.thumbnails?.default?.url ?? null,
      url: it.id?.videoId ? `https://www.youtube.com/watch?v=${it.id.videoId}` : null,
    })).filter((v: any) => v.id);

    return json({
      items,
      query: q,
      nextPageToken: data.nextPageToken ?? null,
      prevPageToken: data.prevPageToken ?? null,
      totalResults: data.pageInfo?.totalResults ?? items.length,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "youtube-videos failed", items: [] }, 500);
  }
});
