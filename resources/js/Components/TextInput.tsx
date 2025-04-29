import { forwardRef, InputHTMLAttributes } from 'react'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className = '', error, ...props }, ref) => (
    <input
      {...props}
      ref={ref}
      className={`mt-1 block w-full rounded-md 
        border border-gray-300 dark:border-gray-600 
        bg-white dark:bg-gray-900 
        text-gray-900 dark:text-gray-100 
        placeholder-gray-400 dark:placeholder-gray-500
        shadow-sm 
        focus:outline-none focus:ring-2 focus:ring-offset-2
        focus:border-blue-500 focus:ring-blue-500/20 
        dark:focus:border-blue-400 dark:focus:ring-blue-400/20
        disabled:bg-gray-50 dark:disabled:bg-gray-800
        disabled:text-gray-500 dark:disabled:text-gray-400
        disabled:cursor-not-allowed
        sm:text-sm
        transition-all duration-200 ease-in-out
        ${error ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:focus:border-red-400 dark:focus:ring-red-400/20' : ''} 
        ${className}`}
    />
  )
)

TextInput.displayName = 'TextInput'

export default TextInput 