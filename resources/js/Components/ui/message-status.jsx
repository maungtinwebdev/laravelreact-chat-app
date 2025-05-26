import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

export function MessageStatus({ status, className = '' }) {
    const getStatusIcon = () => {
        switch (status) {
            case 'sent':
                return <Check className="w-3 h-3" />;
            case 'delivered':
                return <CheckCheck className="w-3 h-3" />;
            case 'seen':
                return <CheckCheck className="w-3 h-3 text-blue-500" />;
            default:
                return <Check className="w-3 h-3" />;
        }
    };

    return (
        <div className={`flex items-center ${className}`}>
            {getStatusIcon()}
            <span className="text-xs ml-1 text-gray-500">
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        </div>
    );
}
