-- Enable Row Level Security for storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for the 'site-assets' bucket
CREATE POLICY "Allow public access to site-assets"
ON storage.objects FOR ALL
USING ( bucket_id = 'site-assets' );

-- Create policies for the 'product-images' bucket
CREATE POLICY "Allow public access to product-images"
ON storage.objects FOR ALL
USING ( bucket_id = 'product-images' );

-- Create policies for the 'product-models' bucket
CREATE POLICY "Allow public access to product-models"
ON storage.objects FOR ALL
USING ( bucket_id = 'product-models' );

-- Create policies for the 'environment-maps' bucket
CREATE POLICY "Allow public access to environment-maps"
ON storage.objects FOR ALL
USING ( bucket_id = 'environment-maps' );
