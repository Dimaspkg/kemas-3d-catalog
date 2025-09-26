-- Enable Row Level Security for storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public read access for site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage product-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for product-models" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage product-models" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for environment-maps" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage environment-maps" ON storage.objects;

-- Policies for site-assets bucket
CREATE POLICY "Public read access for site-assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'site-assets');

CREATE POLICY "Authenticated users can manage site-assets"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'site-assets');

-- Policies for product-images bucket
CREATE POLICY "Public read access for product-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can manage product-images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'product-images');

-- Policies for product-models bucket
CREATE POLICY "Public read access for product-models"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-models');

CREATE POLICY "Authenticated users can manage product-models"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'product-models');

-- Policies for environment-maps bucket
CREATE POLICY "Public read access for environment-maps"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'environment-maps');

CREATE POLICY "Authenticated users can manage environment-maps"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'environment-maps');
