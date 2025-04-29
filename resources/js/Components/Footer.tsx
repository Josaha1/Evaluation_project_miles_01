import React from 'react'

const Footer = () => {
    return (
        <>
            {/* Footer */}
            <footer className="mb-0 py-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="flex flex-col items-center justify-center text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            พัฒนาด้วย โดย Miles Consult group
                        </p>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                            © {new Date().getFullYear()} Miles Consult group. สงวนลิขสิทธิ์
                        </p>
                    </div>
                </div>
            </footer>
        </>
    )
}

export default Footer