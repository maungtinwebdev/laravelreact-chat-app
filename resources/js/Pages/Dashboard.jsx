import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import Chat from './Chat/Chat';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard({ auth }) {
    const [messages, setMessages] = useState([]);
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

                // Fetch messages
                const messagesResponse = await axios.get('/chat', {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

                if (messagesResponse.data && messagesResponse.data.messages) {
                    setMessages(messagesResponse.data.messages);
                } else {
                    throw new Error('Invalid messages data format');
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
                <h2 className="text-xl bg-green-500 font-semibold leading-tight text-gray-800">
                    Dashboard Admin
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            You're logged in!
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
