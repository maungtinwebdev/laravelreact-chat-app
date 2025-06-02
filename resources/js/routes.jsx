import { createBrowserRouter } from 'react-router-dom';
import Layout from './Layout';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Chat from './Pages/Chat';
import Profile from './Pages/Profile';
import UserManagement from './Pages/UserManagement';
import ExpenseTracker from './Pages/ExpenseTracker';

const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        children: [
            {
                path: '/',
                element: <Chat />,
                auth: true
            },
            {
                path: '/login',
                element: <Login />
            },
            {
                path: '/register',
                element: <Register />
            },
            {
                path: '/profile',
                element: <Profile />,
                auth: true
            },
            {
                path: '/user-management',
                element: <UserManagement />,
                auth: true
            },
            {
                path: '/expense-tracker',
                element: <ExpenseTracker />,
                auth: true
            }
        ]
    }
]);

export default router;
