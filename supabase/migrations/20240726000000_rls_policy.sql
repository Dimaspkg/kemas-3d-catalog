-- Enable RLS for all tables in the storage schema
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "allow_public_read_access" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_uploads" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_uploads" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_read_for_all_buckets" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_insert_for_all_buckets" ON storage.objects;

-- Policy to allow public read access to all files in all buckets
CREATE POLICY "allow_public_read_for_all_buckets"
ON storage.objects
FOR SELECT
USING (true);

-- Policy to allow public uploads (inserts) to all buckets
CREATE POLICY "allow_public_insert_for_all_buckets"
ON storage.objects
FOR INSERT
WITH CHECK (true);
