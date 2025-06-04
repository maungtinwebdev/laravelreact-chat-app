import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, Filter } from 'lucide-react';
import { useToast } from "@/Components/ui/use-toast";

export default function Inventory({ auth, inventory: initialInventory, categories: initialCategories }) {
    const { toast } = useToast();
    const [items, setItems] = useState(initialInventory || []);
    const [categories, setCategories] = useState(initialCategories || []);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        category_id: '',
        quantity: '',
        price: '',
        description: '',
        minimum_stock: ''
    });
    const [categoryFormData, setCategoryFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await router.get('/api/inventory-categories', {}, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: (page) => {
                    setCategories(page.props.categories || []);
                },
                onError: (errors) => {
                    toast({
                        title: "Error",
                        description: "Failed to load categories",
                        variant: "destructive",
                    });
                }
            });
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast({
                title: "Error",
                description: "Failed to load categories",
                variant: "destructive",
            });
        }
    };

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await router.get('/api/inventory', {
                category_id: selectedCategoryFilter
            }, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: (page) => {
                    setItems(page.props.inventory || []);
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

    useEffect(() => {
        fetchItems();
    }, [selectedCategoryFilter]);

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

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedCategory) {
                await router.put(`/api/inventory-categories/${selectedCategory.id}`, categoryFormData, {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        toast({
                            title: "Success",
                            description: "Category updated successfully",
                        });
                        setShowCategoryModal(false);
                        fetchCategories();
                    },
                    onError: (errors) => {
                        toast({
                            title: "Error",
                            description: "Failed to update category",
                            variant: "destructive",
                        });
                    }
                });
            } else {
                await router.post('/api/inventory-categories', categoryFormData, {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        toast({
                            title: "Success",
                            description: "Category added successfully",
                        });
                        setShowCategoryModal(false);
                        fetchCategories();
                    },
                    onError: (errors) => {
                        toast({
                            title: "Error",
                            description: "Failed to add category",
                            variant: "destructive",
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error saving category:', error);
            toast({
                title: "Error",
                description: "Failed to save category",
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

    const handleDeleteCategory = async (id) => {
        if (window.confirm('Are you sure you want to delete this category? This will also delete all items in this category.')) {
            try {
                await router.delete(`/api/inventory-categories/${id}`, {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        toast({
                            title: "Success",
                            description: "Category deleted successfully",
                        });
                        fetchCategories();
                        fetchItems();
                    },
                    onError: (errors) => {
                        toast({
                            title: "Error",
                            description: "Failed to delete category",
                            variant: "destructive",
                        });
                    }
                });
            } catch (error) {
                console.error('Error deleting category:', error);
                toast({
                    title: "Error",
                    description: "Failed to delete category",
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
                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => {
                                            setShowCategoryModal(true);
                                            setSelectedCategory(null);
                                            setCategoryFormData({ name: '', description: '' });
                                        }}
                                        className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        Manage Categories
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowAddModal(true);
                                            setFormData({
                                                name: '',
                                                category_id: '',
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
                            </div>

                            <div className="mb-6">
                                <div className="flex items-center space-x-4">
                                    <Filter className="w-5 h-5 text-gray-500" />
                                    <select
                                        value={selectedCategoryFilter}
                                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
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
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {categories.find(c => c.id === item.category_id)?.name}
                                                    </td>
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

            {/* Add/Edit Item Modal */}
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
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
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

            {/* Category Management Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-lg font-medium mb-4">
                            {selectedCategory ? 'Edit Category' : 'Add New Category'}
                        </h3>
                        <form onSubmit={handleCategorySubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        value={categoryFormData.name}
                                        onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={categoryFormData.description}
                                        onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        rows="3"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCategoryModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                >
                                    {selectedCategory ? 'Update' : 'Add'}
                                </button>
                            </div>
                        </form>

                        <div className="mt-8">
                            <h4 className="text-lg font-medium mb-4">Existing Categories</h4>
                            <div className="space-y-2">
                                {categories.map((category) => (
                                    <div key={category.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                        <div>
                                            <p className="font-medium">{category.name}</p>
                                            {category.description && (
                                                <p className="text-sm text-gray-500">{category.description}</p>
                                            )}
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedCategory(category);
                                                    setCategoryFormData({
                                                        name: category.name,
                                                        description: category.description
                                                    });
                                                }}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(category.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
