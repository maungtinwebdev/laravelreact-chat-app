import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { User, Mail, Calendar, Clock, Edit2, Save, X, Camera, Loader2, ArrowLeft } from 'lucide-react';
import { DateTime } from 'luxon';
import { useForm } from '@inertiajs/react';
import { useToast } from "@/Components/ui/use-toast";
import { Link } from '@inertiajs/react';

export default function Edit({ auth }) {
    const { toast } = useToast();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const fileInputRef = useRef(null);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        profile_photo: null,
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', auth.user.id)
                    .single();

                if (error) throw error;

                setUser(data);
                setData('name', data.name);
                setData('email', data.email);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching user data:', error);
                toast({
                    title: "Error",
                    description: "Failed to load profile data",
                    variant: "destructive",
                });
                setLoading(false);
            }
        };

        fetchUserData();
    }, [auth.user.id]);

    const handlePhotoSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Error",
                description: "Please select an image file",
                variant: "destructive",
            });
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast({
                title: "Error",
                description: "Profile image size should be less than 2MB",
                variant: "destructive",
            });
            return;
        }

        setData('profile_photo', file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleUpdateProfile = async () => {
        try {
            setLoading(true);
            setUploadingPhoto(true);

            let profilePhotoUrl = user?.profile_photo;

            // If there's a new photo, upload it to Supabase storage
            if (data.profile_photo) {
                const fileExt = data.profile_photo.name.split('.').pop();
                const fileName = `${auth.user.id}-${Date.now()}.${fileExt}`;
                const filePath = `profile-photos/${fileName}`;

                // Delete old photo if exists
                if (user?.profile_photo) {
                    const oldPhotoPath = user.profile_photo.split('/').pop();
                    await supabase.storage
                        .from('profile-photos')
                        .remove([oldPhotoPath]);
                }

                // Upload new photo
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('profile-photos')
                    .upload(filePath, data.profile_photo, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('profile-photos')
                    .getPublicUrl(filePath);

                profilePhotoUrl = publicUrl;
            }

            // Update user profile in database
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    name: data.name,
                    profile_photo: profilePhotoUrl
                })
                .eq('id', auth.user.id);

            if (updateError) throw updateError;

            setUser(prev => ({ ...prev, name: data.name, profile_photo: profilePhotoUrl }));
            setPhotoPreview(null);
            setData('profile_photo', null);

            toast({
                title: "Success",
                description: "Profile updated successfully",
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to update profile",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            setUploadingPhoto(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0084ff]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <Link
                    href="/profile"
                    className="inline-flex items-center text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Profile
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Profile</h1>

                    {/* Profile Photo Section */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h2>
                        <div className="flex items-center space-x-6">
                            <div className="relative">
                                <img
                                    src={photoPreview || user?.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=7C3AED&color=fff&size=128`}
                                    alt={user?.name}
                                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                                />
                                {uploadingPhoto && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0084ff]"
                                    disabled={uploadingPhoto}
                                >
                                    Change Photo
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handlePhotoSelect}
                                    disabled={uploadingPhoto}
                                />
                                <p className="mt-2 text-sm text-gray-500">
                                    JPG, PNG or GIF (max. 2MB)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Profile Information Form */}
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0084ff] focus:ring-[#0084ff] sm:text-sm"
                                disabled={loading}
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={data.email}
                                disabled
                                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-[#0084ff] focus:ring-[#0084ff] sm:text-sm"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Email cannot be changed
                            </p>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="mt-8">
                        <button
                            onClick={handleUpdateProfile}
                            disabled={loading || uploadingPhoto}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0084ff] hover:bg-[#0073e6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0084ff] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
