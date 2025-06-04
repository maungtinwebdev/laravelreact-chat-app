import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { useToast } from "@/Components/ui/use-toast";
import axios from 'axios';

export default function Inventory({ auth, inventory: initialInventory }) {
    const { toast } = useToast();
    const [items, setItems] = useState(initialInventory || []);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        quantity: '',
        price: '',
        description: '',
        minimum_stock: ''
    });

    const categories = ['Clothes', 'Books', 'Drugs', 'Electronics', 'Other'];

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await router.get('/api/inventory', {}, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: (page) => {
                    setItems(page.props.inventory);
                },
                onError: (errors) => {
                    toast({
                        title: "Error",
                        description: "Failed to load inventory items",
                        variant: "destructive",
                    });
                }
            });
        } catch (error) {
            console.error('Error fetching items:', error);
            toast({
                title: "Error",
                description: "Failed to load inventory items",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (showEditModal) {
                await router.put(`/api/inventory/${selectedItem.id}`, formData, {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        toast({
                            title: "Success",
                            description: "Item updated successfully",
                        });
                        setShowEditModal(false);
                        fetchItems();
                    },
                    onError: (errors) => {
                        toast({
                            title: "Error",
                            description: "Failed to update item",
                            variant: "destructive",
                        });
                    }
                });
            } else {
                await router.post('/api/inventory', formData, {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        toast({
                            title: "Success",
                            description: "Item added successfully",
                        });
                        setShowAddModal(false);
                        fetchItems();
                    },
                    onError: (errors) => {
                        toast({
                            title: "Error",
                            description: "Failed to add item",
                            variant: "destructive",
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error saving item:', error);
            toast({
                title: "Error",
                description: "Failed to save item",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await router.delete(`/api/inventory/${id}`, {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        toast({
                            title: "Success",
                            description: "Item deleted successfully",
                        });
                        fetchItems();
                    },
                    onError: (errors) => {
                        toast({
                            title: "Error",
                            description: "Failed to delete item",
                            variant: "destructive",
                        });
                    }
                });
            } catch (error) {
                console.error('Error deleting item:', error);
                toast({
                    title: "Error",
                    description: "Failed to delete item",
                    variant: "destructive",
                });
            }
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl text-center py-5 bg-green-500 font-semibold leading-tight text-gray-800">
                    Inventory Management
                </h2>
            }
        >
            <Head title="Inventory Management" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-semibold">Inventory Items</h2>
                                <button
                                    onClick={() => {
                                        setShowAddModal(true);
                                        setFormData({
                                            name: '',
                                            category: '',
                                            quantity: '',
                                            price: '',
                                            description: '',
                                            minimum_stock: ''
                                        });
                                    }}
                                    className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Add New Item
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-center py-4">Loading...</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {items.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{item.category}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">${item.price}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedItem(item);
                                                                setFormData(item);
                                                                setShowEditModal(true);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                                        >
                                                            <Edit className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {(showAddModal || showEditModal) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-lg font-medium mb-4">
                            {showEditModal ? 'Edit Item' : 'Add New Item'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map((category) => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                    <input
                                        type="number"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Minimum Stock</label>
                                    <input
                                        type="number"
                                        value={formData.minimum_stock}
                                        onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        rows="3"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setShowEditModal(false);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                >
                                    {showEditModal ? 'Update' : 'Add'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
