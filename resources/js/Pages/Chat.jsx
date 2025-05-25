import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Chat from '@/Components/Chat';
import { Head } from '@inertiajs/react';

export default function ChatPage({ auth }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Chat</h2>}
        >
            <Head title="Chat" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <Chat />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
