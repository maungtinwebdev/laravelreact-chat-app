import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Check, Trash2, Edit2, Calendar, Clock, Filter, Search, CheckCircle2, Circle, Menu, BarChart2, PieChart, Star, StarOff } from 'lucide-react';
import { DateTime } from 'luxon';
import { v4 as uuidv4 } from 'uuid';
import SimpleModal from '../Components/SimpleModal';

export default function TodoList({ auth }) {
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [selectedTodo, setSelectedTodo] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: DateTime.now().plus({ days: 1 }).toISODate(),
        priority: 'medium',
        status: 'pending',
        isStarred: false
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');

    // Add cleanup effect
    useEffect(() => {
        return () => {
            setShowAddModal(false);
            setShowEditModal(false);
            setShowDeleteConfirm(false);
            setShowSidebar(false);
            setSelectedTodo(null);
        };
    }, []);

    // Fetch todos
    useEffect(() => {
        fetchTodos();

        // Subscribe to changes
        const subscription = supabase
            .channel('todos')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, () => {
                fetchTodos();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchTodos = async () => {
        try {
            const { data, error } = await supabase
                .from('todos')
                .select('*')
                .eq('user_id', auth.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTodos(data);
        } catch (error) {
            console.error('Error fetching todos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedTodo) {
                // Update existing todo
                const { error } = await supabase
                    .from('todos')
                    .update({
                        title: formData.title,
                        description: formData.description,
                        due_date: formData.dueDate,
                        priority: formData.priority,
                        status: formData.status,
                        is_starred: formData.isStarred
                    })
                    .eq('id', selectedTodo.id);

                if (error) throw error;
            } else {
                // Create new todo
                const { error } = await supabase
                    .from('todos')
                    .insert({
                        id: uuidv4(),
                        user_id: auth.user.id,
                        title: formData.title,
                        description: formData.description,
                        due_date: formData.dueDate,
                        priority: formData.priority,
                        status: formData.status,
                        is_starred: formData.isStarred
                    });

                if (error) throw error;
            }

            setShowAddModal(false);
            setShowEditModal(false);
            setSelectedTodo(null);
            setFormData({
                title: '',
                description: '',
                dueDate: DateTime.now().plus({ days: 1 }).toISODate(),
                priority: 'medium',
                status: 'pending',
                isStarred: false
            });
        } catch (error) {
            console.error('Error saving todo:', error);
        }
    };

    const handleDelete = async () => {
        try {
            const { error } = await supabase
                .from('todos')
                .delete()
                .eq('id', selectedTodo.id);

            if (error) throw error;

            setShowDeleteConfirm(false);
            setSelectedTodo(null);
        } catch (error) {
            console.error('Error deleting todo:', error);
        }
    };

    const handleStatusToggle = async (todo) => {
        try {
            const { error } = await supabase
                .from('todos')
                .update({ status: todo.status === 'completed' ? 'pending' : 'completed' })
                .eq('id', todo.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating todo status:', error);
        }
    };

    const handleStarToggle = async (todo) => {
        try {
            const { error } = await supabase
                .from('todos')
                .update({ is_starred: !todo.is_starred })
                .eq('id', todo.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating todo star status:', error);
        }
    };

    const handleEdit = (todo) => {
        setSelectedTodo(todo);
        setFormData({
            title: todo.title,
            description: todo.description || '',
            dueDate: todo.due_date,
            priority: todo.priority,
            status: todo.status,
            isStarred: todo.is_starred
        });
        setShowEditModal(true);
    };

    const handleDeleteClick = (todo) => {
        setSelectedTodo(todo);
        setShowDeleteConfirm(true);
    };

    // Calculate statistics
    const stats = {
        total: todos.length,
        completed: todos.filter(todo => todo.status === 'completed').length,
        pending: todos.filter(todo => todo.status === 'pending').length,
        highPriority: todos.filter(todo => todo.priority === 'high').length,
        starred: todos.filter(todo => todo.is_starred).length
    };

    // Filter todos
    const filteredTodos = todos.filter(todo => {
        const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (todo.description && todo.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || todo.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || todo.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-[#f0f2f5]">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform ${showSidebar ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-in-out z-40 lg:relative lg:translate-x-0`}>
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Todo List</h2>
                    <button
                        onClick={() => {
                            setShowAddModal(true);
                            setFormData({
                                title: '',
                                description: '',
                                dueDate: DateTime.now().plus({ days: 1 }).toISODate(),
                                priority: 'medium',
                                status: 'pending',
                                isStarred: false
                            });
                        }}
                        className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Todo
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="bg-white shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setShowSidebar(true)}
                                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                            >
                                <Menu className="w-6 h-6 text-gray-600" />
                            </button>
                            <div className="flex-1 max-w-2xl mx-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search todos..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="flex items-center">
                                    <BarChart2 className="w-8 h-8 text-blue-500 mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-600">Total</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="flex items-center">
                                    <CheckCircle2 className="w-8 h-8 text-green-500 mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-600">Completed</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="flex items-center">
                                    <Circle className="w-8 h-8 text-yellow-500 mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-600">Pending</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="flex items-center">
                                    <PieChart className="w-8 h-8 text-red-500 mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-600">High Priority</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.highPriority}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="flex items-center">
                                    <Star className="w-8 h-8 text-yellow-400 mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-600">Starred</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.starred}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="bg-white rounded-lg shadow mb-6">
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex items-center space-x-4">
                                    <Filter className="w-5 h-5 text-gray-400" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                    <select
                                        value={priorityFilter}
                                        onChange={(e) => setPriorityFilter(e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="all">All Priority</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Todo List */}
                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                                </div>
                            ) : filteredTodos.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">No todos found</p>
                                </div>
                            ) : (
                                filteredTodos.map(todo => (
                                    <div
                                        key={todo.id}
                                        className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-3">
                                                <button
                                                    onClick={() => handleStatusToggle(todo)}
                                                    className={`mt-1 p-1 rounded-full ${
                                                        todo.status === 'completed'
                                                            ? 'text-green-500 hover:text-green-600'
                                                            : 'text-gray-400 hover:text-gray-500'
                                                    }`}
                                                >
                                                    {todo.status === 'completed' ? (
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    ) : (
                                                        <Circle className="w-5 h-5" />
                                                    )}
                                                </button>
                                                <div>
                                                    <h3 className={`text-lg font-medium ${
                                                        todo.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
                                                    }`}>
                                                        {todo.title}
                                                    </h3>
                                                    {todo.description && (
                                                        <p className="text-gray-600 mt-1">{todo.description}</p>
                                                    )}
                                                    <div className="flex items-center space-x-4 mt-2">
                                                        <div className="flex items-center text-sm text-gray-500">
                                                            <Calendar className="w-4 h-4 mr-1" />
                                                            {DateTime.fromISO(todo.due_date).toFormat('MMM d, yyyy')}
                                                        </div>
                                                        <div className="flex items-center text-sm text-gray-500">
                                                            <Clock className="w-4 h-4 mr-1" />
                                                            {DateTime.fromISO(todo.due_date).toFormat('h:mm a')}
                                                        </div>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            todo.priority === 'high'
                                                                ? 'bg-red-100 text-red-800'
                                                                : todo.priority === 'medium'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-green-100 text-green-800'
                                                        }`}>
                                                            {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleStarToggle(todo)}
                                                    className={`p-1 rounded-full ${
                                                        todo.is_starred
                                                            ? 'text-yellow-400 hover:text-yellow-500'
                                                            : 'text-gray-400 hover:text-gray-500'
                                                    }`}
                                                >
                                                    {todo.is_starred ? (
                                                        <Star className="w-5 h-5" />
                                                    ) : (
                                                        <StarOff className="w-5 h-5" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(todo)}
                                                    className="p-1 text-gray-400 hover:text-gray-500 rounded-full"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(todo)}
                                                    className="p-1 text-gray-400 hover:text-red-500 rounded-full"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <SimpleModal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Todo</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows="3"
                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                            Due Date
                        </label>
                        <input
                            type="date"
                            id="dueDate"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                            Priority
                        </label>
                        <select
                            id="priority"
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => {
                                setShowAddModal(false);
                                setFormData({
                                    title: '',
                                    description: '',
                                    dueDate: DateTime.now().plus({ days: 1 }).toISODate(),
                                    priority: 'medium',
                                    status: 'pending',
                                    isStarred: false
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
                            Add Todo
                        </button>
                    </div>
                </form>
            </SimpleModal>

            <SimpleModal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Todo</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700">
                            Title
                        </label>
                        <input
                            type="text"
                            id="edit-title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            id="edit-description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows="3"
                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-dueDate" className="block text-sm font-medium text-gray-700">
                            Due Date
                        </label>
                        <input
                            type="date"
                            id="edit-dueDate"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-700">
                            Priority
                        </label>
                        <select
                            id="edit-priority"
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => {
                                setShowEditModal(false);
                                setSelectedTodo(null);
                                setFormData({
                                    title: '',
                                    description: '',
                                    dueDate: DateTime.now().plus({ days: 1 }).toISODate(),
                                    priority: 'medium',
                                    status: 'pending',
                                    isStarred: false
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
                            Save Changes
                        </button>
                    </div>
                </form>
            </SimpleModal>

            <SimpleModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Todo</h3>
                <p className="text-gray-600 mb-6">
                    Are you sure you want to delete this todo? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={() => {
                            setShowDeleteConfirm(false);
                            setSelectedTodo(null);
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
            </SimpleModal>

            {/* Mobile Overlay */}
            {showSidebar && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                    onClick={() => setShowSidebar(false)}
                    aria-hidden="true"
                />
            )}
        </div>
    );
}
