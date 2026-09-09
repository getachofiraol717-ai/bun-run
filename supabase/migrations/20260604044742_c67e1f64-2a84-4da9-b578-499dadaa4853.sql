
REVOKE ALL ON FUNCTION public.match_doc_chunks(uuid, uuid, vector, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_doc_chunks(uuid, uuid, vector, int) TO authenticated, service_role;
