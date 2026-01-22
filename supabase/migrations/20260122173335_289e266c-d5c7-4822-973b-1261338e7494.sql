-- Make the images bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'images';

-- Create policy to allow public read access to images bucket
CREATE POLICY "Public read access for images bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');