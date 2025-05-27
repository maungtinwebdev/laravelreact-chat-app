-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy for chat-images bucket
CREATE POLICY "Allow authenticated users to upload chat images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'chat-images' AND
    (storage.foldername(name))[1] = 'chat-images'
);

-- Create policy for reading chat images
CREATE POLICY "Allow public to read chat images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'chat-images');

-- Create policy for deleting own chat images
CREATE POLICY "Allow users to delete their own chat images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'chat-images' AND
    auth.uid() = owner
);

-- Create policy for updating own chat images
CREATE POLICY "Allow users to update their own chat images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'chat-images' AND
    auth.uid() = owner
)
WITH CHECK (
    bucket_id = 'chat-images' AND
    auth.uid() = owner
);
