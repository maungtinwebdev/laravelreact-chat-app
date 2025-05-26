import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { Card, CardHeader, CardContent } from "@/Components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { Badge } from "@/Components/ui/badge";
import { useToast } from "@/Components/ui/use-toast";
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
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const loadMessages = async (userId) => {
        try {
            const response = await axios.get(`/api/chats/${userId}`);
            setMessages(response.data);
        } catch (error) {
            console.error('Error loading messages:', error);
            toast({
                title: "Error",
                description: "Failed to load messages",
                variant: "destructive",
            });
        }
    };

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
                                                                <p className={`text-xs mt-1 ${message.sender_id === auth.user.id ? 'text-blue-100' : 'text-gray-500'}`}>
                                                                    {formatTime(message.created_at)}
                                                                </p>
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
