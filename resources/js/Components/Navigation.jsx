import { Link } from '@inertiajs/react';
import { User, MessageSquare, LogOut } from 'lucide-react';

export default function Navigation({ auth }) {
    return (
        <nav className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/dashboard" className="text-xl font-bold text-[#0084ff]">
                                ChatApp
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <Link
                            href="/chat"
                            className="p-2 text-gray-600 hover:text-[#0084ff] hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <MessageSquare className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/profile"
                            className="p-2 text-gray-600 hover:text-[#0084ff] hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <User className="w-5 h-5" />
                        </Link>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
