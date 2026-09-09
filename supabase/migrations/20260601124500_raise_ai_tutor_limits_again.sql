-- Force the live AI tutor away from the stale 5-message default.
INSERT INTO public.ai_settings (id, free_msg_limit, free_msg_limit_per_provider, free_img_limit, window_hours, enabled)
VALUES (1, 1000, 1000, 50, 24, true)
ON CONFLICT (id) DO UPDATE
SET free_msg_limit = GREATEST(COALESCE(public.ai_settings.free_msg_limit, 0), 1000),
    free_msg_limit_per_provider = GREATEST(COALESCE(public.ai_settings.free_msg_limit_per_provider, 0), 1000),
    free_img_limit = GREATEST(COALESCE(public.ai_settings.free_img_limit, 0), 50),
    window_hours = 24,
    enabled = true,
    updated_at = now();
