import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { useToast } from "@/Components/ui/use-toast";
import axios from 'axios';

export default function Day({ auth }) {
    const [days, setDays] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadDays();
        const interval = setInterval(loadDays, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    const loadDays = async () => {
        try {
            const response = await axios.get('/days');
            setDays(response.data);
        } catch (error) {
            console.error('Error loading days:', error);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('media', selectedFile);
        formData.append('caption', caption);

        try {
            await axios.post('/days', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast({
                title: "Success",
                description: "Your day has been posted!",
            });
            setIsOpen(false);
            setSelectedFile(null);
            setCaption('');
            loadDays();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to post your day",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (dayId) => {
        try {
            await axios.delete(`/days/${dayId}`);
            toast({
                title: "Success",
                description: "Day deleted successfully",
            });
            loadDays();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete day",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">My Day</h2>
                <Button onClick={() => setIsOpen(true)}>Add to My Day</Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {days.map((day) => (
                    <div key={day.id} className="relative group">
                        {day.media_type === 'image' ? (
                            <img
                                src={day.media_url}
                                alt={day.caption}
                                className="w-full h-48 object-cover rounded-lg"
                            />
                        ) : (
                            <video
                                src={day.media_url}
                                className="w-full h-48 object-cover rounded-lg"
                                controls
                            />
                        )}
                        {day.caption && (
                            <p className="mt-2 text-sm text-gray-600">{day.caption}</p>
                        )}
                        {day.user_id === auth.user.id && (
                            <button
                                onClick={() => handleDelete(day.id)}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                ×
                            </button>
                        )}
                        <div className="mt-1 text-xs text-gray-500">
                            Posted by {day.user.name}
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add to My Day</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Input
                                type="file"
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <Input
                                type="text"
                                placeholder="Add a caption..."
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Button type="submit" disabled={!selectedFile || loading}>
                            {loading ? 'Posting...' : 'Post to My Day'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
} 