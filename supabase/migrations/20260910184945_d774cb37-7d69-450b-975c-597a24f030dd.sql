CREATE TABLE public.newsletter_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  beehiiv_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT,
  excerpt TEXT,
  thumbnail_url TEXT,
  web_url TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.newsletter_posts TO anon;
GRANT SELECT ON public.newsletter_posts TO authenticated;
GRANT ALL ON public.newsletter_posts TO service_role;

ALTER TABLE public.newsletter_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view newsletter posts"
ON public.newsletter_posts FOR SELECT
TO anon, authenticated
USING (true);

CREATE TRIGGER update_newsletter_posts_updated_at
BEFORE UPDATE ON public.newsletter_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();