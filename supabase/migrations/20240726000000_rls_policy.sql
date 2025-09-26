
-- Enable Row Level Security for storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on storage.objects to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;

-- Create a policy to allow public read access to all files in all buckets
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (true);

-- Create policies to allow public uploads (inserts) to specific buckets
CREATE POLICY "Allow public inserts on site-assets" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'site-assets');

CREATE POLICY "Allow public inserts on product-images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public inserts on product-models" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-models');

CREATE POLICY "Allow public inserts on environment-maps" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'environment-maps');

-- Note: We are not allowing public update or delete for safety.
-- These operations should be handled by server-side logic using a service_role key if needed.
