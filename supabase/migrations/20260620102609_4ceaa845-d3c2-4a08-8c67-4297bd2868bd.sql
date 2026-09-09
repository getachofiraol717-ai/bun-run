REVOKE ALL ON FUNCTION public.check_subscription_validity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_subscription_validity() FROM anon;
REVOKE ALL ON FUNCTION public.check_subscription_validity() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_subscription_validity() TO service_role;