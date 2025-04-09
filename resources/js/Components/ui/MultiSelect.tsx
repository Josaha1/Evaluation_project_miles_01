// components/ui/MultiSelect.tsx
import { Fragment, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { Check, ChevronDown } from 'lucide-react'

interface Option {
    value: string
    label: string
}

interface Props {
    options: Option[]
    selected: string[]
    onChange: (val: string[]) => void
    placeholder?: string
}

export default function MultiSelect({ options, selected, onChange, placeholder }: Props) {
    const [query, setQuery] = useState("")

    const filteredOptions = query === ""
        ? options
        : options.filter(opt => opt.label.toLowerCase().includes(query.toLowerCase()))

    const toggle = (val: string) => {
        if (selected.includes(val)) {
            onChange(selected.filter(v => v !== val))
        } else {
            onChange([...selected, val])
        }
    }

    return (
        <Listbox as="div" className="relative">
            <div className="relative w-full">
                <Listbox.Button className="w-full border rounded p-2 text-left bg-white dark:bg-gray-800 dark:text-white">
                    {selected.length > 0
                        ? options.filter(o => selected.includes(o.value)).map(o => o.label).join(", ")
                        : placeholder || "เลือกกลุ่มเป้าหมาย"}
                    <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                </Listbox.Button>
            </div>

            <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border bg-white dark:bg-gray-800 shadow-lg text-sm">
                    <div className="px-2 py-1 sticky top-0 bg-white dark:bg-gray-800">
                        <input
                            type="text"
                            placeholder="ค้นหา..."
                            className="w-full border p-1 rounded text-sm dark:bg-gray-700 dark:text-white"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    {filteredOptions.map((opt) => (
                        <Listbox.Option
                            key={opt.value}
                            value={opt.value}
                            as={Fragment}
                        >
                            {({ active }) => (
                                <li
                                    className={`cursor-pointer flex items-center justify-between px-4 py-2 ${active ? 'bg-indigo-100 dark:bg-indigo-600' : ''}`}
                                    onClick={() => toggle(opt.value)}
                                >
                                    <span>{opt.label}</span>
                                    {selected.includes(opt.value) && <Check className="w-4 h-4 text-indigo-600" />}
                                </li>
                            )}
                        </Listbox.Option>
                    ))}
                </Listbox.Options>
            </Transition>
        </Listbox>
    )
}
