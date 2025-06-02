import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Minus, DollarSign, Calendar, Filter, Search, BarChart2, PieChart, Download, Upload, Trash2, Edit2, MoreVertical, Menu, Tag } from 'lucide-react';
import { DateTime } from 'luxon';
import { v4 as uuidv4 } from 'uuid';

export default function ExpenseTracker({ auth }) {
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [dateRange, setDateRange] = useState({
        start: DateTime.now().startOf('month').toISODate(),
        end: DateTime.now().endOf('month').toISODate()
    });
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        category: '',
        date: DateTime.now().toISODate(),
        type: 'expense'
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('list');
    const [summary, setSummary] = useState({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0
    });
    const [showSidebar, setShowSidebar] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategory, setNewCategory] = useState({
        name: '',
        description: ''
    });

    // Fetch expenses and categories
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch categories
                const { data: categoriesData, error: categoriesError } = await supabase
                    .from('expense_categories')
                    .select('*')
                    .order('name');

                if (categoriesError) throw categoriesError;
                setCategories(categoriesData || []);

                // Fetch expenses
                const { data: expensesData, error: expensesError } = await supabase
                    .from('expenses')
                    .select('*')
                    .eq('user_id', auth.user.id)
                    .gte('date', dateRange.start)
                    .lte('date', dateRange.end)
                    .order('date', { ascending: false });

                if (expensesError) throw expensesError;
                setExpenses(expensesData || []);

                // Calculate summary
                const summary = expensesData?.reduce((acc, expense) => {
                    if (expense.type === 'income') {
                        acc.totalIncome += parseFloat(expense.amount);
                    } else {
                        acc.totalExpense += parseFloat(expense.amount);
                    }
                    return acc;
                }, { totalIncome: 0, totalExpense: 0 });

                summary.balance = summary.totalIncome - summary.totalExpense;
                setSummary(summary);

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        // Set up real-time subscription
        const subscription = supabase
            .channel('expenses_changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'expenses',
                    filter: `user_id=eq.${auth.user.id}`
                },
                async (payload) => {
                    // Refresh data when changes occur
                    const { data: expensesData, error: expensesError } = await supabase
                        .from('expenses')
                        .select('*')
                        .eq('user_id', auth.user.id)
                        .gte('date', dateRange.start)
                        .lte('date', dateRange.end)
                        .order('date', { ascending: false });

                    if (!expensesError && expensesData) {
                        setExpenses(expensesData);

                        // Update summary
                        const newSummary = expensesData.reduce((acc, expense) => {
                            if (expense.type === 'income') {
                                acc.totalIncome += parseFloat(expense.amount);
                            } else {
                                acc.totalExpense += parseFloat(expense.amount);
                            }
                            return acc;
                        }, { totalIncome: 0, totalExpense: 0 });

                        newSummary.balance = newSummary.totalIncome - newSummary.totalExpense;
                        setSummary(newSummary);
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [auth.user.id, dateRange]);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const expenseData = {
                id: uuidv4(),
                user_id: auth.user.id,
                amount: parseFloat(formData.amount),
                description: formData.description,
                category: formData.category,
                date: formData.date,
                type: formData.type
            };

            if (showEditModal && selectedExpense) {
                const { error } = await supabase
                    .from('expenses')
                    .update(expenseData)
                    .eq('id', selectedExpense.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('expenses')
                    .insert([expenseData]);

                if (error) throw error;
            }

            // Reset form and close modal
            setFormData({
                amount: '',
                description: '',
                category: '',
                date: DateTime.now().toISODate(),
                type: 'expense'
            });
            setShowAddModal(false);
            setShowEditModal(false);
            setSelectedExpense(null);

            // Refresh data
            const { data: expensesData, error: expensesError } = await supabase
                .from('expenses')
                .select('*')
                .eq('user_id', auth.user.id)
                .gte('date', dateRange.start)
                .lte('date', dateRange.end)
                .order('date', { ascending: false });

            if (expensesError) throw expensesError;
            setExpenses(expensesData || []);

        } catch (error) {
            console.error('Error saving expense:', error);
            alert('Failed to save expense: ' + error.message);
        }
    };

    // Handle expense deletion
    const handleDelete = async () => {
        if (!selectedExpense) return;

        try {
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', selectedExpense.id);

            if (error) throw error;

            setExpenses(prev => prev.filter(expense => expense.id !== selectedExpense.id));
            setShowDeleteConfirm(false);
            setSelectedExpense(null);

        } catch (error) {
            console.error('Error deleting expense:', error);
            alert('Failed to delete expense');
        }
    };

    // Filter expenses based on search and category
    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Handle new category submission
    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('expense_categories')
                .insert([{
                    id: uuidv4(),
                    name: newCategory.name,
                    description: newCategory.description
                }]);

            if (error) throw error;

            // Refresh categories
            const { data: categoriesData, error: categoriesError } = await supabase
                .from('expense_categories')
                .select('*')
                .order('name');

            if (categoriesError) throw categoriesError;
            setCategories(categoriesData || []);

            // Reset form and close modal
            setNewCategory({
                name: '',
                description: ''
            });
            setShowCategoryModal(false);

        } catch (error) {
            console.error('Error adding category:', error);
            alert('Failed to add category: ' + error.message);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-[#f0f2f5]">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Sidebar */}
            <div className={`fixed lg:static inset-y-0 left-0 w-[280px] lg:w-[360px] bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 ease-in-out z-40 ${
                showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}>
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-[#1c1e21] mb-4">Expense Tracker</h2>
                    <div className="space-y-4">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-green-50 p-3 rounded-lg">
                                <p className="text-sm text-green-600">Income</p>
                                <p className="text-lg font-semibold text-green-700">${summary.totalIncome.toFixed(2)}</p>
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg">
                                <p className="text-sm text-red-600">Expenses</p>
                                <p className="text-lg font-semibold text-red-700">${summary.totalExpense.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm text-blue-600">Balance</p>
                            <p className="text-lg font-semibold text-blue-700">${summary.balance.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-gray-200">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    className="rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <button
                                    onClick={() => setShowCategoryModal(true)}
                                    className="text-sm text-blue-500 hover:text-blue-600 flex items-center"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Category
                                </button>
                            </div>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex-1 py-2 px-4 rounded-lg ${
                                viewMode === 'list'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <BarChart2 className="w-5 h-5 mx-auto" />
                        </button>
                        <button
                            onClick={() => setViewMode('chart')}
                            className={`flex-1 py-2 px-4 rounded-lg ${
                                viewMode === 'chart'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <PieChart className="w-5 h-5 mx-auto" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="p-4 bg-white border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search expenses..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Add Expense
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : viewMode === 'list' ? (
                        <div className="space-y-4">
                            {filteredExpenses.map(expense => (
                                <div
                                    key={expense.id}
                                    className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-2 rounded-full ${
                                                expense.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                                            }`}>
                                                {expense.type === 'income' ? (
                                                    <Plus className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <Minus className="w-5 h-5 text-red-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{expense.description}</p>
                                                <p className="text-sm text-gray-500">
                                                    {DateTime.fromISO(expense.date).toFormat('MMM d, yyyy')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <p className={`font-semibold ${
                                                expense.type === 'income' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                ${expense.amount.toFixed(2)}
                                            </p>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedExpense(expense);
                                                        setFormData({
                                                            amount: expense.amount.toString(),
                                                            description: expense.description,
                                                            category: expense.category,
                                                            date: expense.date,
                                                            type: expense.type
                                                        });
                                                        setShowEditModal(true);
                                                    }}
                                                    className="p-1 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-100"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedExpense(expense);
                                                        setShowDeleteConfirm(true);
                                                    }}
                                                    className="p-1 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <p className="text-center text-gray-500">Chart visualization coming soon...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {(showAddModal || showEditModal) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            {showEditModal ? 'Edit Expense' : 'Add Expense'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                    className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                        $
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                        className="w-full pl-8 pr-4 py-2 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter description"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">Select category</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setShowEditModal(false);
                                        setSelectedExpense(null);
                                        setFormData({
                                            amount: '',
                                            description: '',
                                            category: '',
                                            date: DateTime.now().toISODate(),
                                            type: 'expense'
                                        });
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    {showEditModal ? 'Save Changes' : 'Add Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && selectedExpense && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Expense</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this expense? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setSelectedExpense(null);
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Category</h3>
                        <form onSubmit={handleAddCategory} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter category name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={newCategory.description}
                                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter category description"
                                    rows="3"
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCategoryModal(false);
                                        setNewCategory({
                                            name: '',
                                            description: ''
                                        });
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    Add Category
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Mobile Overlay */}
            {showSidebar && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                    onClick={() => setShowSidebar(false)}
                />
            )}
        </div>
    );
}
