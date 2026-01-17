/*
  # Create Storage Bucket for Item Images

  ## Overview
  Creates a public storage bucket for item images with appropriate access policies.

  ## Changes
  1. Creates a public storage bucket named 'item-images'
  2. Sets up storage policies for authenticated users to upload and view images
  3. Allows public read access for viewing images

  ## Security
  - Only authenticated users can upload images
  - All users can view images (public read access)
  - Users can only delete their own images
*/

-- Create storage bucket for item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload item images" ON storage.objects;
DROP POLICY IF EXISTS "Public access to item images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own item images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own item images" ON storage.objects;

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload item images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'item-images');

-- Policy: Allow public read access to images
CREATE POLICY "Public access to item images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'item-images');

-- Policy: Allow users to update their own images
CREATE POLICY "Users can update own item images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'item-images');

-- Policy: Allow users to delete their own images
CREATE POLICY "Users can delete own item images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'item-images');
