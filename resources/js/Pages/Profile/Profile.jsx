import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { User, Mail, Calendar, Clock, Edit2, Save, X, Camera, Loader2, ArrowLeft, Home } from 'lucide-react';
import { DateTime } from 'luxon';
import { useForm } from '@inertiajs/react';
import { useToast } from "@/Components/ui/use-toast";
import { Link } from '@inertiajs/react';

export default function Profile({ auth }) {
    const { toast } = useToast();
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [loading, setLoading] = useState(true);
    const [timezone, setTimezone] = useState('');
    const [lastActive, setLastActive] = useState('');
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
                setEditedName(data.name);
                setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
                setLastActive(data.last_active_at);
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

    const getProfileImageUrl = () => {
        if (user?.profile_photo) {
            // If the profile photo is a full URL, use it directly
            if (user.profile_photo.startsWith('http')) {
                return user.profile_photo;
            }
            // If it's a Supabase storage path, get the public URL
            return supabase.storage
                .from('profile-photos')
                .getPublicUrl(user.profile_photo).data.publicUrl;
        }
        // Fallback to UI Avatars if no profile photo
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=7C3AED&color=fff&size=128`;
    };

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

            const formData = new FormData();
            formData.append('name', editedName);
            if (data.profile_photo) {
                formData.append('profile_photo', data.profile_photo);
            }

            const response = await fetch('/api/profile/update', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update profile');
            }

            const result = await response.json();
            setUser(prev => ({ ...prev, name: editedName, profile_photo: result.profile_photo }));
            setIsEditing(false);
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

    const formatLastActive = (timestamp) => {
        if (!timestamp) return 'Never';

        try {
            const lastActive = DateTime.fromISO(timestamp).setZone(timezone);
            const now = DateTime.now().setZone(timezone);
            return lastActive.toFormat('MMM d, yyyy h:mm a');
        } catch (error) {
            return 'Unknown';
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
            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mb-6">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center text-gray-600 hover:text-gray-900"
                >
                    <Home className="w-5 h-5 mr-2" />
                    Back to Dashboard
                </Link>
                <Link
                    href="/profile/edit"
                    className="inline-flex items-center px-4 py-2 bg-[#0084ff] text-white rounded-md hover:bg-[#0073e6] transition-colors"
                >
                    <Edit2 className="w-5 h-5 mr-2" />
                    Edit Profile
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Profile Header */}
                <div className="relative h-48 bg-gradient-to-r from-[#0084ff] to-[#00b4ff]">
                    <div className="absolute -bottom-16 left-8">
                        <div className="relative group">
                            <div className="relative">
                                <img
                                    src={getProfileImageUrl()}
                                    alt={user?.name}
                                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=7C3AED&color=fff&size=128`;
                                    }}
                                />
                                {uploadingPhoto && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                                disabled={uploadingPhoto}
                            >
                                <Camera className="w-5 h-5 text-gray-600" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handlePhotoSelect}
                                disabled={uploadingPhoto}
                            />
                        </div>
                    </div>
                </div>

                {/* Profile Content */}
                <div className="pt-20 px-8 pb-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        className="text-2xl font-bold border-b-2 border-[#0084ff] focus:outline-none"
                                        disabled={loading}
                                    />
                                    <button
                                        onClick={handleUpdateProfile}
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                                        disabled={loading || uploadingPhoto}
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Save className="w-5 h-5" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditedName(user.name);
                                            setPhotoPreview(null);
                                            setData('profile_photo', null);
                                        }}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                        disabled={loading}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Profile Information */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-gray-600">
                            <Mail className="w-5 h-5" />
                            <span>{user?.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <Calendar className="w-5 h-5" />
                            <span>Joined {DateTime.fromISO(user?.created_at).toFormat('MMMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <Clock className="w-5 h-5" />
                            <span>Last active: {formatLastActive(lastActive)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <User className="w-5 h-5" />
                            <span>Timezone: {timezone}</span>
                        </div>
                    </div>

                    {/* Account Settings */}
                    <div className="mt-8 pt-8 border-t border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Settings</h2>
                        <div className="space-y-4">
                            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                                Change Password
                            </button>
                            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                                Notification Settings
                            </button>
                            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-red-600">
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
 