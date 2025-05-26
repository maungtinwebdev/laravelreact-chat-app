import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';

export default function Chat({ users: initialUsers, auth }) {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState(initialUsers || []);
    const [selectedUser, setSelectedUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [newUserCount, setNewUserCount] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState({});
    const [lastMessageIds, setLastMessageIds] = useState({});
    const messagesEndRef = useRef(null);
    const channelRef = useRef(null);
    const usersListRef = useRef(null);

    // Subscribe to user presence
    useEffect(() => {
        const presenceChannel = supabase.channel('online-users')
            .on('presence', { event: 'sync' }, () => {
                const presenceState = presenceChannel.presenceState();
                const onlineUserIds = new Set();

                Object.keys(presenceState).forEach(key => {
                    presenceState[key].forEach(presence => {
                        if (presence.user_id !== auth.user.id) {
                            onlineUserIds.add(presence.user_id);
                        }
                    });
                });

                setOnlineUsers(onlineUserIds);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({
                        user_id: auth.user.id,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            presenceChannel.unsubscribe();
        };
    }, [auth.user.id]);

    // Subscribe to all messages
    useEffect(() => {
        channelRef.current = supabase
            .channel('messages')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newMessage = payload.new;

                        // Check if the message is relevant to the current user
                        if (newMessage.sender_id === auth.user.id || newMessage.receiver_id === auth.user.id) {
                            // Fetch the complete message with sender data
                            const { data: messageWithSender, error } = await supabase
                                .from('messages')
                                .select(`
                                    *,
                                    sender:sender_id (
                                        id,
                                        name,
                                        email
                                    )
                                `)
                                .eq('id', newMessage.id)
                                .single();

                            if (error) {
                                console.error('Error fetching new message:', error);
                                return;
                            }

                            // Update messages if the current chat is with the sender or receiver
                            if (selectedUser &&
                                (messageWithSender.sender_id === selectedUser.id ||
                                 messageWithSender.receiver_id === selectedUser.id)) {
                                setMessages(prev => [...prev, messageWithSender]);
                                scrollToBottom();
                            }

                            // Update unread messages count if message is from another user
                            if (messageWithSender.sender_id !== auth.user.id) {
                                setUnreadMessages(prev => ({
                                    ...prev,
                                    [messageWithSender.sender_id]: (prev[messageWithSender.sender_id] || 0) + 1
                                }));
                            }

                            // Update last message ID for the conversation
                            const otherUserId = messageWithSender.sender_id === auth.user.id
                                ? messageWithSender.receiver_id
                                : messageWithSender.sender_id;

                            setLastMessageIds(prev => ({
                                ...prev,
                                [otherUserId]: messageWithSender.id
                            }));
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [auth.user.id, selectedUser]);

    // Fetch initial users and subscribe to changes
    useEffect(() => {
        const fetchAndSubscribeToUsers = async () => {
            // Fetch initial users
            const { data: initialUsers, error } = await supabase
                .from('users')
                .select('id, name, email')
                .neq('id', auth.user.id);

            if (error) {
                console.error('Error fetching users:', error);
                return;
            }

            setUsers(initialUsers || []);

            // Subscribe to user changes
            const userChannel = supabase
                .channel('users-changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'users',
                    },
                    async (payload) => {
                        if (payload.eventType === 'INSERT') {
                            // Add new user to the list and increment new user count
                            setUsers(prev => {
                                const newUser = payload.new;
                                if (!prev.find(user => user.id === newUser.id)) {
                                    setNewUserCount(prev => prev + 1);
                                    return [...prev, newUser];
                                }
                                return prev;
                            });
                        } else if (payload.eventType === 'UPDATE') {
                            // Update existing user
                            setUsers(prev =>
                                prev.map(user =>
                                    user.id === payload.new.id ? payload.new : user
                                )
                            );
                        } else if (payload.eventType === 'DELETE') {
                            // Remove deleted user
                            setUsers(prev =>
                                prev.filter(user => user.id !== payload.old.id)
                            );
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(userChannel);
            };
        };

        fetchAndSubscribeToUsers();
    }, [auth.user.id]);

    // Fetch initial messages when a user is selected
    useEffect(() => {
        if (!selectedUser) return;

        const fetchMessages = async () => {
            // Fetch messages between the current user and selected user
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    sender:sender_id (
                        id,
                        name,
                        email
                    )
                `)
                .or(`and(sender_id.eq.${auth.user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${auth.user.id})`)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching messages:', error);
                return;
            }

            setMessages(data || []);
            scrollToBottom();

            // Clear unread messages for selected user
            setUnreadMessages(prev => ({
                ...prev,
                [selectedUser.id]: 0
            }));

            // Update last message ID
            if (data && data.length > 0) {
                setLastMessageIds(prev => ({
                    ...prev,
                    [selectedUser.id]: data[data.length - 1].id
                }));
            }
        };

        fetchMessages();
    }, [selectedUser, auth.user.id]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || !selectedUser) return;

        try {
            // Create message object
            const messageData = {
                content: message.trim(),
                sender_id: auth.user.id,
                receiver_id: selectedUser.id,
                created_at: new Date().toISOString()
            };

            // Insert message into database
            const { data: newMessage, error: messageError } = await supabase
                .from('messages')
                .insert([messageData])
                .select()
                .single();

            if (messageError) throw messageError;

            // Update last message ID
            setLastMessageIds(prev => ({
                ...prev,
                [selectedUser.id]: newMessage.id
            }));

            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const renderUserAvatar = (user) => {
        if (!user) return null;
        return (
            <div className="relative">
                <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=7C3AED&color=fff`}
                    alt={user.name || 'User'}
                    className="w-8 h-8 rounded-full"
                />
                {onlineUsers.has(user.id) && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                )}
            </div>
        );
    };

    return (
        <div className="flex h-[600px]">
            {/* Users List */}
            <div className="w-1/4 border-r bg-gray-50 flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Users</h2>
                    {newUserCount > 0 && (
                        <span className="bg-indigo-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                            {newUserCount} new
                        </span>
                    )}
                </div>
                <div
                    ref={usersListRef}
                    className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    }}
                >
                    <style>
                        {`
                            .scrollbar-hide::-webkit-scrollbar {
                                display: none;
                            }
                        `}
                    </style>
                    {users.map(user => (
                        <button
                            key={user.id}
                            onClick={() => {
                                setSelectedUser(user);
                                setNewUserCount(0);
                            }}
                            className={`w-full text-left p-2 rounded-lg transition-colors duration-200 relative ${
                                selectedUser?.id === user.id
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'hover:bg-gray-100'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                {renderUserAvatar(user)}
                                <div className="flex flex-col">
                                    <span className="font-medium">{user.name}</span>
                                    <span className="text-xs text-gray-500">{user.email}</span>
                                </div>
                                {unreadMessages[user.id] > 0 && (
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                                        {unreadMessages[user.id]}
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b">
                            <div className="flex items-center gap-2">
                                {renderUserAvatar(selectedUser)}
                                <div className="flex flex-col">
                                    <span className="font-semibold">{selectedUser.name}</span>
                                    <span className="text-xs text-gray-500">{selectedUser.email}</span>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div
                            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
                            style={{
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                            }}
                        >
                            {messages.map((msg) => (
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
                                        {renderUserAvatar(msg.sender)}
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
                            <form onSubmit={handleSendMessage} className="space-y-2">
                                <div className="flex gap-2">
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
                                </div>
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
