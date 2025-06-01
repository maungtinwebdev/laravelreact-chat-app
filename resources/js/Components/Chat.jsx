import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import EmojiPicker from 'emoji-picker-react';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { useToast } from "@/Components/ui/use-toast";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Chat({ auth }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messagesEndRef = useRef(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchUsers();
        if (selectedUser) {
            fetchMessages();
            subscribeToMessages();
        }
        return () => {
            // Cleanup subscription
            if (selectedUser) {
                supabase.removeAllSubscriptions();
            }
        };
    }, [selectedUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchUsers = async () => {
        try {
            const { data: users, error } = await supabase
                .from('users')
                .select('id, name')
                .neq('id', auth.user.id);

            if (error) throw error;
            setUsers(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast({
                title: "Error",
                description: "Failed to fetch users",
                variant: "destructive",
            });
        }
    };

    const fetchMessages = async () => {
        if (!selectedUser) return;
        try {
            const { data: messages, error } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${auth.user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${auth.user.id})`)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(messages);
            markMessagesAsRead();
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast({
                title: "Error",
                description: "Failed to fetch messages",
                variant: "destructive",
            });
        }
    };

    const subscribeToMessages = () => {
        const subscription = supabase
            .channel('messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `or(and(sender_id.eq.${auth.user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${auth.user.id}))`
            }, (payload) => {
                setMessages(prev => [...prev, payload.new]);
                if (payload.new.sender_id === selectedUser.id) {
                    markMessagesAsRead();
                }
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    };

    const markMessagesAsRead = async () => {
        if (!selectedUser) return;
        try {
            const { error } = await supabase
                .from('messages')
                .update({ is_read: true })
                .match({ 
                    sender_id: selectedUser.id,
                    receiver_id: auth.user.id,
                    is_read: false
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        try {
            const { error } = await supabase
                .from('messages')
                .insert({
                    sender_id: auth.user.id,
                    receiver_id: selectedUser.id,
                    content: newMessage,
                    is_read: false
                });

            if (error) throw error;
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            toast({
                title: "Error",
                description: "Failed to send message",
                variant: "destructive",
            });
        }
    };

    const onEmojiClick = (emojiObject) => {
        setNewMessage(prev => prev + emojiObject.emoji);
        setShowEmojiPicker(false);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="flex h-[600px] bg-white rounded-lg shadow">
            {/* Users List */}
            <div className="w-1/4 border-r p-4 overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4">Users</h2>
                <div className="space-y-2">
                    {users.map(user => (
                        <div
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${
                                selectedUser?.id === user.id ? 'bg-gray-100' : ''
                            }`}
                        >
                            {user.name}
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b">
                            <h2 className="text-lg font-semibold">{selectedUser.name}</h2>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-4 overflow-y-auto">
                            {messages.map(message => (
                                <div
                                    key={message.id}
                                    className={`mb-4 ${
                                        message.sender_id === auth.user.id
                                            ? 'text-right'
                                            : 'text-left'
                                    }`}
                                >
                                    <div
                                        className={`inline-block p-3 rounded-lg ${
                                            message.sender_id === auth.user.id
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200'
                                        }`}
                                    >
                                        {message.content}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {new Date(message.created_at).toLocaleTimeString()}
                                        {message.sender_id === auth.user.id && (
                                            <span className="ml-2">
                                                {message.is_read ? '✓✓' : '✓'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t">
                            <form onSubmit={sendMessage} className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        😊
                                    </button>
                                    {showEmojiPicker && (
                                        <div className="absolute bottom-full right-0 mb-2">
                                            <EmojiPicker onEmojiClick={onEmojiClick} />
                                        </div>
                                    )}
                                </div>
                                <Button type="submit">Send</Button>
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