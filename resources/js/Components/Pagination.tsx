import React from 'react';
import { Link } from '@inertiajs/react';

interface Props {
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export default function Pagination({ links }: Props) {
    return (
        <div className="flex flex-wrap mt-6 justify-center">
            {links.map((link, index) => (
                <div key={index}>
                    {link.url ? (
                        <Link
                            href={link.url}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            className={`px-3 py-2 mx-1 rounded border text-sm ${
                                link.active ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                        />
                    ) : (
                        <span
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            className="px-3 py-2 mx-1 rounded border text-sm text-gray-400"
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
