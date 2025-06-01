import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { User, Mail, Calendar, Clock, Edit2, Trash2, Ban, AlertTriangle, CheckCircle2, Loader2, Search, X, UserPlus, Pencil } from 'lucide-react';
import { DateTime } from 'luxon';
import { useToast } from "@/Components/ui/use-toast";
import { Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Switch } from "@/Components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/Components/ui/dialog";

export default function UserManagement({ auth, users: initialUsers = [] }) {
    const { toast } = useToast();
    const [users, setUsers] = useState(Array.isArray(initialUsers) ? initialUsers : []);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const createForm = useForm({
        name: '',
        email: '',
        password: '',
        is_admin: false,
    });

    const editForm = useForm({
        name: '',
        email: '',
        password: '',
        is_admin: false,
    });

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

            setUsers(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast({
                title: "Error",
                description: "Failed to load users",
                variant: "destructive",
            });
            setLoading(false);
            setUsers([]);
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
                case 'make_admin':
                    updateData = { is_admin: true };
                    break;
                case 'remove_admin':
                    updateData = { is_admin: false };
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
                // Use Laravel's API for user updates
                const response = await fetch(route('admin.users.update', userId), {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to update user');
                }

                const updatedUser = await response.json();

                // Update local state with the response data
                setUsers(prevUsers =>
                    prevUsers.map(user =>
                        user.id === userId ? { ...user, ...updatedUser } : user
                    )
                );
            }

            toast({
                title: "Success",
                description: `User ${action.replace('_', ' ')} successfully`,
            });
        } catch (error) {
            console.error(`Error ${action}ing user:`, error);
            toast({
                title: "Error",
                description: error.message || `Failed to ${action.replace('_', ' ')} user`,
                variant: "destructive",
            });
        } finally {
            setActionLoading(false);
        }
    };

    const filteredUsers = Array.isArray(users) ? users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    ) : [];

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

    const handleCreate = (e) => {
        e.preventDefault();
        createForm.post(route('admin.users.store'), {
            onSuccess: () => {
                setIsCreateDialogOpen(false);
                createForm.reset();
                fetchUsers(); // Refresh the user list
                toast({
                    title: "Success",
                    description: "User created successfully",
                });
            },
            onError: (errors) => {
                toast({
                    title: "Error",
                    description: Object.values(errors).join('\n'),
                    variant: "destructive",
                });
            },
        });
    };

    const handleEdit = (e) => {
        e.preventDefault();
        editForm.put(route('admin.users.update', selectedUser.id), {
            onSuccess: () => {
                setIsEditDialogOpen(false);
                setSelectedUser(null);
                editForm.reset();
                fetchUsers(); // Refresh the user list
                toast({
                    title: "Success",
                    description: "User updated successfully",
                });
            },
            onError: (errors) => {
                toast({
                    title: "Error",
                    description: Object.values(errors).join('\n'),
                    variant: "destructive",
                });
            },
        });
    };

    const handleDelete = (userId) => {
        if (confirm('Are you sure you want to delete this user?')) {
            router.delete(route('admin.users.destroy', userId), {
                onSuccess: () => {
                    fetchUsers(); // Refresh the user list
                    toast({
                        title: "Success",
                        description: "User deleted successfully",
                    });
                },
                onError: (errors) => {
                    toast({
                        title: "Error",
                        description: Object.values(errors).join('\n'),
                        variant: "destructive",
                    });
                },
            });
        }
    };

    const openEditDialog = (user) => {
        setSelectedUser(user);
        editForm.setData({
            name: user.name,
            email: user.email,
            password: '',
            is_admin: user.is_admin,
        });
        setIsEditDialogOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0084ff]"></div>
            </div>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="User Management" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-semibold">User Management</h2>
                                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            Add User
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[500px]">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-bold">Create New User</DialogTitle>
                                            <DialogDescription className="text-sm text-gray-500 mt-1">
                                                Add a new user to the system with their details and permissions.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleCreate} className="space-y-6 mt-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                                                    <Input
                                                        id="name"
                                                        value={createForm.data.name}
                                                        onChange={e => createForm.setData('name', e.target.value)}
                                                        placeholder="John Doe"
                                                        className="w-full"
                                                        required
                                                    />
                                                    {createForm.errors.name && (
                                                        <p className="text-sm text-red-500">{createForm.errors.name}</p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={createForm.data.email}
                                                        onChange={e => createForm.setData('email', e.target.value)}
                                                        placeholder="john@example.com"
                                                        className="w-full"
                                                        required
                                                    />
                                                    {createForm.errors.email && (
                                                        <p className="text-sm text-red-500">{createForm.errors.email}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        value={createForm.data.password}
                                                        onChange={e => createForm.setData('password', e.target.value)}
                                                        placeholder="••••••••"
                                                        className="w-full pr-10"
                                                        required
                                                    />
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                        <span className="text-gray-400 text-sm">min. 8 chars</span>
                                                    </div>
                                                </div>
                                                {createForm.errors.password && (
                                                    <p className="text-sm text-red-500">{createForm.errors.password}</p>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                    <div className="space-y-1">
                                                        <Label htmlFor="is_admin" className="text-sm font-medium">Admin Access</Label>
                                                        <p className="text-sm text-gray-500">Grant administrative privileges to this user</p>
                                                    </div>
                                                    <Switch
                                                        id="is_admin"
                                                        checked={createForm.data.is_admin}
                                                        onCheckedChange={checked => createForm.setData('is_admin', checked)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setIsCreateDialogOpen(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                    disabled={createForm.processing}
                                                >
                                                    {createForm.processing ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Creating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserPlus className="w-4 h-4 mr-2" />
                                                            Create User
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="mb-4">
                                <Input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="max-w-sm"
                                />
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Profile</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Admin</TableHead>
                                        <TableHead>Created At</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    {user.profile_photo ? (
                                                        <div className="flex flex-col items-center">
                                                            <img
                                                                src={user.profile_photo}
                                                                alt={`${user.name}'s profile`}
                                                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300">
                                                                <User className="w-5 h-5 text-gray-500" />
                                                            </div>
                                                            <span className="text-xs text-gray-500 mt-1">
                                                                No photo
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(user.status || 'active')}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        checked={Boolean(user.is_admin)}
                                                        onCheckedChange={async (checked) => {
                                                            try {
                                                                setActionLoading(true);
                                                                const response = await fetch(route('admin.users.update', user.id), {
                                                                    method: 'PUT',
                                                                    headers: {
                                                                        'Content-Type': 'application/json',
                                                                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                                                                        'Accept': 'application/json'
                                                                    },
                                                                    body: JSON.stringify({ is_admin: checked })
                                                                });

                                                                if (!response.ok) {
                                                                    throw new Error('Failed to update user');
                                                                }

                                                                const updatedUser = await response.json();
                                                                setUsers(prevUsers =>
                                                                    prevUsers.map(u =>
                                                                        u.id === user.id ? { ...u, ...updatedUser } : u
                                                                    )
                                                                );

                                                                toast({
                                                                    title: "Success",
                                                                    description: `User ${checked ? 'made admin' : 'removed from admin'} successfully`,
                                                                });
                                                            } catch (error) {
                                                                console.error('Error updating user:', error);
                                                                toast({
                                                                    title: "Error",
                                                                    description: "Failed to update user permissions",
                                                                    variant: "destructive",
                                                                });
                                                            } finally {
                                                                setActionLoading(false);
                                                            }
                                                        }}
                                                        disabled={actionLoading || user.id === auth.user.id}
                                                    />
                                                    {user.id === auth.user.id && (
                                                        <span className="text-xs text-gray-500">(You)</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => openEditDialog(user)}
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={() => handleDelete(user.id)}
                                                        disabled={user.id === auth.user.id}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Edit User</DialogTitle>
                        <DialogDescription className="text-sm text-gray-500 mt-1">
                            Update user information and permissions.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4">
                        <div>
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={editForm.data.name}
                                onChange={e => editForm.setData('name', e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={editForm.data.email}
                                onChange={e => editForm.setData('email', e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
                            <Input
                                id="edit-password"
                                type="password"
                                value={editForm.data.password}
                                onChange={e => editForm.setData('password', e.target.value)}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="edit-is_admin"
                                checked={editForm.data.is_admin}
                                onCheckedChange={checked => editForm.setData('is_admin', checked)}
                            />
                            <Label htmlFor="edit-is_admin">Admin User</Label>
                        </div>
                        <Button type="submit" className="w-full">
                            Update User
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
