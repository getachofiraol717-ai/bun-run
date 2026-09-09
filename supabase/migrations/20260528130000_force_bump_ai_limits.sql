-- Force-apply AI tutor limits (previous migration's GREATEST may have no-op'd or row was missing)
INSERT INTO public.ai_settings (id, free_msg_limit, free_msg_limit_per_provider, free_img_limit, window_hours, enabled)
VALUES (1, 100, 100, 10, 24, true)
ON CONFLICT (id) DO UPDATE
SET free_msg_limit = 100,
    free_msg_limit_per_provider = 100,
    free_img_limit = 10;
