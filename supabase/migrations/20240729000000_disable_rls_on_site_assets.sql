-- Disable RLS for the site-assets bucket to allow public access for logo
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to site-assets" ON storage.objects;

CREATE POLICY "Allow public access to site-assets"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'site-assets');