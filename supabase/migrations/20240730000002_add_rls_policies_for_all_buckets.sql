-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow public access to all" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated access to all" ON storage.objects;
DROP POLICY IF EXISTS "site-assets policy" ON storage.objects;
DROP POLICY IF EXISTS "product-images policy" ON storage.objects;
DROP POLICY IF EXISTS "product-models policy" ON storage.objects;
DROP POLICY IF EXISTS "environment-maps policy" ON storage.objects;

-- Create a single policy that allows all operations on all public buckets for everyone.
CREATE POLICY "Allow public access to all operations"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'site-assets' OR
  bucket_id = 'product-images' OR
  bucket_id = 'product-models' OR
  bucket_id = 'environment-maps'
)
WITH CHECK (
  bucket_id = 'site-assets' OR
  bucket_id = 'product-images' OR
  bucket_id = 'product-models' OR
  bucket_id = 'environment-maps'
);
