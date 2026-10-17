REVOKE EXECUTE ON FUNCTION public.trg_master_video_aws_sync() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_master_video_rename_aws_sync() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_master_video_aws_sync(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;