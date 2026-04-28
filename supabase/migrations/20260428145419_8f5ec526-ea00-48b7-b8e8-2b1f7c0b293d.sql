UPDATE public.configuracoes_sindico
SET
  video_homepage_url = NULL,
  video_homepage_horizontal_url = NULL
WHERE
  video_homepage_url LIKE '%/videos/homepage/1774238437862.mp4'
  OR video_homepage_horizontal_url LIKE '%/videos/homepage-horizontal/1774238496065.mp4';