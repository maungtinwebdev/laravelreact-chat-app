import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import Chat from './Chat/Chat';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard({ auth }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch users first
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
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="flex flex-col space-y-4">
                                <p>You're logged in!</p>
                                <Link
                                    href={route('chat.index')}
                                    className="inline-flex items-center px-4 py-2 bg-[#0084ff] text-white rounded-md hover:bg-[#0073e6] transition-colors duration-200"
                                >
                                    Go to Chat
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* <div className="mt-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        {loading ? (
                            <div className="p-6 text-center text-gray-500">
                                Loading chat...
                            </div>
                        ) : error ? (
                            <div className="p-6 text-center text-red-500">
                                Error: {error}
                            </div>
                        ) : (
                            <Chat messages={messages} users={users} auth={auth} />
                        )}
                    </div>
                </div> */}
            </div>
        </AuthenticatedLayout>
    );
}
