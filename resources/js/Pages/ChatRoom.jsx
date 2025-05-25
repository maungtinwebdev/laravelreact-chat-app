import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { Badge } from "@/Components/ui/badge";
import { useToast } from "@/Components/ui/use-toast";
import { Search, Send, MoreVertical, Phone, Video, Info, User } from 'lucide-react';
import axios from 'axios';

export default function ChatRoom({ auth, messages = [], users = [] }) {
    const [newMessage, setNewMessage] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [conversationMessages, setConversationMessages] = useState([]);
    const messagesEndRef = useRef(null);
    const { toast } = useToast();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversationMessages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedUser) return;

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({
                    receiver_id: selectedUser.id,
                    content: newMessage,
                }),
            });

            if (!response.ok) throw new Error('Failed to send message');

            const data = await response.json();
            setConversationMessages(prev => [...prev, data]);
            setNewMessage('');
            toast({
                title: "Message sent",
                description: "Your message has been sent successfully.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send message. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleUserSelect = async (user) => {
        setSelectedUser(user);
        try {
            const response = await fetch(`/api/messages/${user.id}`);
            if (!response.ok) throw new Error('Failed to fetch messages');
            const data = await response.json();
            setConversationMessages(data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load messages. Please try again.",
                variant: "destructive",
            });
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Chat Room</h2>}
        >
            <Head title="Chat Room" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="flex h-[600px] border rounded-lg">
                                {/* Users List */}
                                <div className="w-1/4 border-r p-4">
                                    <h3 className="font-semibold mb-4">Conversations</h3>
                                    <ScrollArea className="h-[calc(100%-2rem)]">
                                        {users.map((user) => (
                                            <div
                                                key={user.id}
                                                onClick={() => handleUserSelect(user)}
                                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 ${
                                                    selectedUser?.id === user.id ? 'bg-gray-100' : ''
                                                }`}
                                            >
                                                <Avatar>
                                                    <AvatarImage src={user.profile_photo_url} />
                                                    <AvatarFallback>
                                                        <User className="h-4 w-4" />
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{user.name}</p>
                                                    {user.unread_count > 0 && (
                                                        <Badge variant="secondary" className="mt-1">
                                                            {user.unread_count} new
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </ScrollArea>
                                </div>

                                {/* Chat Area */}
                                <div className="flex-1 flex flex-col">
                                    {selectedUser ? (
                                        <>
                                            {/* Chat Header */}
                                            <div className="p-4 border-b">
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={selectedUser.profile_photo_url} />
                                                        <AvatarFallback>
                                                            <User className="h-4 w-4" />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h3 className="font-semibold">{selectedUser.name}</h3>
                                                        <p className="text-sm text-gray-500">Online</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Messages */}
                                            <ScrollArea className="flex-1 p-4">
                                                {conversationMessages.map((message) => (
                                                    <div
                                                        key={message.id}
                                                        className={`flex mb-4 ${
                                                            message.sender_id === auth.user.id
                                                                ? 'justify-end'
                                                                : 'justify-start'
                                                        }`}
                                                    >
                                                        <div
                                                            className={`max-w-[70%] rounded-lg p-3 ${
                                                                message.sender_id === auth.user.id
                                                                    ? 'bg-primary text-primary-foreground'
                                                                    : 'bg-muted'
                                                            }`}
                                                        >
                                                            <p>{message.content}</p>
                                                            <p className="text-xs mt-1 opacity-70">
                                                                {new Date(message.created_at).toLocaleTimeString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div ref={messagesEndRef} />
                                            </ScrollArea>

                                            {/* Message Input */}
                                            <div className="p-4 border-t">
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={newMessage}
                                                        onChange={(e) => setNewMessage(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                                        placeholder="Type a message..."
                                                        className="flex-1"
                                                    />
                                                    <Button onClick={handleSendMessage}>
                                                        <Send className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
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
            </div>
        </AuthenticatedLayout>
    );
}
