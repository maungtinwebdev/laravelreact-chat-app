import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { Card, CardHeader, CardContent } from "@/Components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { Badge } from "@/Components/ui/badge";
import { MessageStatus } from "@/Components/ui/message-status";
import { useToast } from "@/Components/ui/use-toast";
import { Check, CheckCheck } from 'lucide-react';
import axios from 'axios';

export default function Chat({ auth }) {
    const [messages, setMessages] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const { toast } = useToast();
    const [userStatuses, setUserStatuses] = useState({});

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        loadConversations();
        loadUsers();
        const interval = setInterval(loadConversations, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedUser) {
            loadMessages(selectedUser.id);
            const interval = setInterval(() => loadMessages(selectedUser.id), 3000);
            return () => clearInterval(interval);
        }
    }, [selectedUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const interval = setInterval(() => {
            setUserStatuses(prev => {
                const newStatuses = { ...prev };
                users.forEach(user => {
                    newStatuses[user.id] = {
                        isOnline: isUserOnline(user),
                        lastSeen: formatLastSeen(user.last_seen_at)
                    };
                });
                return newStatuses;
            });
        }, 30000);

        return () => clearInterval(interval);
    }, [users]);

    const loadConversations = async () => {
        try {
            const response = await axios.get('/api/chats');
            setConversations(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading conversations:', error);
            toast({
                title: "Error",
                description: "Failed to load conversations",
                variant: "destructive",
            });
        }
    };

    const loadUsers = async () => {
        try {
            const response = await axios.get('/api/chats/users');
            setUsers(response.data);
            const statuses = {};
            response.data.forEach(user => {
                statuses[user.id] = {
                    isOnline: isUserOnline(user),
                    lastSeen: formatLastSeen(user.last_seen_at)
                };
            });
            setUserStatuses(statuses);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const loadMessages = async (userId) => {
        try {
            const response = await axios.get(`/api/chats/${userId}`);
            setMessages(response.data);

            // Mark messages as delivered when they are loaded
            response.data.forEach(message => {
                if (message.sender_id !== auth.user.id && message.status === 'sent') {
                    markMessageAsDelivered(message.id);
                }
            });
        } catch (error) {
            console.error('Error loading messages:', error);
            toast({
                title: "Error",
                description: "Failed to load messages",
                variant: "destructive",
            });
        }
    };

    const markMessageAsDelivered = async (messageId) => {
        try {
            await axios.post(`/api/chats/messages/${messageId}/delivered`);
        } catch (error) {
            console.error('Error marking message as delivered:', error);
        }
    };

    const markMessageAsSeen = async (messageId) => {
        try {
            await axios.post(`/api/chats/messages/${messageId}/seen`);
        } catch (error) {
            console.error('Error marking message as seen:', error);
        }
    };

    // Update message status when messages are viewed
    useEffect(() => {
        if (messages.length > 0 && selectedUser) {
            const unreadMessages = messages.filter(
                message => message.sender_id !== auth.user.id && message.status !== 'seen'
            );

            unreadMessages.forEach(message => {
                markMessageAsSeen(message.id);
            });
        }
    }, [messages, selectedUser]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        try {
            const response = await axios.post('/api/chats', {
                receiver_id: selectedUser.id,
                content: newMessage
            });

            setMessages(prev => [...prev, response.data]);
            setNewMessage('');
            loadConversations();
        } catch (error) {
            console.error('Error sending message:', error);
            toast({
                title: "Error",
                description: "Failed to send message",
                variant: "destructive",
            });
        }
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    };

    const isUserOnline = (user) => {
        if (!user.last_seen_at) return false;
        const lastSeen = new Date(user.last_seen_at);
        const now = new Date();
        const diffInSeconds = (now - lastSeen) / 1000;
        return diffInSeconds < 30; // Consider user online if last seen within 30 seconds
    };

    const formatLastSeen = (lastSeenAt) => {
        if (!lastSeenAt) return 'Offline';
        const lastSeen = new Date(lastSeenAt);
        const now = new Date();
        const diffInSeconds = (now - lastSeen) / 1000;

        if (diffInSeconds < 30) return 'Active now';
        if (diffInSeconds < 60) return 'Active 1 minute ago';
        if (diffInSeconds < 3600) return `Active ${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 7200) return 'Active 1 hour ago';
        if (diffInSeconds < 86400) return `Active ${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 172800) return 'Active yesterday';
        return `Active on ${lastSeen.toLocaleDateString()}`;
    };

    const renderMessageStatus = (message) => {
        if (message.sender_id !== auth.user.id) return null;

        let statusText;
        switch (message.status) {
            case 'sent':
                statusText = 'ပို့ပြီး';
                break;
            case 'delivered':
                statusText = 'ရောက်ရှိပြီး';
                break;
            case 'seen':
                statusText = 'ဖတ်ပြီး';
                break;
            default:
                statusText = 'ပို့ပြီး';
        }

        return (
            <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-gray-500">
                    {statusText}
                </span>
            </div>
        );
    };

    const renderUserStatus = (user) => {
        const status = userStatuses[user.id];
        if (!status) return null;

        return (
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-xs text-gray-500">
                    {status.isOnline ? 'Online' : status.lastSeen}
                </span>
            </div>
        );
    };

    const handleUserSelect = (user) => {
        setSelectedUser(user);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Chat</h2>}
        >
            <Head title="Chat" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="flex h-[600px]">
                            {/* Users List */}
                            <div className="w-1/4 border-r">
                                <ScrollArea className="h-full">
                                    <div className="p-4">
                                        <h3 className="font-semibold mb-4">Conversations</h3>
                                        {users.map((user) => (
                                            <div
                                                key={user.id}
                                                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                                                    selectedUser?.id === user.id ? 'bg-gray-100' : ''
                                                }`}
                                                onClick={() => handleUserSelect(user)}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className="relative">
                                                        {user.profile_photo ? (
                                                            <img
                                                                src={user.profile_photo}
                                                                alt={user.name}
                                                                className="w-12 h-12 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                                                <span className="text-gray-500 text-lg">
                                                                    {user.name.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {isUserOnline(user) && (
                                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center">
                                                            <h3 className="font-medium">{user.name}</h3>
                                                            <span className="text-sm text-gray-500">
                                                                {formatLastSeen(user.last_seen_at)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 truncate">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 flex flex-col">
                                {selectedUser ? (
                                    <>
                                        {/* Chat Header */}
                                        <div className="p-4 border-b flex items-center">
                                            <Avatar className="h-10 w-10 mr-3">
                                                <AvatarFallback>
                                                    {selectedUser.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-semibold">{selectedUser.name}</h3>
                                                <p className="text-sm text-gray-500">{selectedUser.email}</p>
                                            </div>
                                        </div>

                                        {/* Messages */}
                                        <ScrollArea className="flex-1 p-4">
                                            {messages.map((message, index) => {
                                                const showDate = index === 0 ||
                                                    formatDate(message.created_at) !==
                                                    formatDate(messages[index - 1].created_at);

                                                return (
                                                    <div key={message.id}>
                                                        {showDate && (
                                                            <div className="text-center text-sm text-gray-500 my-4">
                                                                {formatDate(message.created_at)}
                                                            </div>
                                                        )}
                                                        <div className={`flex ${message.sender_id === auth.user.id ? 'justify-end' : 'justify-start'} mb-4`}>
                                                            <div className={`max-w-[70%] ${message.sender_id === auth.user.id ? 'bg-blue-500 text-white' : 'bg-gray-100'} rounded-lg p-3`}>
                                                                <p>{message.content}</p>
                                                                <div className="flex flex-col items-end mt-1">
                                                                    <p className={`text-xs ${message.sender_id === auth.user.id ? 'text-blue-100' : 'text-gray-500'}`}>
                                                                        {formatTime(message.created_at)}
                                                                    </p>
                                                                    {renderMessageStatus(message)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div ref={messagesEndRef} />
                                        </ScrollArea>

                                        {/* Message Input */}
                                        <form onSubmit={sendMessage} className="p-4 border-t">
                                            <div className="flex gap-2">
                                                <Input
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    placeholder="Type a message..."
                                                    className="flex-1"
                                                />
                                                <Button type="submit" disabled={!newMessage.trim()}>
                                                    Send
                                                </Button>
                                            </div>
                                        </form>
                                    </>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-gray-500">
                                        Select a conversation to start chatting
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
