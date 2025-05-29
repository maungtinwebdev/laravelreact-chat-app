import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { Link } from '@inertiajs/react'

export function Dropdown({ children }) {
    return children
}

Dropdown.Trigger = function DropdownTrigger({ children }) {
    return (
        <Menu.Button className="flex items-center">
            {children}
        </Menu.Button>
    )
}

Dropdown.Content = function DropdownContent({ children }) {
    return (
        <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
        >
            <Menu.Items className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {children}
            </Menu.Items>
        </Transition>
    )
}

Dropdown.Link = function DropdownLink({ href, method = 'get', as = 'a', children, ...props }) {
    return (
        <Menu.Item>
            {({ active }) => (
                <Link
                    href={href}
                    method={method}
                    as={as}
                    className={`block px-4 py-2 text-sm text-gray-700 ${
                        active ? 'bg-gray-100' : ''
                    }`}
                    {...props}
                >
                    {children}
                </Link>
            )}
        </Menu.Item>
    )
}
