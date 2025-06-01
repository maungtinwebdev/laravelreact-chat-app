import React from 'react';
import { Switch as HeadlessSwitch } from '@headlessui/react';

export function Switch({ checked, onChange, label, description }) {
    return (
        <HeadlessSwitch.Group as="div" className="flex items-center justify-between">
            <div className="flex-grow">
                <HeadlessSwitch.Label as="span" className="text-sm font-medium text-gray-900">
                    {label}
                </HeadlessSwitch.Label>
                {description && (
                    <HeadlessSwitch.Description as="span" className="text-sm text-gray-500 block">
                        {description}
                    </HeadlessSwitch.Description>
                )}
            </div>
            <HeadlessSwitch
                checked={checked}
                onChange={onChange}
                className={`${
                    checked ? 'bg-indigo-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
            >
                <span
                    className={`${
                        checked ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
            </HeadlessSwitch>
        </HeadlessSwitch.Group>
    );
}
