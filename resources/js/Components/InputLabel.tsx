import { ReactNode } from 'react'

interface InputLabelProps {
  value?: ReactNode
  htmlFor?: string
  children?: ReactNode
  className?: string
  required?: boolean
}

export default function InputLabel({ value, htmlFor, className = '', children, required = false }: InputLabelProps) {
  return (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${className}`}>
      {value || children}
      {required && <span className="text-red-600 dark:text-red-400 ml-1">*</span>}
    </label>
  )
}