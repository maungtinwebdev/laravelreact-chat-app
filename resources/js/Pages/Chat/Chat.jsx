import { useState } from 'react';

export default function Chat() {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        {
            id: 1,
            content: 'Hello! How can I help you today?',
            sender: 'support',
            timestamp: '10:00 AM',
            avatar: 'https://ui-avatars.com/api/?name=Support&background=0D8ABC&color=fff'
        },
        {
            id: 2,
            content: 'I have a question about my account.',
            sender: 'user',
            timestamp: '10:01 AM',
            avatar: 'https://ui-avatars.com/api/?name=User&background=7C3AED&color=fff'
        }
    ]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
            const newMessage = {
                id: messages.length + 1,
                content: message,
                sender: 'user',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                avatar: 'https://ui-avatars.com/api/?name=User&background=7C3AED&color=fff'
            };
            setMessages([...messages, newMessage]);
            setMessage('');
        }
    };

    return (
        <div className="flex flex-col h-[600px]">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${
                            msg.sender === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        <div
                            className={`flex max-w-[70%] ${
                                msg.sender === 'user'
                                    ? 'flex-row-reverse'
                                    : 'flex-row'
                            } items-end gap-2`}
                        >
                            <img
                                src={msg.avatar}
                                alt="avatar"
                                className="w-8 h-8 rounded-full"
                            />
                            <div
                                className={`rounded-lg px-4 py-2 ${
                                    msg.sender === 'user'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                                <p>{msg.content}</p>
                                <span
                                    className={`text-xs ${
                                        msg.sender === 'user'
                                            ? 'text-indigo-200'
                                            : 'text-gray-500'
                                    }`}
                                >
                                    {msg.timestamp}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
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
        </div>
    );
}
