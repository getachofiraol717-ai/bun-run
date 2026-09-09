-- Raise free AI tutor limits (was capping users at 5 messages/day)
UPDATE public.ai_settings
SET free_msg_limit = GREATEST(COALESCE(free_msg_limit, 0), 100),
    free_msg_limit_per_provider = GREATEST(COALESCE(free_msg_limit_per_provider, 0), 100),
    free_img_limit = GREATEST(COALESCE(free_img_limit, 0), 10)
WHERE id = 1;
