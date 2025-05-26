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
        const diffInMinutes = (now - lastSeen) / (1000 * 60);
        return diffInMinutes < 5;
    };

    const formatLastSeen = (lastSeenAt) => {
        if (!lastSeenAt) return 'Offline';
        const lastSeen = new Date(lastSeenAt);
        const now = new Date();
        const diffInMinutes = (now - lastSeen) / (1000 * 60);

        if (diffInMinutes < 1) return 'Active now';
        if (diffInMinutes < 2) return 'Active 1 minute ago';
        if (diffInMinutes < 60) return `Active ${Math.floor(diffInMinutes)} minutes ago`;
        if (diffInMinutes < 120) return 'Active 1 hour ago';
        if (diffInMinutes < 1440) return `Active ${Math.floor(diffInMinutes / 60)} hours ago`;
        if (diffInMinutes < 2880) return 'Active yesterday';
        return `Active on ${lastSeen.toLocaleDateString()}`;
    };

    const renderMessageStatus = (message) => {
        if (message.sender_id !== auth.user.id) return null;

        let statusIcon;
        switch (message.status) {
            case 'sent':
                statusIcon = <Check className="w-3 h-3" />;
                break;
            case 'delivered':
                statusIcon = <CheckCheck className="w-3 h-3" />;
                break;
            case 'seen':
                statusIcon = <CheckCheck className="w-3 h-3 text-blue-500" />;
                break;
            default:
                statusIcon = <Check className="w-3 h-3" />;
        }

        return (
            <div className="flex items-center gap-1 ml-2">
                {statusIcon}
                <span className="text-xs text-gray-500">
                    {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
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
                                        {conversations.map((conv) => (
                                            <div
                                                key={conv.id}
                                                className={`flex items-center p-3 rounded-lg cursor-pointer mb-2 hover:bg-gray-100 ${
                                                    selectedUser?.id === conv.other_user.id ? 'bg-gray-100' : ''
                                                }`}
                                                onClick={() => setSelectedUser(conv.other_user)}
                                            >
                                                <Avatar className="h-10 w-10 mr-3">
                                                    <AvatarFallback>
                                                        {conv.other_user.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {conv.other_user.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {conv.content}
                                                    </p>
                                                </div>
                                                {conv.unread_count > 0 && (
                                                    <Badge variant="destructive" className="ml-2">
                                                        {conv.unread_count}
                                                    </Badge>
                                                )}
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
                                                                <div className="flex items-center justify-end mt-1">
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
