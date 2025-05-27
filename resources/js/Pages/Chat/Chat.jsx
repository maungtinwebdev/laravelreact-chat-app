import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { Image, Send, Paperclip, X, Loader2, Menu, ChevronLeft, Users, Search, MoreVertical } from 'lucide-react';

export default function Chat({ users: initialUsers, auth }) {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState(initialUsers || []);
    const [selectedUser, setSelectedUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [newUserCount, setNewUserCount] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState({});
    const [lastMessageIds, setLastMessageIds] = useState({});
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const messagesEndRef = useRef(null);
    const channelRef = useRef(null);
    const usersListRef = useRef(null);
    const imageInputRef = useRef(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter users based on search
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Toggle user list
    const toggleUserList = () => {
        if (window.innerWidth < 768) {
            setIsMobileMenuOpen(!isMobileMenuOpen);
        }
    };

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

    const handleImageSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!message.trim() && !selectedImage) || !selectedUser) return;

        try {
            let imageUrl = null;
            let imagePath = null;

            // Upload image if selected
            if (selectedImage) {
                setUploadingImage(true);
                setUploadProgress(0);

                // Create a unique file name
                const fileExt = selectedImage.name.split('.').pop();
                const fileName = `${auth.user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `chat-images/${fileName}`;

                // Upload to Supabase Storage
                const { data, error } = await supabase.storage
                    .from('chat-images')
                    .upload(filePath, selectedImage, {
                        cacheControl: '3600',
                        upsert: true,
                        contentType: selectedImage.type
                    });

                if (error) {
                    throw new Error(error.message || 'Failed to upload image');
                }

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('chat-images')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
                imagePath = filePath;
            }

            // Create message object
            const messageData = {
                content: message.trim(),
                sender_id: auth.user.id,
                receiver_id: selectedUser.id,
                created_at: new Date().toISOString(),
                image_url: imageUrl,
                image_path: imagePath
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

            // Reset states
            setMessage('');
            setSelectedImage(null);
            setImagePreview(null);
            setUploadProgress(0);

        } catch (error) {
            console.error('Error sending message:', error);
            alert(error.message || 'Failed to send message');
        } finally {
            setUploadingImage(false);
        }
    };

    const cancelImageUpload = () => {
        setSelectedImage(null);
        setImagePreview(null);
        setUploadProgress(0);
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
        <div className="flex h-[600px] md:h-[calc(100vh-4rem)] relative bg-gray-50">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden fixed top-4 left-4 z-20 p-2 text-gray-600 hover:text-indigo-600 bg-green-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Users List - Mobile Responsive */}
            <div className={`
                fixed md:relative w-[90%] md:w-1/4 h-full bg-white
                transform transition-transform duration-300 ease-in-out z-10
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                shadow-xl md:shadow-none border-r border-gray-200 top-[50px]
            `}>
                {/* User List Header */}
                <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Users className="w-6 h-6 text-indigo-600" />
                            Messages
                        </h2>
                        <button className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                        />
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                </div>

                {/* Users List */}
                <div
                    ref={usersListRef}
                    className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide"
                >
                    {filteredUsers.map(user => (
                        <button
                            key={user.id}
                            onClick={() => {
                                setSelectedUser(user);
                                setNewUserCount(0);
                                setIsMobileMenuOpen(false);
                            }}
                            className={`w-full text-left p-3 rounded-xl transition-all duration-200 relative
                                ${selectedUser?.id === user.id
                                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                    : 'hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    {renderUserAvatar(user)}
                                    {onlineUsers.has(user.id) && (
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold truncate">{user.name}</span>
                                        <span className="text-xs text-gray-500">
                                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                </div>
                                {unreadMessages[user.id] > 0 && (
                                    <span className="bg-indigo-600 text-white text-xs font-medium px-2 py-1 rounded-full min-w-[20px] text-center">
                                        {unreadMessages[user.id]}
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Overlay for mobile menu */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-0 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Chat Area - Mobile Responsive */}
            <div className="flex-1 flex flex-col w-full bg-white">
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    {renderUserAvatar(selectedUser)}
                                    {onlineUsers.has(selectedUser.id) && (
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-800">{selectedUser.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        {onlineUsers.has(selectedUser.id) ? 'Online' : 'Offline'}
                                    </p>
                                </div>
                                <button className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div
                            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-gray-50"
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
                                        className={`flex max-w-[85%] md:max-w-[70%] ${
                                            msg.sender_id === auth.user.id
                                                ? 'flex-row-reverse'
                                                : 'flex-row'
                                        } items-end gap-2`}
                                    >
                                        {renderUserAvatar(msg.sender)}
                                        <div
                                            className={`rounded-2xl px-4 py-2 ${
                                                msg.sender_id === auth.user.id
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-white text-gray-800 shadow-sm'
                                            }`}
                                        >
                                            {msg.image_url && (
                                                <div className="mb-2">
                                                    <img
                                                        src={msg.image_url}
                                                        alt="Shared image"
                                                        className="max-w-full rounded-lg"
                                                        style={{ maxHeight: '300px' }}
                                                    />
                                                </div>
                                            )}
                                            {msg.content && <p className="break-words">{msg.content}</p>}
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
                        <div className="border-t border-gray-200 p-4 bg-white">
                            {imagePreview && (
                                <div className="mb-4 relative">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="max-h-32 rounded-lg"
                                    />
                                    <button
                                        onClick={cancelImageUpload}
                                        className="absolute top-2 right-2 bg-gray-800 bg-opacity-50 rounded-full p-1 hover:bg-opacity-70 transition-all duration-200"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            )}
                            <form onSubmit={handleSendMessage} className="space-y-2">
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        ref={imageInputRef}
                                        onChange={handleImageSelect}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => imageInputRef.current?.click()}
                                        className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 transition-all duration-200"
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="flex-1 rounded-full border border-gray-200 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                                    />
                                    <button
                                        type="submit"
                                        disabled={uploadingImage || (!message.trim() && !selectedImage)}
                                        className="rounded-full bg-indigo-600 p-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                    >
                                        {uploadingImage ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span className="hidden md:inline">Uploading...</span>
                                            </div>
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                {uploadProgress > 0 && (
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div
                                            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                )}
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Chat Selected</h3>
                            <p className="text-gray-500">Choose a user to start chatting</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
