import React from "react"
import { cn } from "@/lib/utils"

export type BreadcrumbItem = {
    label: string
    href?: string
    active?: boolean
}

interface BreadcrumbProps {
    items: BreadcrumbItem[]
    className?: string
}

export default function Breadcrumb({ items, className }: BreadcrumbProps) {
    return (
        <nav className={cn("w-full flex justify-center", className)}>
            <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded px-4 py-2 shadow-sm">
                {items.map((item, index) => (
                    <li key={index} className="flex items-center">
                        {item.href && !item.active ? (
                            <a
                                href={item.href}
                                className="hover:underline text-indigo-600 dark:text-indigo-400 font-medium"
                            >
                                {item.label}
                            </a>
                        ) : (
                            <span className="text-gray-800 dark:text-white font-semibold">
                                {item.label}
                            </span>
                        )}
                        {index < items.length - 1 && <span className="mx-1">/</span>}
                    </li>
                ))}
            </ol>
        </nav>
    )
}
