-- Raise AI tutor free-tier limits (previous bump migrations may not have applied)
INSERT INTO public.ai_settings (id, free_msg_limit, free_msg_limit_per_provider, free_img_limit, window_hours, enabled)
VALUES (1, 200, 200, 20, 24, true)
ON CONFLICT (id) DO UPDATE
SET free_msg_limit = 200,
    free_msg_limit_per_provider = 200,
    free_img_limit = 20,
    enabled = true,
    updated_at = now();
