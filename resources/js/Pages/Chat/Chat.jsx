import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';

export default function Chat({ messages: initialMessages, users: initialUsers, auth }) {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState(initialMessages || []);
    const [users, setUsers] = useState(initialUsers || []);
    const [selectedUser, setSelectedUser] = useState(null);
    const messagesEndRef = useRef(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Fetch users if not provided
    useEffect(() => {
        if (!initialUsers || initialUsers.length === 0) {
            setLoading(true);
            axios.get('/api/users')
                .then(response => {
                    setUsers(response.data.users);
                })
                .catch(error => {
                    console.error('Error fetching users:', error);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [initialUsers]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Poll for unread messages count
        const interval = setInterval(async () => {
            try {
                const response = await axios.get('/chat/messages/unread-count');
                setUnreadCount(response.data.count);
            } catch (error) {
                console.error('Error fetching unread count:', error);
            }
        }, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, []);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || !selectedUser) return;

        try {
            const response = await axios.post('/chat/messages', {
                content: message,
                receiver_id: selectedUser.id
            });

            setMessages(prev => [...prev, response.data.message]);
            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const markMessageAsRead = async (messageId) => {
        try {
            await axios.post(`/chat/messages/${messageId}/read`);
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    };

    return (
        <div className="flex h-[600px]">
            {/* Users List */}
            <div className="w-1/4 border-r bg-gray-50 p-4">
                <h2 className="text-lg font-semibold mb-4">Users</h2>
                {loading ? (
                    <div className="text-center text-gray-500">Loading users...</div>
                ) : users.length === 0 ? (
                    <div className="text-center text-gray-500">No users available</div>
                ) : (
                    <div className="space-y-2">
                        {users.map(user => (
                            <button
                                key={user.id}
                                onClick={() => setSelectedUser(user)}
                                className={`w-full text-left p-2 rounded-lg ${
                                    selectedUser?.id === user.id
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'hover:bg-gray-100'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7C3AED&color=fff`}
                                        alt={user.name}
                                        className="w-8 h-8 rounded-full"
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-medium">{user.name}</span>
                                        <span className="text-xs text-gray-500">{user.email}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b">
                            <div className="flex items-center gap-2">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=7C3AED&color=fff`}
                                    alt={selectedUser.name}
                                    className="w-8 h-8 rounded-full"
                                />
                                <div className="flex flex-col">
                                    <span className="font-semibold">{selectedUser.name}</span>
                                    <span className="text-xs text-gray-500">{selectedUser.email}</span>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages
                                .filter(msg =>
                                    (msg.sender_id === selectedUser.id && msg.receiver_id === auth.user.id) ||
                                    (msg.sender_id === auth.user.id && msg.receiver_id === selectedUser.id)
                                )
                                .map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${
                                            msg.sender_id === auth.user.id ? 'justify-end' : 'justify-start'
                                        }`}
                                    >
                                        <div
                                            className={`flex max-w-[70%] ${
                                                msg.sender_id === auth.user.id
                                                    ? 'flex-row-reverse'
                                                    : 'flex-row'
                                            } items-end gap-2`}
                                        >
                                            <img
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender.name)}&background=7C3AED&color=fff`}
                                                alt={msg.sender.name}
                                                className="w-8 h-8 rounded-full"
                                            />
                                            <div
                                                className={`rounded-lg px-4 py-2 ${
                                                    msg.sender_id === auth.user.id
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                <p>{msg.content}</p>
                                                <span
                                                    className={`text-xs ${
                                                        msg.sender_id === auth.user.id
                                                            ? 'text-indigo-200'
                                                            : 'text-gray-500'
                                                    }`}
                                                >
                                                    {new Date(msg.created_at).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="border-t p-4">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <button
                                    type="submit"
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    Send
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        Select a user to start chatting
                    </div>
                )}
            </div>
        </div>
    );
}
