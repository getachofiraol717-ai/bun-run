import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface YouTubeVideo {
  id: string;
  title: string;
  channel: string;
  description: string;
  thumbnail: string | null;
  url: string | null;
}

export interface YouTubeResult {
  items: YouTubeVideo[];
  error?: string;
  nextPageToken?: string | null;
}

export type YouTubeOrder = 'relevance' | 'date' | 'viewCount' | 'rating';
export type YouTubeDuration = 'any' | 'short' | 'medium' | 'long';
export type YouTubeRecency = '' | 'day' | 'week' | 'month' | 'year';

export interface UseYouTubeVideosOptions {
  query?: string;
  subject?: string;
  grade?: number;
  enabled?: boolean;
  /** Page size — keep small on mobile for faster loads. */
  pageSize?: number;
  order?: YouTubeOrder;
  duration?: YouTubeDuration;
  recency?: YouTubeRecency;
  captions?: boolean;
}

/** Paginated educational video search via the youtube-videos edge function. */
export function useYouTubeVideos(opts: UseYouTubeVideosOptions) {
  const {
    query = '',
    subject = '',
    grade = 0,
    enabled = true,
    pageSize = 12,
    order = 'relevance',
    duration = 'any',
    recency = '',
    captions = false,
  } = opts;

  return useInfiniteQuery<YouTubeResult>({
    queryKey: ['youtube-videos', query, subject, grade, pageSize, order, duration, recency, captions],
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
    initialPageParam: '' as string,
    getNextPageParam: (last) => last.nextPageToken || undefined,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.functions.invoke('youtube-videos', {
        body: {
          query,
          subject,
          grade,
          max: pageSize,
          order,
          duration,
          recency,
          captions,
          pageToken: pageParam || '',
        },
      });
      if (error) return { items: [], error: error.message, nextPageToken: null };
      return { items: data?.items ?? [], error: data?.error, nextPageToken: data?.nextPageToken ?? null };
    },
  });
}
