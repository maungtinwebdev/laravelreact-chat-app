import React, { useState, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/Components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { useToast } from "@/Components/ui/use-toast";
import { Camera, Loader2, X, User, Mail, Shield, Key } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Label } from "@/Components/ui/label";
import { Separator } from "@/Components/ui/separator";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Profile({ auth }) {
    const { toast } = useToast();
    const [profileImage, setProfileImage] = useState(null);
    const [profilePreview, setProfilePreview] = useState(null);
    const [uploadingProfile, setUploadingProfile] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const imageInputRef = useRef(null);

    const { data, setData, post, processing, errors } = useForm({
        name: auth.user.name,
        email: auth.user.email,
        avatar_url: auth.user.avatar_url,
    });

    const handleProfileImageSelect = (event) => {
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

        setProfileImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfilePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleProfileImageUpload = async () => {
        if (!profileImage) return;

        try {
            setUploadingProfile(true);
            setUploadProgress(0);

            // Create a unique file name
            const fileExt = profileImage.name.split('.').pop();
            const fileName = `${auth.user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // Upload to Supabase with progress tracking
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, profileImage, {
                    cacheControl: '3600',
                    upsert: true,
                    onUploadProgress: (progress) => {
                        const percent = (progress.loaded / progress.total) * 100;
                        setUploadProgress(percent);
                    }
                });

            if (uploadError) {
                throw uploadError;
            }

            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update the user's profile with the new avatar URL
            const response = await fetch('/api/user/update-avatar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({ avatar_url: publicUrl })
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            // Update local state
            setData('avatar_url', publicUrl);

            toast({
                title: "Success",
                description: "Profile picture updated successfully",
            });

            // Reset states
            setProfileImage(null);
            setProfilePreview(null);
            setUploadProgress(0);

            // Reload the page to reflect changes
            window.location.reload();

        } catch (error) {
            console.error('Error uploading profile image:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to upload profile image",
                variant: "destructive",
            });
        } finally {
            setUploadingProfile(false);
        }
    };

    const cancelProfileUpload = () => {
        setProfileImage(null);
        setProfilePreview(null);
        setUploadProgress(0);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('profile.update'));
    };

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <Card className="overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600" />
                <div className="px-6 pb-6">
                    <div className="relative -mt-16">
                        <div className="relative group">
                            <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                                <AvatarImage src={profilePreview || data.avatar_url} />
                                <AvatarFallback className="text-4xl">
                                    {data.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-full">
                                <div className="bg-white p-2 rounded-full">
                                    <Camera className="w-6 h-6 text-gray-700" />
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={imageInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleProfileImageSelect}
                                disabled={uploadingProfile}
                            />
                        </div>
                        <div className="mt-4">
                            <h2 className="text-2xl font-bold">{data.name}</h2>
                            <p className="text-gray-500">{data.email}</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Profile Content */}
            <Tabs defaultValue="general" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">General Information</h3>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            Name
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            className="w-full"
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-500">{errors.name}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            Email
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            className="w-full"
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-red-500">{errors.email}</p>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={processing || uploadingProfile}
                                    className="w-full"
                                >
                                    {processing ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Saving Changes...</span>
                                        </div>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Security Settings</h3>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-5 h-5 text-gray-500" />
                                        <div>
                                            <h4 className="font-medium">Two-Factor Authentication</h4>
                                            <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                                        </div>
                                    </div>
                                    <Button variant="outline">Enable</Button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Key className="w-5 h-5 text-gray-500" />
                                        <div>
                                            <h4 className="font-medium">Change Password</h4>
                                            <p className="text-sm text-gray-500">Update your password regularly to keep your account secure</p>
                                        </div>
                                    </div>
                                    <Button variant="outline">Change</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Notification Preferences</h3>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium">Email Notifications</h4>
                                        <p className="text-sm text-gray-500">Receive email updates about your account</p>
                                    </div>
                                    <Button variant="outline">Configure</Button>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium">Push Notifications</h4>
                                        <p className="text-sm text-gray-500">Receive push notifications on your devices</p>
                                    </div>
                                    <Button variant="outline">Configure</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Profile Image Preview Modal */}
            {profilePreview && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Update Profile Picture</h3>
                        <div className="relative mb-4">
                            <img
                                src={profilePreview}
                                alt="Profile Preview"
                                className="w-full h-48 object-cover rounded-lg"
                            />
                            {uploadProgress > 0 && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 rounded-b-lg p-2">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-white text-xs mt-1 text-center">
                                        Uploading... {Math.round(uploadProgress)}%
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={cancelProfileUpload}
                                disabled={uploadingProfile}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleProfileImageUpload}
                                disabled={uploadingProfile}
                            >
                                {uploadingProfile ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Uploading...</span>
                                    </div>
                                ) : (
                                    'Update Profile'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
