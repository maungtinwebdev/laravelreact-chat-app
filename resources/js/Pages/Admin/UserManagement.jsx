import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { User, Mail, Calendar, Clock, Edit2, Trash2, Ban, AlertTriangle, CheckCircle2, Loader2, Search } from 'lucide-react';
import { DateTime } from 'luxon';
import { useToast } from "@/Components/ui/use-toast";
import { Link } from '@inertiajs/react';

export default function UserManagement({ auth }) {
    const { toast } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, name, email, profile_photo, status, created_at, last_active_at, banned_at, suspended_until, is_admin')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setUsers(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast({
                title: "Error",
                description: "Failed to load users",
                variant: "destructive",
            });
            setLoading(false);
        }
    };

    const handleUserAction = async (userId, action) => {
        try {
            setActionLoading(true);
            let updateData = {};

            switch (action) {
                case 'ban':
                    updateData = { status: 'banned', banned_at: new Date().toISOString() };
                    break;
                case 'unban':
                    updateData = { status: 'active', banned_at: null };
                    break;
                case 'suspend':
                    updateData = {
                        status: 'suspended',
                        suspended_until: DateTime.now().plus({ days: 7 }).toISO()
                    };
                    break;
                case 'delete':
                    // Delete user's profile photo if exists
                    const user = users.find(u => u.id === userId);
                    if (user?.profile_photo) {
                        const photoPath = user.profile_photo.split('/').pop();
                        await supabase.storage
                            .from('profile-photos')
                            .remove([photoPath]);
                    }
                    // Delete user from database
                    const { error: deleteError } = await supabase
                        .from('users')
                        .delete()
                        .eq('id', userId);
                    if (deleteError) throw deleteError;
                    break;
                default:
                    return;
            }

            if (action !== 'delete') {
                const { error: updateError } = await supabase
                    .from('users')
                    .update(updateData)
                    .eq('id', userId);

                if (updateError) throw updateError;
            }

            // Refresh user list
            await fetchUsers();

            toast({
                title: "Success",
                description: `User ${action}ed successfully`,
            });
        } catch (error) {
            console.error(`Error ${action}ing user:`, error);
            toast({
                title: "Error",
                description: `Failed to ${action} user`,
                variant: "destructive",
            });
        } finally {
            setActionLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status) => {
        const badges = {
            active: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
            banned: { color: 'bg-red-100 text-red-800', icon: Ban },
            suspended: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
        };

        const badge = badges[status] || badges.active;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0084ff]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <div className="mt-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0084ff] focus:border-transparent"
                            />
                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Joined
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Active
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img
                                                    className="h-10 w-10 rounded-full"
                                                    src={user.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7C3AED&color=fff`}
                                                    alt={user.name}
                                                />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(user.status || 'active')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {DateTime.fromISO(user.created_at).toFormat('MMM d, yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.last_active_at ?
                                            DateTime.fromISO(user.last_active_at).toFormat('MMM d, yyyy h:mm a') :
                                            'Never'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setShowUserModal(true);
                                                }}
                                                className="text-[#0084ff] hover:text-[#0073e6]"
                                            >
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                            {user.status === 'banned' ? (
                                                <button
                                                    onClick={() => handleUserAction(user.id, 'unban')}
                                                    disabled={actionLoading}
                                                    className="text-green-600 hover:text-green-700"
                                                >
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleUserAction(user.id, 'ban')}
                                                    disabled={actionLoading}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Ban className="w-5 h-5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleUserAction(user.id, 'suspend')}
                                                disabled={actionLoading}
                                                className="text-yellow-600 hover:text-yellow-700"
                                            >
                                                <AlertTriangle className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleUserAction(user.id, 'delete')}
                                                disabled={actionLoading}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Detail Modal */}
            {showUserModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                            <button
                                onClick={() => setShowUserModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <img
                                    className="h-16 w-16 rounded-full"
                                    src={selectedUser.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=7C3AED&color=fff`}
                                    alt={selectedUser.name}
                                />
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">{selectedUser.name}</h3>
                                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Status</p>
                                    <p className="mt-1">{getStatusBadge(selectedUser.status || 'active')}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Joined</p>
                                    <p className="mt-1">{DateTime.fromISO(selectedUser.created_at).toFormat('MMM d, yyyy')}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Last Active</p>
                                    <p className="mt-1">
                                        {selectedUser.last_active_at ?
                                            DateTime.fromISO(selectedUser.last_active_at).toFormat('MMM d, yyyy h:mm a') :
                                            'Never'}
                                    </p>
                                </div>
                                {selectedUser.suspended_until && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Suspended Until</p>
                                        <p className="mt-1">
                                            {DateTime.fromISO(selectedUser.suspended_until).toFormat('MMM d, yyyy h:mm a')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
