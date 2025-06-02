import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Users, MessageSquare, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from "@/Components/ui/use-toast";

export default function Dashboard({ auth }) {
    const { toast } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const usersResponse = await axios.get('/users', {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

                if (usersResponse.data && usersResponse.data.users) {
                    setUsers(usersResponse.data.users);
                } else {
                    throw new Error('Invalid users data format');
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setError(error.message);
                toast({
                    title: "Error",
                    description: "Failed to load users data",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleNavigation = (path) => {
        try {
            router.visit(path);
        } catch (error) {
            console.error('Navigation error:', error);
            toast({
                title: "Error",
                description: "Failed to navigate to the requested page",
                variant: "destructive",
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl text-center py-5 bg-green-500 font-semibold leading-tight text-gray-800">
                    Dashboard Admin
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h2 className="text-2xl font-semibold mb-6">Welcome, {auth.user.name}!</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <button
                                    onClick={() => handleNavigation('/chat')}
                                    className="flex items-center p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <MessageSquare className="w-8 h-8 text-[#0084ff] mr-4" />
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">Chat</h3>
                                        <p className="text-gray-500">Start chatting with other users</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleNavigation('/expense-tracker')}
                                    className="flex items-center p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <MessageSquare className="w-8 h-8 text-[#0084ff] mr-4" />
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">Expense Tracking App</h3>
                                        <p className="text-gray-500">Start track your income and expense</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleNavigation('/profile/edit')}
                                    className="flex items-center p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <Settings className="w-8 h-8 text-[#0084ff] mr-4" />
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">Profile Settings</h3>
                                        <p className="text-gray-500">Manage your account settings</p>
                                    </div>
                                </button>

                                {auth.user.is_admin && (
                                    <button
                                        onClick={() => handleNavigation('/admin/users')}
                                        className="flex items-center p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <Users className="w-8 h-8 text-[#0084ff] mr-4" />
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                                            <p className="text-gray-500">Manage users and their permissions</p>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
