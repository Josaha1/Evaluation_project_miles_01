import { cn } from "@/lib/utils";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative mt-auto">
            {/* Gradient border top */}
            <div className="h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent dark:via-violet-400/30" />

            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    <div className="py-6 sm:py-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            {/* Branding */}
                            <div className="flex flex-col items-center sm:items-start gap-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded gradient-primary flex items-center justify-center">
                                        <span className="text-white text-[10px] font-bold">
                                            M
                                        </span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Miles Consult Group
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                    ระบบประเมินผลการปฏิบัติงาน 360 องศา
                                </p>
                            </div>

                            {/* Links */}
                            <div className="flex items-center gap-4 sm:gap-6 text-xs text-gray-500 dark:text-gray-500">
                                <a
                                    href="https://www.ieat.go.th"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                                >
                                    เว็บไซต์ กนอ.
                                </a>
                                <span className="text-gray-300 dark:text-gray-700">|</span>
                                <a
                                    href="mailto:support@milesconsult.co.th"
                                    className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                                >
                                    ติดต่อสนับสนุน
                                </a>
                            </div>

                            {/* Copyright */}
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-600">
                                <span>&copy; {currentYear}</span>
                                <span className="hidden sm:inline">Miles Consult Group.</span>
                                <span>สงวนลิขสิทธิ์</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
