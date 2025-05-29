import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { User, Mail, Calendar, Clock, Edit2, Save, X, Camera } from 'lucide-react';
import { DateTime } from 'luxon';

export default function Profile({ auth }) {
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [loading, setLoading] = useState(true);
    const [timezone, setTimezone] = useState('');
    const [lastActive, setLastActive] = useState('');

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
                setLoading(false);
            } catch (error) {
                console.error('Error fetching user data:', error);
                setLoading(false);
            }
        };

        fetchUserData();
    }, [auth.user.id]);

    const handleUpdateProfile = async () => {
        try {
            setLoading(true);
            const { error } = await supabase
                .from('users')
                .update({ name: editedName })
                .eq('id', auth.user.id);

            if (error) throw error;

            setUser(prev => ({ ...prev, name: editedName }));
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setLoading(false);
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
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Profile Header */}
                <div className="relative h-48 bg-gradient-to-r from-[#0084ff] to-[#00b4ff]">
                    <div className="absolute -bottom-16 left-8">
                        <div className="relative">
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=7C3AED&color=fff&size=128`}
                                alt={user?.name}
                                className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                            />
                            <button className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors">
                                <Camera className="w-5 h-5 text-gray-600" />
                            </button>
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
                                    />
                                    <button
                                        onClick={handleUpdateProfile}
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                                    >
                                        <Save className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditedName(user.name);
                                        }}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
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
