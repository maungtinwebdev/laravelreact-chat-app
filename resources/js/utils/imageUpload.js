import { supabase, getCurrentUser } from '../supabaseClient';

export const uploadImage = async (file, folder = 'avatars') => {
    try {
        // Check if user is authenticated
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('You must be logged in to upload images');
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            throw new Error('Please select an image file');
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('Image size should be less than 5MB');
        }

        // Create a unique file name with user ID
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        // Upload to Supabase Storage with user metadata
        const { data, error } = await supabase.storage
            .from(folder)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true,
                contentType: file.type,
                metadata: {
                    userId: user.id,
                    uploadedAt: new Date().toISOString()
                }
            });

        if (error) {
            console.error('Storage error:', error);
            throw new Error(error.message || 'Failed to upload image');
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(folder)
            .getPublicUrl(filePath);

        return {
            success: true,
            url: publicUrl,
            path: filePath
        };
    } catch (error) {
        console.error('Error uploading image:', error);
        return {
            success: false,
            error: error.message || 'Failed to upload image'
        };
    }
};

export const deleteImage = async (path, folder = 'avatars') => {
    try {
        // Check if user is authenticated
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('You must be logged in to delete images');
        }

        const { error } = await supabase.storage
            .from(folder)
            .remove([path]);

        if (error) {
            console.error('Storage error:', error);
            throw new Error(error.message || 'Failed to delete image');
        }

        return {
            success: true
        };
    } catch (error) {
        console.error('Error deleting image:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete image'
        };
    }
};
