import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function SimpleModal({ isOpen, onClose, children }) {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                    onClick={onClose}
                    aria-hidden="true"
                />
                <div className="relative transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all sm:max-w-lg sm:w-full">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
