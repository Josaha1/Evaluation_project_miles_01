import React, { useState, useCallback, useEffect, useMemo } from "react";
import MainLayout from "@/Layouts/MainLayout";
import { usePage, router } from "@inertiajs/react";
import Breadcrumb from "@/Components/ui/breadcrumb";
import IndividualDetailedReport from "@/Components/IndividualDetailedReport";

import {
    Loader2,
    AlertCircle,
    RefreshCw,
    TrendingUp,
    BarChart3,
    Users,
    Trophy,
    Activity,
    Zap,
    ClipboardList,
    Download,
    Eye,
    Search,
    Filter,
    CheckCircle,
    Clock,
    AlertTriangle,
    Target,
    Award,
    Building,
    Calendar,
    User,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    Settings,
    Maximize2,
    Minimize2,
    Grid3X3,
    List,
    PieChart,
    LineChart,
    FileText,
    Star,
    TrendingDown,
    MoreHorizontal,
    BookOpen,
    Shield,
    Database,
    Share2,
    Bell,
    Info,
    HelpCircle,
    ExternalLink,
    RotateCcw,
    Save,
    Mail,
    Printer,
    Bookmark,
    Tag,
    MapPin,
    Layers,
    Package,
    Globe,
    Sun,
    Moon,
    X,
    Plus,
    Minus,
    Play,
    Pause,
    Crown,
} from "lucide-react";

// Enhanced TypeScript Interfaces
interface PageProps {
    filters: {
        fiscal_year?: string;
        division?: string;
        grade?: string;
        user_id?: string;
        department?: string;
        position?: string;
        evaluation_type?: string;
        date_range?: {
            start: string;
            end: string;
        };
    };
    availableYears: string[];
    availableDivisions: { id: number; name: string }[];
    availableGrades: number[];
    availableUsers: { id: number; name: string }[];
    availableDepartments: { id: number; title: string }[];
    availablePositions: { id: number; title: string }[];
    fiscalYear: string;
    
    dashboardStats: {
        totalParticipants: number;
        completedEvaluations: number;
        pendingEvaluations: number;
        overallCompletionRate: number;
        averageScore: number;
        totalQuestions: number;
        totalAnswers: number;
        uniqueEvaluators: number;
        uniqueEvaluatees: number;
        evaluationTypes: number;
        lastUpdated: string;
    };
    
    evaluationMetrics: {
        byGrade: Array<{
            grade: number;
            total: number;
            completed: number;
            averageScore: number;
            completionRate: number;
        }>;
        byDivision: Array<{
            division: string;
            divisionId: number;
            total: number;
            completed: number;
            averageScore: number;
            completionRate: number;
        }>;
        byAngle: Array<{
            angle: string;
            total: number;
            completed: number;
            averageScore: number;
        }>;
        trends: Array<{
            date: string;
            completions: number;
            averageScore: number;
        }>;
    };
    
    detailedResults: Array<{
        id: number;
        evaluateeName: string;
        evaluateeGrade: number;
        evaluateeDivision: string;
        evaluateePosition: string;
        scores: {
            self: number;
            top: number;
            bottom: number;
            left: number;
            right: number;
            average: number;
        };
        completionStatus: {
            totalAngles: number;
            completedAngles: number;
            completionRate: number;
            lastActivity: string;
        };
        evaluators: Array<{
            name: string;
            angle: string;
            completed: boolean;
            score: number;
            submittedAt: string;
        }>;
        aspectScores: Array<{
            aspectName: string;
            score: number;
            maxScore: number;
            percentage: number;
        }>;
    }>;
}

interface DashboardConfig {
    theme: 'light' | 'dark';
    view: 'dashboard' | 'analytics' | 'reports' | 'exports';
    layout: 'grid' | 'list';
    compactMode: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
}

interface ExportOptions {
    format: 'excel' | 'pdf' | 'csv';
    includeCharts: boolean;
    includeRawData: boolean;
    dateRange: 'all' | 'current' | 'custom';
    customDateStart?: string;
    customDateEnd?: string;
    divisions: string[];
    grades: number[];
    reportType: 'summary' | 'detailed' | 'individual' | 'comparison';
    onlyCompleted: boolean;
}

const AdminEvaluationReport: React.FC = () => {
    const { props } = usePage<PageProps>();
    const {
        filters = {},
        availableYears = [],
        availableDivisions = [],
        availableGrades = [],
        availableUsers = [],
        availableDepartments = [],
        availablePositions = [],
        fiscalYear = new Date().getFullYear().toString(),
        dashboardStats = {
            totalParticipants: 0,
            completedEvaluations: 0,
            pendingEvaluations: 0,
            overallCompletionRate: 0,
            averageScore: 0,
            totalQuestions: 0,
            totalAnswers: 0,
            uniqueEvaluators: 0,
            uniqueEvaluatees: 0,
            evaluationTypes: 0,
            lastUpdated: new Date().toISOString()
        },
        evaluationMetrics = {
            byGrade: [],
            byDivision: [],
            byAngle: [],
            trends: []
        },
        detailedResults = [],
    } = props;

    // Enhanced State Management
    const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>({
        theme: 'light',
        view: 'dashboard',
        layout: 'grid',
        compactMode: false,
        autoRefresh: false,
        refreshInterval: 30000,
    });

    const [exportOptions, setExportOptions] = useState<ExportOptions>({
        format: 'excel',
        includeCharts: true,
        includeRawData: false,
        dateRange: 'current',
        divisions: [],
        grades: [],
        reportType: 'summary',
        onlyCompleted: false,
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDivision, setSelectedDivision] = useState("");
    const [selectedGrade, setSelectedGrade] = useState("");

    // Helper: display grade label with Thai name for special grades
    const getGradeLabel = (grade: number | string): string => {
        const g = Number(grade);
        if (g >= 13) return `ผู้ว่าการ (ระดับ ${g})`;
        if (g >= 9) return `ผู้บริหาร (ระดับ ${g})`;
        return `พนักงาน (ระดับ ${g})`;
    };
    const [viewMode, setViewMode] = useState<'cards' | 'table' | 'charts'>('cards');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<number | null>(null);
    const [showIndividualReport, setShowIndividualReport] = useState(false);
    const [showEvaluateeDetails, setShowEvaluateeDetails] = useState(false);
    const [selectedEvaluateeId, setSelectedEvaluateeId] = useState<number | null>(null);
    const [evaluateeDetailsData, setEvaluateeDetailsData] = useState<any>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'grades', 'recent', 'divisions', 'angles']));

    // Auto-refresh functionality
    useEffect(() => {
        if (dashboardConfig.autoRefresh) {
            const interval = setInterval(() => {
                refreshData();
            }, dashboardConfig.refreshInterval);
            return () => clearInterval(interval);
        }
    }, [dashboardConfig.autoRefresh, dashboardConfig.refreshInterval]);

    // Data refresh function
    const refreshData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/admin/reports/evaluation/api/real-time-data', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });
            
            if (response.ok) {
                const newData = await response.json();
                setLastRefresh(new Date());
                // Update data would be handled by Inertia in real implementation
            }
        } catch (error) {
            console.error('Failed to refresh data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch evaluatee details
    const fetchEvaluateeDetails = async (evaluateeId: number) => {
        setIsLoadingDetails(true);
        try {
            const response = await fetch(`/admin/reports/evaluation/api/evaluatee-details/${evaluateeId}?fiscal_year=${fiscalYear}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            if (response.ok) {
                const data = await response.json();
                setEvaluateeDetailsData(data);
            } else {
                console.error('Failed to fetch evaluatee details');
            }
        } catch (error) {
            console.error('Error fetching evaluatee details:', error);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    // Show evaluatee details modal
    const showEvaluateeDetailsModal = (evaluateeId: number) => {
        setSelectedEvaluateeId(evaluateeId);
        setShowEvaluateeDetails(true);
        fetchEvaluateeDetails(evaluateeId);
    };

    // Comprehensive Export Functions
    const handleExport = async (type: string) => {
        setIsExporting(true);
        
        try {
            const formData = new FormData();
            formData.append('fiscal_year', fiscalYear);
            formData.append('export_type', type);
            formData.append('format', exportOptions.format);
            formData.append('include_charts', exportOptions.includeCharts.toString());
            formData.append('include_raw_data', exportOptions.includeRawData.toString());
            formData.append('date_range', exportOptions.dateRange);
            formData.append('report_type', exportOptions.reportType);
            formData.append('only_completed', exportOptions.onlyCompleted.toString());
            
            if (selectedDivision) formData.append('division_id', selectedDivision);
            if (selectedGrade) formData.append('grade', selectedGrade);
            
            // Add evaluation_id only for detailed-data export (user selects specific evaluation)
            // executives, employees, self-evaluation use dynamic lookup on backend
            if (type === 'detailed-data') {
                const evaluationId = formData.get('evaluation_id');
                if (!evaluationId) {
                    formData.append('evaluation_id', '1');
                }
            }
            
            exportOptions.divisions.forEach(div => formData.append('divisions[]', div));
            exportOptions.grades.forEach(grade => formData.append('grades[]', grade.toString()));
            
            formData.append('_token', document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '');

            // Map type to correct endpoint
            let endpoint = `/admin/reports/evaluation/export/${type}`;
            if (type === 'self-evaluation') {
                endpoint = '/admin/reports/evaluation/export/self-evaluation';
            }
            
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            if (response.ok) {
                const contentType = response.headers.get('content-type');
                
                // Check if response is JSON (error response)
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'ไม่สามารถส่งออกรายงานได้');
                }
                
                // Handle file download
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                
                const fileExtension = exportOptions.format === 'excel' ? 'xlsx' : 
                                    exportOptions.format === 'pdf' ? 'pdf' : 'csv';
                link.download = `รายงานการประเมิน_${type}_${fiscalYear}.${fileExtension}`;
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else {
                // Try to get error message from response
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Export failed: ${response.status} ${response.statusText}`);
                } else {
                    throw new Error(`Export failed: ${response.status} ${response.statusText}`);
                }
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('ไม่สามารถส่งออกรายงานได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsExporting(false);
            setShowExportModal(false);
        }
    };

    // Advanced filtering and search
    const filteredResults = useMemo(() => {
        if (!detailedResults || !Array.isArray(detailedResults)) {
            return [];
        }
        
        return detailedResults.filter(result => {
            const matchesSearch = !searchQuery || 
                result.evaluateeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                result.evaluateeDivision.toLowerCase().includes(searchQuery.toLowerCase()) ||
                result.evaluateePosition.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesDivision = !selectedDivision || result.evaluateeDivision === selectedDivision;
            const matchesGrade = !selectedGrade || result.evaluateeGrade.toString() === selectedGrade;
            
            return matchesSearch && matchesDivision && matchesGrade;
        });
    }, [detailedResults, searchQuery, selectedDivision, selectedGrade]);

    // Section toggle function
    const toggleSection = (sectionId: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionId)) {
            newExpanded.delete(sectionId);
        } else {
            newExpanded.add(sectionId);
        }
        setExpandedSections(newExpanded);
    };

    // Utility functions
    const getScoreColor = (score: number) => {
        if (score >= 4.5) return dashboardConfig.theme === 'dark' ? 'text-green-400' : 'text-green-600';
        if (score >= 4.0) return dashboardConfig.theme === 'dark' ? 'text-blue-400' : 'text-blue-600';
        if (score >= 3.5) return dashboardConfig.theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600';
        if (score >= 3.0) return dashboardConfig.theme === 'dark' ? 'text-orange-400' : 'text-orange-600';
        return dashboardConfig.theme === 'dark' ? 'text-red-400' : 'text-red-600';
    };

    const getCompletionColor = (rate: number) => {
        if (rate >= 90) return dashboardConfig.theme === 'dark' ? 'text-green-400' : 'text-green-600';
        if (rate >= 75) return dashboardConfig.theme === 'dark' ? 'text-blue-400' : 'text-blue-600';
        if (rate >= 50) return dashboardConfig.theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600';
        return dashboardConfig.theme === 'dark' ? 'text-red-400' : 'text-red-600';
    };

    return (
        <MainLayout>
            <div className={`min-h-screen transition-all duration-300 ${
                dashboardConfig.theme === 'dark' 
                    ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800' 
                    : 'bg-gradient-to-br from-slate-50 via-white to-gray-50'
            }`}>
                
                {/* Enhanced Header with Theme Toggle and Controls */}
                <div className={`shadow-xl relative overflow-hidden ${
                    dashboardConfig.theme === 'dark'
                        ? 'bg-gradient-to-r from-slate-800 via-gray-900 to-slate-800'
                        : 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600'
                } text-white`}>
                    <div className="absolute inset-0 bg-black opacity-10"></div>
                    <div className="relative px-6 py-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                                    dashboardConfig.theme === 'dark' ? 'bg-slate-700' : 'bg-white/20'
                                } backdrop-blur-sm`}>
                                    <BarChart3 className={`h-8 w-8 ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-white'
                                    }`} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">
                                        รายงานการประเมิน 360 องศา
                                    </h1>
                                    <p className={`text-lg ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-blue-100'
                                    }`}>
                                        ปีงบประมาณ {fiscalYear} • อัปเดตล่าสุด: {lastRefresh.toLocaleTimeString('th-TH')}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Header Controls */}
                            <div className="flex items-center gap-3 flex-wrap">
                                {/* Theme Toggle */}
                                <button
                                    onClick={() => setDashboardConfig(prev => ({ 
                                        ...prev, 
                                        theme: prev.theme === 'dark' ? 'light' : 'dark' 
                                    }))}
                                    className={`p-3 rounded-xl transition-all duration-300 ${
                                        dashboardConfig.theme === 'dark' 
                                            ? 'bg-slate-700 hover:bg-slate-600' 
                                            : 'bg-white/20 hover:bg-white/30'
                                    } backdrop-blur-sm`}
                                    title={dashboardConfig.theme === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
                                >
                                    {dashboardConfig.theme === 'dark' ? 
                                        <Sun className="h-5 w-5 text-gray-300" /> : 
                                        <Moon className="h-5 w-5 text-white" />
                                    }
                                </button>

                                {/* Auto Refresh Toggle */}
                                <button
                                    onClick={() => setDashboardConfig(prev => ({ 
                                        ...prev, 
                                        autoRefresh: !prev.autoRefresh 
                                    }))}
                                    className={`p-3 rounded-xl transition-all duration-300 ${
                                        dashboardConfig.autoRefresh 
                                            ? 'bg-green-500 hover:bg-green-600' 
                                            : dashboardConfig.theme === 'dark' 
                                                ? 'bg-slate-700 hover:bg-slate-600' 
                                                : 'bg-white/20 hover:bg-white/30'
                                    } backdrop-blur-sm`}
                                    title={dashboardConfig.autoRefresh ? 'ปิดการอัปเดตอัตโนมัติ' : 'เปิดการอัปเดตอัตโนมัติ'}
                                >
                                    {dashboardConfig.autoRefresh ? 
                                        <Pause className="h-5 w-5 text-white" /> : 
                                        <Play className="h-5 w-5 text-gray-300" />
                                    }
                                </button>

                                {/* Manual Refresh */}
                                <button
                                    onClick={refreshData}
                                    disabled={isLoading}
                                    className={`p-3 rounded-xl transition-all duration-300 ${
                                        dashboardConfig.theme === 'dark' 
                                            ? 'bg-slate-700 hover:bg-slate-600' 
                                            : 'bg-white/20 hover:bg-white/30'
                                    } backdrop-blur-sm disabled:opacity-50`}
                                    title="รีเฟรชข้อมูล"
                                >
                                    <RefreshCw className={`h-5 w-5 ${
                                        isLoading ? 'animate-spin' : ''
                                    } ${dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-white'}`} />
                                </button>

                                {/* Export Button */}
                                <button
                                    onClick={() => setShowExportModal(true)}
                                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg flex items-center gap-2"
                                >
                                    <Download className="h-5 w-5 text-gray-300" />
                                    ส่งออกรายงาน
                                </button>

                                {/* Settings */}
                                <button
                                    className={`p-3 rounded-xl transition-all duration-300 ${
                                        dashboardConfig.theme === 'dark' 
                                            ? 'bg-slate-700 hover:bg-slate-600' 
                                            : 'bg-white/20 hover:bg-white/30'
                                    } backdrop-blur-sm`}
                                    title="ตั้งค่า"
                                >
                                    <Settings className={`h-5 w-5 ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-white'
                                    }`} />
                                </button>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="mt-6 flex flex-wrap gap-2">
                            {[
                                { id: 'dashboard', label: 'แดชบอร์ด', icon: Grid3X3 },
                                { id: 'analytics', label: 'วิเคราะห์', icon: TrendingUp },
                                { id: 'reports', label: 'รายงาน', icon: FileText },
                                { id: 'exports', label: 'ส่งออก', icon: Download }
                            ].map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setDashboardConfig(prev => ({ ...prev, view: tab.id as any }))}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                                            dashboardConfig.view === tab.id
                                                ? 'bg-white text-blue-600 shadow-lg'
                                                : dashboardConfig.theme === 'dark'
                                                    ? 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                                                    : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4 text-gray-600" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Enhanced Search and Filter Bar */}
                <div className={`sticky top-0 z-40 ${
                    dashboardConfig.theme === 'dark' 
                        ? 'bg-slate-800/95 border-slate-700' 
                        : 'bg-white/95 border-gray-200'
                } backdrop-blur-sm border-b shadow-sm`}>
                    <div className="px-6 py-4">
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                            {/* Search and Filters */}
                            <div className="flex flex-1 gap-3 flex-wrap items-center">
                                {/* Search Bar */}
                                <div className="relative flex-1 min-w-64">
                                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                    }`} />
                                    <input
                                        type="text"
                                        placeholder="ค้นหาชื่อ, หน่วยงาน, ตำแหน่ง..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 ${
                                            dashboardConfig.theme === 'dark'
                                                ? 'bg-slate-700 border-slate-600 text-gray-300 placeholder-gray-400 focus:border-blue-400'
                                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                                        } focus:ring-2 focus:ring-blue-500/20 focus:outline-none`}
                                    />
                                </div>

                                {/* Division Filter */}
                                <select
                                    value={selectedDivision}
                                    onChange={(e) => setSelectedDivision(e.target.value)}
                                    className={`px-4 py-3 rounded-xl border transition-all duration-300 ${
                                        dashboardConfig.theme === 'dark'
                                            ? 'bg-slate-700 border-slate-600 text-gray-300'
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } focus:ring-2 focus:ring-blue-500/20 focus:outline-none`}
                                >
                                    <option value="">ทุกหน่วยงาน</option>
                                    {(availableDivisions || []).map((division) => (
                                        <option key={division.id} value={division.name}>
                                            {division.name}
                                        </option>
                                    ))}
                                </select>

                                {/* Grade Filter */}
                                <select
                                    value={selectedGrade}
                                    onChange={(e) => setSelectedGrade(e.target.value)}
                                    className={`px-4 py-3 rounded-xl border transition-all duration-300 ${
                                        dashboardConfig.theme === 'dark'
                                            ? 'bg-slate-700 border-slate-600 text-gray-300'
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } focus:ring-2 focus:ring-blue-500/20 focus:outline-none`}
                                >
                                    <option value="">ทุกระดับ</option>
                                    {(availableGrades || []).map((grade) => (
                                        <option key={grade} value={grade.toString()}>
                                            {getGradeLabel(grade)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* View Mode Controls */}
                            <div className="flex items-center gap-2">
                                <div className={`flex rounded-xl p-1 ${
                                    dashboardConfig.theme === 'dark' ? 'bg-slate-700' : 'bg-gray-100'
                                }`}>
                                    {[
                                        { mode: 'cards', icon: Grid3X3, label: 'การ์ด' },
                                        { mode: 'table', icon: List, label: 'ตาราง' },
                                        { mode: 'charts', icon: BarChart3, label: 'กราฟ' }
                                    ].map(({ mode, icon: Icon, label }) => (
                                        <button
                                            key={mode}
                                            onClick={() => setViewMode(mode as any)}
                                            className={`px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                                                viewMode === mode
                                                    ? dashboardConfig.theme === 'dark'
                                                        ? 'bg-slate-600 text-gray-300'
                                                        : 'bg-white text-gray-900 shadow-sm'
                                                    : dashboardConfig.theme === 'dark'
                                                        ? 'text-gray-400 hover:text-gray-300'
                                                        : 'text-gray-600 hover:text-gray-800'
                                            }`}
                                            title={label}
                                        >
                                            <Icon className="h-4 w-4 text-gray-600" />
                                            <span className="hidden sm:inline text-sm font-medium">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Active Filters Display */}
                        {(searchQuery || selectedDivision || selectedGrade) && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {searchQuery && (
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                                        dashboardConfig.theme === 'dark' 
                                            ? 'bg-blue-500/20 text-blue-300' 
                                            : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        <Search className="h-3 w-3 text-gray-600" />
                                        {searchQuery}
                                        <button 
                                            onClick={() => setSearchQuery('')}
                                            className="ml-1 hover:bg-blue-500/30 rounded"
                                        >
                                            <X className="h-3 w-3 text-gray-600" />
                                        </button>
                                    </span>
                                )}
                                {selectedDivision && (
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                                        dashboardConfig.theme === 'dark' 
                                            ? 'bg-green-500/20 text-green-300' 
                                            : 'bg-green-100 text-green-800'
                                    }`}>
                                        <Building className="h-3 w-3 text-gray-600" />
                                        {selectedDivision}
                                        <button 
                                            onClick={() => setSelectedDivision('')}
                                            className="ml-1 hover:bg-green-500/30 rounded"
                                        >
                                            <X className="h-3 w-3 text-gray-600" />
                                        </button>
                                    </span>
                                )}
                                {selectedGrade && (
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                                        dashboardConfig.theme === 'dark' 
                                            ? 'bg-purple-500/20 text-purple-300' 
                                            : 'bg-purple-100 text-purple-800'
                                    }`}>
                                        <Award className="h-3 w-3 text-gray-600" />
                                        {getGradeLabel(selectedGrade)}
                                        <button 
                                            onClick={() => setSelectedGrade('')}
                                            className="ml-1 hover:bg-purple-500/30 rounded"
                                        >
                                            <X className="h-3 w-3 text-gray-600" />
                                        </button>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="px-6 py-8">
                    {dashboardConfig.view === 'dashboard' && (
                        <DashboardView 
                            dashboardStats={dashboardStats}
                            evaluationMetrics={evaluationMetrics}
                            filteredResults={filteredResults}
                            dashboardConfig={dashboardConfig}
                            viewMode={viewMode}
                            expandedSections={expandedSections}
                            toggleSection={toggleSection}
                            getScoreColor={getScoreColor}
                            getCompletionColor={getCompletionColor}
                            setSelectedUser={setSelectedUser}
                            setShowIndividualReport={setShowIndividualReport}
                        />
                    )}

                    {dashboardConfig.view === 'analytics' && (
                        <AnalyticsView 
                            evaluationMetrics={evaluationMetrics}
                            dashboardConfig={dashboardConfig}
                            getScoreColor={getScoreColor}
                            getCompletionColor={getCompletionColor}
                        />
                    )}

                    {dashboardConfig.view === 'reports' && (
                        <ReportsView 
                            filteredResults={filteredResults}
                            dashboardConfig={dashboardConfig}
                            viewMode={viewMode}
                            getScoreColor={getScoreColor}
                            getCompletionColor={getCompletionColor}
                            setSelectedUser={setSelectedUser}
                            setShowIndividualReport={setShowIndividualReport}
                            showEvaluateeDetailsModal={showEvaluateeDetailsModal}
                        />
                    )}

                    {dashboardConfig.view === 'exports' && (
                        <ExportsView 
                            exportOptions={exportOptions}
                            setExportOptions={setExportOptions}
                            handleExport={handleExport}
                            isExporting={isExporting}
                            dashboardConfig={dashboardConfig}
                            availableDivisions={availableDivisions}
                            availableGrades={availableGrades}
                        />
                    )}
                </div>

                {/* Individual Report Modal */}
                {showIndividualReport && selectedUser && (
                    <IndividualDetailedReport
                        userId={selectedUser}
                        fiscalYear={parseInt(fiscalYear)}
                        isOpen={showIndividualReport}
                        onClose={() => {
                            setShowIndividualReport(false);
                            setSelectedUser(null);
                        }}
                    />
                )}

                {/* Export Modal */}
                {showExportModal && (
                    <ExportModal
                        exportOptions={exportOptions}
                        setExportOptions={setExportOptions}
                        handleExport={handleExport}
                        isExporting={isExporting}
                        onClose={() => setShowExportModal(false)}
                        dashboardConfig={dashboardConfig}
                        availableDivisions={availableDivisions}
                        availableGrades={availableGrades}
                    />
                )}

                {/* Evaluatee Details Modal */}
                {showEvaluateeDetails && selectedEvaluateeId && (
                    <EvaluateeDetailsModal
                        evaluateeId={selectedEvaluateeId}
                        evaluateeData={evaluateeDetailsData}
                        isLoading={isLoadingDetails}
                        fiscalYear={fiscalYear}
                        onClose={() => {
                            setShowEvaluateeDetails(false);
                            setSelectedEvaluateeId(null);
                            setEvaluateeDetailsData(null);
                        }}
                        dashboardConfig={dashboardConfig}
                    />
                )}
            </div>
        </MainLayout>
    );
};

// Dashboard View Component
const DashboardView: React.FC<{
    dashboardStats: any;
    evaluationMetrics: any;
    filteredResults: any[];
    dashboardConfig: DashboardConfig;
    viewMode: string;
    expandedSections: Set<string>;
    toggleSection: (id: string) => void;
    getScoreColor: (score: number) => string;
    getCompletionColor: (rate: number) => string;
    setSelectedUser: (id: number) => void;
    setShowIndividualReport: (show: boolean) => void;
}> = ({ 
    dashboardStats, 
    evaluationMetrics, 
    filteredResults, 
    dashboardConfig, 
    viewMode,
    expandedSections,
    toggleSection,
    getScoreColor,
    getCompletionColor,
    setSelectedUser,
    setShowIndividualReport
}) => {
    return (
        <div className="space-y-8">
            {/* Stats Overview */}
            <div className={`rounded-2xl p-6 ${
                dashboardConfig.theme === 'dark' 
                    ? 'bg-slate-800/50 border border-slate-700' 
                    : 'bg-white border border-gray-200'
            } shadow-xl backdrop-blur-sm`}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-2xl font-bold ${
                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                        ภาพรวมการประเมิน
                    </h2>
                    <button
                        onClick={() => toggleSection('overview')}
                        className={`p-2 rounded-lg transition-colors ${
                            dashboardConfig.theme === 'dark' 
                                ? 'hover:bg-slate-700' 
                                : 'hover:bg-gray-100'
                        }`}
                    >
                        {expandedSections.has('overview') ? 
                            <ChevronUp className={`h-5 w-5 ${
                                dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`} /> : 
                            <ChevronDown className={`h-5 w-5 ${
                                dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`} />
                        }
                    </button>
                </div>

                {expandedSections.has('overview') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
                        {/* Total Participants */}
                        <div className={`p-6 rounded-xl transition-all duration-300 hover:scale-105 ${
                            dashboardConfig.theme === 'dark'
                                ? 'bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600'
                                : 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200'
                        } shadow-lg hover:shadow-xl`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    dashboardConfig.theme === 'dark' ? 'bg-slate-600' : 'bg-blue-500'
                                }`}>
                                    <Users className={`h-6 w-6 ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-white'
                                    }`} />
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                        ผู้เข้าร่วม
                                    </p>
                                    <p className={`text-2xl font-bold ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-blue-600'
                                    }`}>
                                        {(dashboardStats?.totalParticipants || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Completed Evaluations */}
                        <div className={`p-6 rounded-xl transition-all duration-300 hover:scale-105 ${
                            dashboardConfig.theme === 'dark'
                                ? 'bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600'
                                : 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200'
                        } shadow-lg hover:shadow-xl`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    dashboardConfig.theme === 'dark' ? 'bg-slate-600' : 'bg-green-500'
                                }`}>
                                    <CheckCircle className={`h-6 w-6 ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-white'
                                    }`} />
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                        เสร็จสิ้น
                                    </p>
                                    <p className={`text-2xl font-bold ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-green-600'
                                    }`}>
                                        {(dashboardStats?.completedEvaluations || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Pending Evaluations */}
                        <div className={`p-6 rounded-xl transition-all duration-300 hover:scale-105 ${
                            dashboardConfig.theme === 'dark'
                                ? 'bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600'
                                : 'bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200'
                        } shadow-lg hover:shadow-xl`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    dashboardConfig.theme === 'dark' ? 'bg-slate-600' : 'bg-orange-500'
                                }`}>
                                    <Clock className={`h-6 w-6 ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-white'
                                    }`} />
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                        รอดำเนินการ
                                    </p>
                                    <p className={`text-2xl font-bold ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-orange-600'
                                    }`}>
                                        {(dashboardStats?.pendingEvaluations || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Completion Rate */}
                        <div className={`p-6 rounded-xl transition-all duration-300 hover:scale-105 ${
                            dashboardConfig.theme === 'dark'
                                ? 'bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600'
                                : 'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200'
                        } shadow-lg hover:shadow-xl`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    dashboardConfig.theme === 'dark' ? 'bg-slate-600' : 'bg-purple-500'
                                }`}>
                                    <TrendingUp className={`h-6 w-6 ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-white'
                                    }`} />
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                        % ความสำเร็จ
                                    </p>
                                    <p className={`text-2xl font-bold ${getCompletionColor(dashboardStats?.overallCompletionRate || 0)}`}>
                                        {(dashboardStats?.overallCompletionRate || 0).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Average Score */}
                        <div className={`p-6 rounded-xl transition-all duration-300 hover:scale-105 ${
                            dashboardConfig.theme === 'dark'
                                ? 'bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600'
                                : 'bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200'
                        } shadow-lg hover:shadow-xl`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    dashboardConfig.theme === 'dark' ? 'bg-slate-600' : 'bg-indigo-500'
                                }`}>
                                    <Star className={`h-6 w-6 ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-white'
                                    }`} />
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                        คะแนนเฉลี่ย
                                    </p>
                                    <p className={`text-2xl font-bold ${getScoreColor(dashboardStats?.averageScore || 0)}`}>
                                        {(dashboardStats?.averageScore || 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Total Answers */}
                        <div className={`p-6 rounded-xl transition-all duration-300 hover:scale-105 ${
                            dashboardConfig.theme === 'dark'
                                ? 'bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600'
                                : 'bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200'
                        } shadow-lg hover:shadow-xl`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    dashboardConfig.theme === 'dark' ? 'bg-slate-600' : 'bg-pink-500'
                                }`}>
                                    <ClipboardList className={`h-6 w-6 ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-white'
                                    }`} />
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                        คำตอบทั้งหมด
                                    </p>
                                    <p className={`text-2xl font-bold ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-pink-600'
                                    }`}>
                                        {(dashboardStats?.totalAnswers || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Performance by Grade */}
            <div className={`rounded-2xl p-6 ${
                dashboardConfig.theme === 'dark' 
                    ? 'bg-slate-800/50 border border-slate-700' 
                    : 'bg-white border border-gray-200'
            } shadow-xl backdrop-blur-sm`}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-2xl font-bold ${
                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                        ผลการประเมินตามระดับตำแหน่ง
                    </h2>
                    <button
                        onClick={() => toggleSection('grades')}
                        className={`p-2 rounded-lg transition-colors ${
                            dashboardConfig.theme === 'dark' 
                                ? 'hover:bg-slate-700' 
                                : 'hover:bg-gray-100'
                        }`}
                    >
                        {expandedSections.has('grades') ? 
                            <ChevronUp className={`h-5 w-5 ${
                                dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`} /> : 
                            <ChevronDown className={`h-5 w-5 ${
                                dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`} />
                        }
                    </button>
                </div>

                {expandedSections.has('grades') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(evaluationMetrics?.byGrade || []).map((grade) => (
                            <div
                                key={grade.grade}
                                className={`p-6 rounded-xl border transition-all duration-300 hover:scale-105 ${
                                    dashboardConfig.theme === 'dark'
                                        ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                } shadow-lg hover:shadow-xl`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className={`text-lg font-bold ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                    }`}>
                                        {getGradeLabel(grade.grade)}
                                    </h3>
                                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        dashboardConfig.theme === 'dark' 
                                            ? 'bg-slate-600 text-gray-300' 
                                            : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {grade.total} คน
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            เสร็จสิ้น
                                        </span>
                                        <span className={`font-bold ${getCompletionColor(grade?.completionRate || 0)}`}>
                                            {grade?.completed || 0}/{grade?.total || 0} ({(grade?.completionRate || 0).toFixed(1)}%)
                                        </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            คะแนนเฉลี่ย
                                        </span>
                                        <span className={`font-bold ${getScoreColor(grade?.averageScore || 0)}`}>
                                            {(grade?.averageScore || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    
                                    {/* Progress Bar */}
                                    <div className={`w-full rounded-full h-2 ${
                                        dashboardConfig.theme === 'dark' ? 'bg-slate-600' : 'bg-gray-200'
                                    }`}>
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${grade?.completionRate || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Evaluations */}
            <div className={`rounded-2xl p-6 ${
                dashboardConfig.theme === 'dark' 
                    ? 'bg-slate-800/50 border border-slate-700' 
                    : 'bg-white border border-gray-200'
            } shadow-xl backdrop-blur-sm`}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-2xl font-bold ${
                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                        รายงานล่าสุด
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className={`text-sm ${
                            dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            แสดง {filteredResults.length} รายการ
                        </span>
                        <button
                            onClick={() => toggleSection('recent')}
                            className={`p-2 rounded-lg transition-colors ${
                                dashboardConfig.theme === 'dark' 
                                    ? 'hover:bg-slate-700' 
                                    : 'hover:bg-gray-100'
                            }`}
                        >
                            {expandedSections.has('recent') ? 
                                <ChevronUp className={`h-5 w-5 ${
                                    dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                }`} /> : 
                                <ChevronDown className={`h-5 w-5 ${
                                    dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                }`} />
                            }
                        </button>
                    </div>
                </div>

                {expandedSections.has('recent') && (
                    <div className="space-y-4">
                        {filteredResults.slice(0, 10).map((result) => (
                            <div
                                key={result.id}
                                className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
                                    dashboardConfig.theme === 'dark'
                                        ? 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50'
                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                } shadow-sm hover:shadow-md`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            dashboardConfig.theme === 'dark' ? 'bg-slate-600' : 'bg-blue-100'
                                        }`}>
                                            <User className={`h-5 w-5 ${
                                                dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-blue-600'
                                            }`} />
                                        </div>
                                        <div>
                                            <h4 className={`font-semibold ${
                                                dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                            }`}>
                                                {result?.evaluateeName || 'N/A'}
                                            </h4>
                                            <p className={`text-sm ${
                                                dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                                {result?.evaluateePosition || 'N/A'} • {result?.evaluateeDivision || 'N/A'} • {result?.evaluateeGrade ? getGradeLabel(result.evaluateeGrade) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className={`text-lg font-bold ${getScoreColor(result?.scores?.average || 0)}`}>
                                                {(result?.scores?.average || 0).toFixed(2)}
                                            </div>
                                            <div className={`text-sm ${getCompletionColor(result?.completionStatus?.completionRate || 0)}`}>
                                                {(result?.completionStatus?.completionRate || 0).toFixed(1)}% เสร็จสิ้น
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={() => {
                                                setSelectedUser(result.id);
                                                setShowIndividualReport(true);
                                            }}
                                            className={`p-2 rounded-lg transition-colors ${
                                                dashboardConfig.theme === 'dark'
                                                    ? 'bg-slate-600 hover:bg-slate-500 text-gray-300'
                                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                            }`}
                                            title="ดูรายละเอียด"
                                        >
                                            <Eye className="h-4 w-4 text-gray-300" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {filteredResults.length === 0 && (
                            <div className={`text-center py-12 ${
                                dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                                <ClipboardList className={`h-12 w-12 mx-auto mb-4 ${
                                    dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-400'
                                }`} />
                                <p className="text-lg font-medium">ไม่พบข้อมูลการประเมิน</p>
                                <p className="text-sm">ลองปรับเปลี่ยนตัวกรองการค้นหา</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Analytics View Component
const AnalyticsView: React.FC<{
    evaluationMetrics: any;
    dashboardConfig: DashboardConfig;
    getScoreColor: (score: number) => string;
    getCompletionColor: (rate: number) => string;
}> = ({ evaluationMetrics, dashboardConfig, getScoreColor, getCompletionColor }) => {
    const [expandedAnalytics, setExpandedAnalytics] = useState<Set<string>>(new Set(['byDivision', 'byAngle', 'trends']));
    
    const toggleAnalyticsSection = (id: string) => {
        const newSet = new Set(expandedAnalytics);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedAnalytics(newSet);
    };

    return (
        <div className="space-y-8">
            <h2 className={`text-3xl font-bold ${
                dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
            }`}>
                วิเคราะห์ข้อมูลการประเมิน
            </h2>
            
            {/* Performance by Division */}
            <div className={`rounded-2xl p-6 ${
                dashboardConfig.theme === 'dark' 
                    ? 'bg-slate-800/50 border border-slate-700' 
                    : 'bg-white border border-gray-200'
            } shadow-xl backdrop-blur-sm`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-2xl font-bold ${
                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                        ผลการประเมินตามหน่วยงาน
                    </h3>
                    <button
                        onClick={() => toggleAnalyticsSection('byDivision')}
                        className={`p-2 rounded-lg transition-colors ${
                            dashboardConfig.theme === 'dark' 
                                ? 'hover:bg-slate-700' 
                                : 'hover:bg-gray-100'
                        }`}
                    >
                        {expandedAnalytics.has('byDivision') ? 
                            <ChevronUp className={`h-5 w-5 ${
                                dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`} /> : 
                            <ChevronDown className={`h-5 w-5 ${
                                dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`} />
                        }
                    </button>
                </div>

                {expandedAnalytics.has('byDivision') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(evaluationMetrics?.byDivision || []).map((division, index) => (
                            <div
                                key={index}
                                className={`p-6 rounded-xl border transition-all duration-300 hover:scale-105 ${
                                    dashboardConfig.theme === 'dark'
                                        ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                } shadow-lg hover:shadow-xl`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className={`text-lg font-bold ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                    }`}>
                                        {division.division || 'ไม่ระบุหน่วยงาน'}
                                    </h4>
                                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        dashboardConfig.theme === 'dark' 
                                            ? 'bg-slate-600 text-gray-300' 
                                            : 'bg-green-100 text-green-800'
                                    }`}>
                                        {division.total} คน
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            เสร็จสิ้น
                                        </span>
                                        <span className={`font-bold ${getCompletionColor(division?.completionRate || 0)}`}>
                                            {division?.completed || 0}/{division?.total || 0} ({(division?.completionRate || 0).toFixed(1)}%)
                                        </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            คะแนนเฉลี่ย
                                        </span>
                                        <span className={`font-bold ${getScoreColor(division?.averageScore || 0)}`}>
                                            {(division?.averageScore || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    
                                    {/* Progress Bar */}
                                    <div className={`w-full rounded-full h-2 ${
                                        dashboardConfig.theme === 'dark' ? 'bg-slate-600' : 'bg-gray-200'
                                    }`}>
                                        <div
                                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${division?.completionRate || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Performance by Angle */}
            <div className={`rounded-2xl p-6 ${
                dashboardConfig.theme === 'dark' 
                    ? 'bg-slate-800/50 border border-slate-700' 
                    : 'bg-white border border-gray-200'
            } shadow-xl backdrop-blur-sm`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-2xl font-bold ${
                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                        ผลการประเมินตามมุมมอง
                    </h3>
                    <button
                        onClick={() => toggleAnalyticsSection('byAngle')}
                        className={`p-2 rounded-lg transition-colors ${
                            dashboardConfig.theme === 'dark' 
                                ? 'hover:bg-slate-700' 
                                : 'hover:bg-gray-100'
                        }`}
                    >
                        {expandedAnalytics.has('byAngle') ? 
                            <ChevronUp className={`h-5 w-5 ${
                                dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`} /> : 
                            <ChevronDown className={`h-5 w-5 ${
                                dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`} />
                        }
                    </button>
                </div>

                {expandedAnalytics.has('byAngle') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {(evaluationMetrics?.byAngle || []).map((angle, index) => {
                            const getAngleText = (angleKey: string) => {
                                switch (angleKey) {
                                    case 'self': return 'ประเมินตนเอง';
                                    case 'top': return 'องศาบน';
                                    case 'bottom': return 'องศาล่าง';
                                    case 'left': return 'องศาซ้าย';
                                    case 'right': return 'องศาขวา';
                                    default: return angleKey;
                                }
                            };

                            const getAngleColor = (angleKey: string) => {
                                switch (angleKey) {
                                    case 'self': return 'from-gray-500 to-gray-600';
                                    case 'top': return 'from-blue-500 to-blue-600';
                                    case 'bottom': return 'from-green-500 to-green-600';
                                    case 'left': return 'from-yellow-500 to-yellow-600';
                                    case 'right': return 'from-purple-500 to-purple-600';
                                    default: return 'from-gray-500 to-gray-600';
                                }
                            };

                            return (
                                <div
                                    key={index}
                                    className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${
                                        dashboardConfig.theme === 'dark'
                                            ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                    } shadow-lg hover:shadow-xl`}
                                >
                                    <div className="text-center">
                                        <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br ${getAngleColor(angle.angle)} flex items-center justify-center`}>
                                            <span className="text-white font-bold text-lg">
                                                {angle.angle.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <h4 className={`text-sm font-bold mb-2 ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                        }`}>
                                            {getAngleText(angle.angle)}
                                        </h4>
                                        <div className={`text-2xl font-bold mb-1 ${getScoreColor(angle?.averageScore || 0)}`}>
                                            {(angle?.averageScore || 0).toFixed(2)}
                                        </div>
                                        <div className={`text-xs ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            {angle?.completed || 0}/{angle?.total || 0} คน
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Trends */}
            <div className={`rounded-2xl p-6 ${
                dashboardConfig.theme === 'dark' 
                    ? 'bg-slate-800/50 border border-slate-700' 
                    : 'bg-white border border-gray-200'
            } shadow-xl backdrop-blur-sm`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-2xl font-bold ${
                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                        แนวโน้มการประเมิน (12 เดือนล่าสุด)
                    </h3>
                    <button
                        onClick={() => toggleAnalyticsSection('trends')}
                        className={`p-2 rounded-lg transition-colors ${
                            dashboardConfig.theme === 'dark' 
                                ? 'hover:bg-slate-700' 
                                : 'hover:bg-gray-100'
                        }`}
                    >
                        {expandedAnalytics.has('trends') ? 
                            <ChevronUp className={`h-5 w-5 ${
                                dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`} /> : 
                            <ChevronDown className={`h-5 w-5 ${
                                dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`} />
                        }
                    </button>
                </div>

                {expandedAnalytics.has('trends') && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {(evaluationMetrics?.trends || []).map((trend, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${
                                    dashboardConfig.theme === 'dark'
                                        ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                } shadow-lg hover:shadow-xl`}
                            >
                                <div className="text-center">
                                    <div className={`text-xs font-medium mb-2 ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        {trend.month_name || new Date(trend.date).toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })}
                                    </div>
                                    <div className={`text-lg font-bold mb-1 ${getScoreColor(trend?.averageScore || 0)}`}>
                                        {(trend?.averageScore || 0).toFixed(2)}
                                    </div>
                                    <div className={`text-xs ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        {trend?.completions || 0} การประเมิน
                                    </div>
                                    {trend.target && (
                                        <div className={`text-xs mt-1 ${
                                            (trend?.averageScore || 0) >= trend.target 
                                                ? 'text-green-600' 
                                                : 'text-red-600'
                                        }`}>
                                            เป้าหมาย: {trend.target}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Reports View Component
const ReportsView: React.FC<{
    filteredResults: any[];
    dashboardConfig: DashboardConfig;
    viewMode: string;
    getScoreColor: (score: number) => string;
    getCompletionColor: (rate: number) => string;
    setSelectedUser: (id: number) => void;
    setShowIndividualReport: (show: boolean) => void;
    showEvaluateeDetailsModal: (id: number) => void;
}> = ({ 
    filteredResults, 
    dashboardConfig, 
    viewMode, 
    getScoreColor, 
    getCompletionColor,
    setSelectedUser,
    setShowIndividualReport,
    showEvaluateeDetailsModal
}) => {
    return (
        <div className="space-y-8">
            <h2 className={`text-3xl font-bold ${
                dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
            }`}>
                รายงานประเมินรายบุคคล
            </h2>

            {viewMode === 'table' && (
                <div className={`rounded-2xl overflow-hidden ${
                    dashboardConfig.theme === 'dark' 
                        ? 'bg-slate-800/50 border border-slate-700' 
                        : 'bg-white border border-gray-200'
                } shadow-xl`}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={`${
                                dashboardConfig.theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'
                            }`}>
                                <tr>
                                    <th className={`px-6 py-4 text-left text-sm font-semibold ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                    }`}>
                                        ชื่อ-นามสกุล
                                    </th>
                                    <th className={`px-6 py-4 text-left text-sm font-semibold ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                    }`}>
                                        ตำแหน่ง
                                    </th>
                                    <th className={`px-6 py-4 text-left text-sm font-semibold ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                    }`}>
                                        หน่วยงาน
                                    </th>
                                    <th className={`px-6 py-4 text-center text-sm font-semibold ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                    }`}>
                                        คะแนนเฉลี่ย
                                    </th>
                                    <th className={`px-6 py-4 text-center text-sm font-semibold ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                    }`}>
                                        ถูกประเมิน
                                    </th>
                                    <th className={`px-6 py-4 text-center text-sm font-semibold ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                    }`}>
                                        ประเมินผู้อื่น
                                    </th>
                                    <th className={`px-6 py-4 text-center text-sm font-semibold ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                    }`}>
                                        จัดการ
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {filteredResults.map((result) => (
                                    <tr key={result.id} className={`hover:${
                                        dashboardConfig.theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-50'
                                    } transition-colors`}>
                                        <td className={`px-6 py-4 ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                        }`}>
                                            <div className="font-medium">{result?.evaluateeName || 'N/A'}</div>
                                            <div className={`text-sm ${
                                                dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                                {result?.evaluateeGrade ? getGradeLabel(result.evaluateeGrade) : 'N/A'}
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 text-sm ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                        }`}>
                                            {result?.evaluateePosition || 'N/A'}
                                        </td>
                                        <td className={`px-6 py-4 text-sm ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                        }`}>
                                            {result?.evaluateeDivision || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-lg font-bold ${getScoreColor(result?.scores?.average || 0)}`}>
                                                {(result?.scores?.average || 0).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="space-y-1">
                                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    (result?.completionStatus?.completionRate || 0) >= 100 
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300'
                                                        : (result?.completionStatus?.completionRate || 0) >= 75
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                                                            : 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300'
                                                }`}>
                                                    {(result?.completionStatus?.completionRate || 0).toFixed(1)}%
                                                </div>
                                                <div className={`text-xs ${
                                                    dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                }`}>
                                                    <div>{result?.completed_angles || 0}/{result?.available_angles || 5} คน</div>
                                                    <div>{result?.total_answers || 0} คำตอบ</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="space-y-1">
                                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    result?.evaluator_progress?.status === 'completed' 
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300'
                                                        : result?.evaluator_progress?.status === 'nearly_complete'
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                                                            : result?.evaluator_progress?.status === 'in_progress'
                                                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300'
                                                                : result?.evaluator_progress?.status === 'not_started'
                                                                    ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'
                                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300'
                                                }`}>
                                                    {result?.evaluator_progress?.overall_progress_percentage || 0}%
                                                </div>
                                                <div className={`text-xs ${
                                                    dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                }`}>
                                                    {result?.evaluator_progress?.completed_assignments || 0}/{result?.evaluator_progress?.total_assignments || 0} รายการ
                                                </div>
                                                <div className={`text-xs ${
                                                    dashboardConfig.theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                }`}>
                                                    {result?.evaluator_progress?.total_questions_answered || 0}/{result?.evaluator_progress?.total_questions_to_answer || 0} ข้อ
                                                </div>
                                                {/* Mini Progress Bar */}
                                                <div className={`w-16 mx-auto rounded-full h-1 ${
                                                    dashboardConfig.theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'
                                                }`}>
                                                    <div 
                                                        className={`h-1 rounded-full transition-all duration-300 ${
                                                            result?.evaluator_progress?.status === 'completed' 
                                                                ? 'bg-green-500' 
                                                                : result?.evaluator_progress?.status === 'nearly_complete'
                                                                    ? 'bg-blue-500'
                                                                    : result?.evaluator_progress?.status === 'in_progress'
                                                                        ? 'bg-orange-500'
                                                                        : 'bg-red-500'
                                                        }`}
                                                        style={{ 
                                                            width: `${Math.max(result?.evaluator_progress?.overall_progress_percentage || 0, 2)}%` 
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(result.id);
                                                    setShowIndividualReport(true);
                                                }}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    dashboardConfig.theme === 'dark'
                                                        ? 'bg-slate-600 hover:bg-slate-500 text-gray-300'
                                                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                                                }`}
                                                title="ดูรายละเอียด"
                                            >
                                                <Eye className="h-4 w-4 text-gray-300" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {viewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResults.map((result) => (
                        <div
                            key={result.id}
                            className={`p-6 rounded-xl border transition-all duration-300 hover:scale-105 ${
                                dashboardConfig.theme === 'dark'
                                    ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                            } shadow-lg hover:shadow-xl`}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    dashboardConfig.theme === 'dark' ? 'bg-slate-700' : 'bg-blue-100'
                                }`}>
                                    <User className={`h-6 w-6 ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-blue-600'
                                    }`} />
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-semibold ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                    }`}>
                                        {result?.evaluateeName || 'N/A'}
                                    </h3>
                                    <p className={`text-sm ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        {result?.evaluateePosition || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className={`text-sm ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        คะแนนเฉลี่ย
                                    </span>
                                    <span className={`font-bold text-lg ${getScoreColor(result?.scores?.average || 0)}`}>
                                        {(result?.scores?.average || 0).toFixed(2)}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className={`text-sm ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        ถูกประเมิน
                                    </span>
                                    <div className="text-right">
                                        <span className={`font-bold ${getCompletionColor(result?.completionStatus?.completionRate || 0)}`}>
                                            {(result?.completionStatus?.completionRate || 0).toFixed(1)}%
                                        </span>
                                        <div className={`text-xs ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                                        }`}>
                                            <div>{result?.completed_angles || 0}/{result?.available_angles || 5} คน</div>
                                            <div>{result?.total_answers || 0} คำตอบ</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={`w-full rounded-full h-2 ${
                                    dashboardConfig.theme === 'dark' ? 'bg-slate-600' : 'bg-gray-200'
                                }`}>
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${result?.completionStatus?.completionRate || 0}%` }}
                                    />
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className={`text-sm ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        ประเมินผู้อื่น
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-bold ${
                                            result?.evaluator_progress?.status === 'completed' 
                                                ? 'text-green-600 dark:text-green-400'
                                                : result?.evaluator_progress?.status === 'nearly_complete'
                                                    ? 'text-blue-600 dark:text-blue-400'
                                                    : result?.evaluator_progress?.status === 'in_progress'
                                                        ? 'text-orange-600 dark:text-orange-400'
                                                        : 'text-red-600 dark:text-red-400'
                                        }`}>
                                            {result?.evaluator_progress?.overall_progress_percentage || 0}%
                                        </span>
                                        <div className={`text-xs ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                                        }`}>
                                            <div>{result?.evaluator_progress?.completed_assignments || 0}/{result?.evaluator_progress?.total_assignments || 0} รายการ</div>
                                            <div>{result?.evaluator_progress?.total_questions_answered || 0}/{result?.evaluator_progress?.total_questions_to_answer || 0} ข้อ</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={`w-full rounded-full h-2 ${
                                    dashboardConfig.theme === 'dark' ? 'bg-slate-600' : 'bg-gray-200'
                                }`}>
                                    <div
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            result?.evaluator_progress?.status === 'completed' 
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                                : result?.evaluator_progress?.status === 'nearly_complete'
                                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                                    : result?.evaluator_progress?.status === 'in_progress'
                                                        ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                                                        : 'bg-gradient-to-r from-red-500 to-pink-500'
                                        }`}
                                        style={{ width: `${Math.max(result?.evaluator_progress?.overall_progress_percentage || 0, 2)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedUser(result.id);
                                        setShowIndividualReport(true);
                                    }}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                                        dashboardConfig.theme === 'dark'
                                            ? 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    }`}
                                >
                                    ดูรายงาน
                                </button>
                                <button
                                    onClick={() => showEvaluateeDetailsModal(result.id)}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                                        dashboardConfig.theme === 'dark'
                                            ? 'bg-purple-700 hover:bg-purple-600 text-gray-300'
                                            : 'bg-purple-500 hover:bg-purple-600 text-white'
                                    }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <User className="h-4 w-4" />
                                        รายละเอียด
                                    </div>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Exports View Component
const ExportsView: React.FC<{
    exportOptions: ExportOptions;
    setExportOptions: React.Dispatch<React.SetStateAction<ExportOptions>>;
    handleExport: (type: string) => Promise<void>;
    isExporting: boolean;
    dashboardConfig: DashboardConfig;
    availableDivisions: any[];
    availableGrades: number[];
}> = ({ 
    exportOptions, 
    setExportOptions, 
    handleExport, 
    isExporting, 
    dashboardConfig,
    availableDivisions,
    availableGrades
}) => {
    const exportTypes = [
        {
            id: 'comprehensive',
            title: 'รายงานรวมผู้บริหารและพนักงาน',
            description: 'รายงานครบถ้วนทั้งผู้ว่าการ ระดับ 9-12 และ 5-8 พร้อม Option Mapping',
            icon: Building,
            color: 'emerald'
        },
        {
            id: 'governors',
            title: 'รายงานผู้ว่าการ กนอ. (ระดับ 13)',
            description: 'รายงานเฉพาะผู้ว่าการ ระดับ 13 พร้อมคะแนนถ่วงน้ำหนัก 360 องศา',
            icon: Shield,
            color: 'rose'
        },
        {
            id: 'executives',
            title: 'รายงานผู้บริหารระดับ 9-12',
            description: 'รายงานเฉพาะผู้บริหารระดับ 9-12 พร้อมคำถามและคะแนน',
            icon: Crown,
            color: 'amber'
        },
        {
            id: 'employees', 
            title: 'รายงานพนักงานระดับ 5-8',
            description: 'รายงานเฉพาะพนักงานระดับ 5-8 พร้อมคำถามและคะแนน',
            icon: Users,
            color: 'cyan'
        },
        {
            id: 'self-evaluation',
            title: 'การประเมินตนเอง',
            description: 'รายงานการประเมินตนเองของทุกระดับพร้อมคำถามและคะแนน',
            icon: User,
            color: 'indigo'
        },
        {
            id: 'detailed-data',
            title: 'รายงานรายละเอียดครบถ้วน',
            description: 'ข้อมูลรายละเอียดทุกคำถาม ผู้ประเมิน และผู้ถูกประเมิน',
            icon: Database,
            color: 'violet'
        }
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className={`text-3xl font-bold ${
                    dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                }`}>
                    ส่งออกรายงาน
                </h2>
                
                <div className={`px-4 py-2 rounded-xl ${
                    dashboardConfig.theme === 'dark' 
                        ? 'bg-slate-700 text-gray-300' 
                        : 'bg-blue-100 text-blue-800'
                }`}>
                    <span className="text-sm font-medium">
                        รูปแบบ: {exportOptions.format.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Export Options */}
            <div className={`rounded-2xl p-6 ${
                dashboardConfig.theme === 'dark' 
                    ? 'bg-slate-800/50 border border-slate-700' 
                    : 'bg-white border border-gray-200'
            } shadow-xl`}>
                <h3 className={`text-xl font-bold mb-6 ${
                    dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                }`}>
                    ตั้งค่าการส่งออก
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Format Selection */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${
                            dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            รูปแบบไฟล์
                        </label>
                        <select
                            value={exportOptions.format}
                            onChange={(e) => setExportOptions(prev => ({ 
                                ...prev, 
                                format: e.target.value as 'excel' | 'pdf' | 'csv' 
                            }))}
                            className={`w-full px-3 py-2 rounded-lg border ${
                                dashboardConfig.theme === 'dark'
                                    ? 'bg-slate-700 border-slate-600 text-gray-300'
                                    : 'bg-white border-gray-300 text-gray-900'
                            } focus:ring-2 focus:ring-blue-500/20 focus:outline-none`}
                        >
                            <option value="excel">Excel (.xlsx)</option>
                            <option value="pdf">PDF (.pdf)</option>
                            <option value="csv">CSV (.csv)</option>
                        </select>
                    </div>

                    {/* Date Range */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${
                            dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            ช่วงเวลา
                        </label>
                        <select
                            value={exportOptions.dateRange}
                            onChange={(e) => setExportOptions(prev => ({ 
                                ...prev, 
                                dateRange: e.target.value as 'all' | 'current' | 'custom' 
                            }))}
                            className={`w-full px-3 py-2 rounded-lg border ${
                                dashboardConfig.theme === 'dark'
                                    ? 'bg-slate-700 border-slate-600 text-gray-300'
                                    : 'bg-white border-gray-300 text-gray-900'
                            } focus:ring-2 focus:ring-blue-500/20 focus:outline-none`}
                        >
                            <option value="current">ปีงบประมาณปัจจุบัน</option>
                            <option value="all">ทั้งหมด</option>
                            <option value="custom">กำหนดเอง</option>
                        </select>
                    </div>

                    {/* Report Type */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${
                            dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            ประเภทรายงาน
                        </label>
                        <select
                            value={exportOptions.reportType}
                            onChange={(e) => setExportOptions(prev => ({ 
                                ...prev, 
                                reportType: e.target.value as 'summary' | 'detailed' | 'individual' | 'comparison' 
                            }))}
                            className={`w-full px-3 py-2 rounded-lg border ${
                                dashboardConfig.theme === 'dark'
                                    ? 'bg-slate-700 border-slate-600 text-gray-300'
                                    : 'bg-white border-gray-300 text-gray-900'
                            } focus:ring-2 focus:ring-blue-500/20 focus:outline-none`}
                        >
                            <option value="summary">สรุปภาพรวม</option>
                            <option value="detailed">รายละเอียดแบบเต็ม</option>
                            <option value="individual">รายบุคคล</option>
                            <option value="comparison">เปรียบเทียบ</option>
                        </select>
                    </div>
                </div>

                {/* Additional Options */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={exportOptions.includeCharts}
                            onChange={(e) => setExportOptions(prev => ({ 
                                ...prev, 
                                includeCharts: e.target.checked 
                            }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`text-sm ${
                            dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            รวมกราฟและแผนภูมิ
                        </span>
                    </label>

                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={exportOptions.includeRawData}
                            onChange={(e) => setExportOptions(prev => ({ 
                                ...prev, 
                                includeRawData: e.target.checked 
                            }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`text-sm ${
                            dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            รวมข้อมูลดิบ
                        </span>
                    </label>

                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={exportOptions.onlyCompleted}
                            onChange={(e) => setExportOptions(prev => ({ 
                                ...prev, 
                                onlyCompleted: e.target.checked 
                            }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`text-sm ${
                            dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            เฉพาะผู้ทำครบแล้ว
                        </span>
                    </label>
                </div>
            </div>

            {/* Export Templates */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exportTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                        <div
                            key={type.id}
                            className={`p-6 rounded-xl border transition-all duration-300 hover:scale-105 ${
                                dashboardConfig.theme === 'dark'
                                    ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                            } shadow-lg hover:shadow-xl`}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${type.color}-100`}>
                                    <Icon className={`h-6 w-6 text-${type.color}-600 text-gray-600`} />
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-semibold ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                    }`}>
                                        {type.title}
                                    </h3>
                                </div>
                            </div>

                            <p className={`text-sm mb-4 ${
                                dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                {type.description}
                            </p>

                            <button
                                onClick={() => handleExport(type.id)}
                                disabled={isExporting}
                                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                                    dashboardConfig.theme === 'dark'
                                        ? 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                                        : `bg-${type.color}-500 hover:bg-${type.color}-600 text-white`
                                } bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2`}
                            >
                                {isExporting ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
                                ) : (
                                    <Download className="h-4 w-4 text-gray-300" />
                                )}
                                {isExporting ? 'กำลังส่งออก...' : 'ส่งออก'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Export Modal Component
const ExportModal: React.FC<{
    exportOptions: ExportOptions;
    setExportOptions: React.Dispatch<React.SetStateAction<ExportOptions>>;
    handleExport: (type: string) => Promise<void>;
    isExporting: boolean;
    onClose: () => void;
    dashboardConfig: DashboardConfig;
    availableDivisions: any[];
    availableGrades: number[];
}> = ({ 
    exportOptions, 
    setExportOptions, 
    handleExport, 
    isExporting, 
    onClose, 
    dashboardConfig,
    availableDivisions,
    availableGrades
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
                dashboardConfig.theme === 'dark' 
                    ? 'bg-slate-800 border border-slate-700' 
                    : 'bg-white border border-gray-200'
            } shadow-2xl`}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className={`text-2xl font-bold ${
                            dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                        }`}>
                            ตั้งค่าการส่งออกรายงาน
                        </h2>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg transition-colors ${
                                dashboardConfig.theme === 'dark' 
                                    ? 'hover:bg-slate-700 text-gray-300' 
                                    : 'hover:bg-gray-100 text-gray-600'
                            }`}
                        >
                            <X className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Export options form would go here */}
                    <div className="space-y-6">
                        {/* Format Selection */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${
                                dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                รูปแบบไฟล์
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {['excel', 'pdf', 'csv'].map((format) => (
                                    <button
                                        key={format}
                                        onClick={() => setExportOptions(prev => ({ 
                                            ...prev, 
                                            format: format as 'excel' | 'pdf' | 'csv' 
                                        }))}
                                        className={`p-3 rounded-lg border transition-colors ${
                                            exportOptions.format === format
                                                ? dashboardConfig.theme === 'dark'
                                                    ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                                                    : 'bg-blue-100 border-blue-500 text-blue-700'
                                                : dashboardConfig.theme === 'dark'
                                                    ? 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'
                                                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        {format.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => handleExport('advanced')}
                                disabled={isExporting}
                                className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isExporting ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                                ) : (
                                    <Download className="h-5 w-5 text-gray-300" />
                                )}
                                {isExporting ? 'กำลังส่งออก...' : 'ส่งออกรายงาน'}
                            </button>
                            
                            <button
                                onClick={onClose}
                                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                                    dashboardConfig.theme === 'dark'
                                        ? 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                }`}
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Evaluatee Details Modal Component
const EvaluateeDetailsModal: React.FC<{
    evaluateeId: number;
    evaluateeData: any;
    isLoading: boolean;
    fiscalYear: string;
    onClose: () => void;
    dashboardConfig: DashboardConfig;
}> = ({ evaluateeId, evaluateeData, isLoading, fiscalYear, onClose, dashboardConfig }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
                dashboardConfig.theme === 'dark' 
                    ? 'bg-slate-800 border border-slate-700' 
                    : 'bg-white border border-gray-200'
            } shadow-2xl`}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className={`text-2xl font-bold ${
                            dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                        }`}>
                            รายละเอียดผู้ถูกประเมิน
                        </h2>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg hover:${
                                dashboardConfig.theme === 'dark' ? 'bg-slate-700' : 'bg-gray-100'
                            } transition-colors`}
                        >
                            <X className={`h-6 w-6 ${
                                dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`} />
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className={`h-8 w-8 animate-spin ${
                                dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-blue-600'
                            }`} />
                            <span className={`ml-3 ${
                                dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                                กำลังโหลดข้อมูล...
                            </span>
                        </div>
                    ) : evaluateeData ? (
                        <div className="space-y-6">
                            {/* Personal Information */}
                            <div className={`p-4 rounded-xl ${
                                dashboardConfig.theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-50'
                            }`}>
                                <h3 className={`text-lg font-semibold mb-4 ${
                                    dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                }`}>
                                    ข้อมูลส่วนตัว
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`text-sm font-medium ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            รหัสพนักงาน
                                        </label>
                                        <p className={`text-lg ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                        }`}>
                                            {evaluateeData.user?.emid || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className={`text-sm font-medium ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            ชื่อ-นามสกุล
                                        </label>
                                        <p className={`text-lg ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                        }`}>
                                            {evaluateeData.user?.name || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className={`text-sm font-medium ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            ระดับ
                                        </label>
                                        <p className={`text-lg ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                        }`}>
                                            C{evaluateeData.user?.grade || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className={`text-sm font-medium ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            หน่วยงาน
                                        </label>
                                        <p className={`text-lg ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                        }`}>
                                            {evaluateeData.user?.division || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className={`text-sm font-medium ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            ตำแหน่ง
                                        </label>
                                        <p className={`text-lg ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                        }`}>
                                            {evaluateeData.user?.position || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Evaluation Progress */}
                            <div className={`p-4 rounded-xl ${
                                dashboardConfig.theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-50'
                            }`}>
                                <h3 className={`text-lg font-semibold mb-4 ${
                                    dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                }`}>
                                    สถานะการประเมิน
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                                            dashboardConfig.theme === 'dark' ? 'bg-green-900' : 'bg-green-100'
                                        }`}>
                                            <CheckCircle className={`h-8 w-8 ${
                                                dashboardConfig.theme === 'dark' ? 'text-green-400' : 'text-green-600'
                                            }`} />
                                        </div>
                                        <p className={`mt-2 text-sm font-medium ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            เสร็จสิ้น
                                        </p>
                                        <p className={`text-2xl font-bold ${
                                            dashboardConfig.theme === 'dark' ? 'text-green-400' : 'text-green-600'
                                        }`}>
                                            {evaluateeData.completion_data?.completed_angles || 0}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                                            dashboardConfig.theme === 'dark' ? 'bg-orange-900' : 'bg-orange-100'
                                        }`}>
                                            <Clock className={`h-8 w-8 ${
                                                dashboardConfig.theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                                            }`} />
                                        </div>
                                        <p className={`mt-2 text-sm font-medium ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            คงเหลือ
                                        </p>
                                        <p className={`text-2xl font-bold ${
                                            dashboardConfig.theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                                        }`}>
                                            {(evaluateeData.completion_data?.total_angles || 5) - (evaluateeData.completion_data?.completed_angles || 0)}
                                        </p>
                                        <p className={`text-xs mt-1 ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                                        }`}>
                                            มุมการประเมิน
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                                            dashboardConfig.theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'
                                        }`}>
                                            <Target className={`h-8 w-8 ${
                                                dashboardConfig.theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                            }`} />
                                        </div>
                                        <p className={`mt-2 text-sm font-medium ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            ความสำเร็จ
                                        </p>
                                        <p className={`text-2xl font-bold ${
                                            dashboardConfig.theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                        }`}>
                                            {Math.round(evaluateeData.completion_data?.completion_rate || 0)}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Remaining Evaluations as Evaluator */}
                            <div className={`p-4 rounded-xl ${
                                dashboardConfig.theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-50'
                            }`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-2 rounded-lg ${
                                        dashboardConfig.theme === 'dark' ? 'bg-red-900' : 'bg-red-100'
                                    }`}>
                                        <FileText className={`h-5 w-5 ${
                                            dashboardConfig.theme === 'dark' ? 'text-red-400' : 'text-red-600'
                                        }`} />
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-semibold ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                        }`}>
                                            การประเมินที่ต้องทำ
                                        </h3>
                                        <p className={`text-sm ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            รายการการประเมินที่บุคคลนี้ต้องทำในฐานะผู้ประเมิน
                                        </p>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="mb-4 text-center">
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                                        (evaluateeData.completion_data?.remaining_evaluations || 0) > 0
                                            ? (dashboardConfig.theme === 'dark' ? 'bg-red-900 text-red-400' : 'bg-red-100 text-red-700')
                                            : (dashboardConfig.theme === 'dark' ? 'bg-green-900 text-green-400' : 'bg-green-100 text-green-700')
                                    }`}>
                                        <span className="text-2xl font-bold">
                                            {evaluateeData.remaining_evaluations_detail?.filter((item: any) => !item.is_completed).length || 0}
                                        </span>
                                        <span className="text-sm font-medium">
                                            {(evaluateeData.remaining_evaluations_detail?.filter((item: any) => !item.is_completed).length || 0) === 0 ? 'เสร็จแล้ว' : 'ยังไม่เสร็จ'}
                                        </span>
                                    </div>
                                </div>

                                {/* Detailed List */}
                                {evaluateeData.remaining_evaluations_detail && evaluateeData.remaining_evaluations_detail.length > 0 && (
                                    <div className="space-y-3 max-h-60 overflow-y-auto">
                                        {evaluateeData.remaining_evaluations_detail.map((evaluation: any, index: number) => (
                                            <div key={index} className={`p-3 rounded-lg border ${
                                                evaluation.is_completed 
                                                    ? (dashboardConfig.theme === 'dark' ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200')
                                                    : (dashboardConfig.theme === 'dark' ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-200')
                                            }`}>
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className={`font-medium ${
                                                                dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                                            }`}>
                                                                {evaluation.evaluatee_name}
                                                            </h4>
                                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                                evaluation.angle === 'self' ? 'bg-gray-500 text-white' :
                                                                evaluation.angle === 'top' ? 'bg-blue-500 text-white' :
                                                                evaluation.angle === 'bottom' ? 'bg-green-500 text-white' :
                                                                evaluation.angle === 'left' ? 'bg-yellow-500 text-white' :
                                                                'bg-purple-500 text-white'
                                                            }`}>
                                                                {evaluation.angle === 'self' ? 'ตนเอง' :
                                                                 evaluation.angle === 'top' ? 'บน' :
                                                                 evaluation.angle === 'bottom' ? 'ล่าง' :
                                                                 evaluation.angle === 'left' ? 'ซ้าย' : 'ขวา'}
                                                            </span>
                                                        </div>
                                                        <p className={`text-sm ${
                                                            dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                                        }`}>
                                                            {evaluation.position} • {evaluation.division}
                                                        </p>
                                                        <p className={`text-xs mt-1 ${
                                                            dashboardConfig.theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                                                        }`}>
                                                            รหัส: {evaluation.evaluatee_emid}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`text-lg font-bold ${
                                                            evaluation.is_completed 
                                                                ? (dashboardConfig.theme === 'dark' ? 'text-green-400' : 'text-green-600')
                                                                : (dashboardConfig.theme === 'dark' ? 'text-orange-400' : 'text-orange-600')
                                                        }`}>
                                                            {evaluation.completion_percentage}%
                                                        </div>
                                                        <div className={`text-xs ${
                                                            dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                        }`}>
                                                            {evaluation.answered_questions}/{evaluation.total_questions} ข้อ
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Progress Bar */}
                                                <div className="mt-2">
                                                    <div className={`w-full rounded-full h-2 ${
                                                        dashboardConfig.theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'
                                                    }`}>
                                                        <div 
                                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                                evaluation.is_completed 
                                                                    ? 'bg-green-500' 
                                                                    : evaluation.completion_percentage > 0 
                                                                        ? 'bg-orange-500' 
                                                                        : 'bg-red-500'
                                                            }`}
                                                            style={{ width: `${Math.max(evaluation.completion_percentage, 2)}%` }}
                                                        />
                                                    </div>
                                                    <div className={`text-xs mt-1 ${
                                                        dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                    }`}>
                                                        ความคืบหน้าในการประเมิน: {evaluation.completion_percentage}%
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* No evaluations message */}
                                {(!evaluateeData.remaining_evaluations_detail || evaluateeData.remaining_evaluations_detail.length === 0) && (
                                    <div className={`text-center py-4 ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                        ไม่มีการประเมินที่ต้องทำ
                                    </div>
                                )}
                            </div>

                            {/* Evaluation Scores */}
                            <div className={`p-4 rounded-xl ${
                                dashboardConfig.theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-50'
                            }`}>
                                <h3 className={`text-lg font-semibold mb-4 ${
                                    dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                }`}>
                                    คะแนนการประเมิน
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {Object.entries({
                                        'self': 'ประเมินตนเอง',
                                        'top': 'ผู้บังคับบัญชา',
                                        'bottom': 'ผู้ใต้บังคับบัญชา',
                                        'left': 'เพื่อนร่วมงาน (ซ้าย)',
                                        'right': 'เพื่อนร่วมงาน (ขวา)'
                                    }).map(([key, label]) => (
                                        <div key={key} className={`p-3 rounded-lg ${
                                            dashboardConfig.theme === 'dark' ? 'bg-slate-600' : 'bg-white'
                                        }`}>
                                            <p className={`text-sm font-medium ${
                                                dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                                {label}
                                            </p>
                                            <p className={`text-xl font-bold ${
                                                dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                            }`}>
                                                {evaluateeData.scores?.[key]?.toFixed(2) || 'N/A'}
                                            </p>
                                        </div>
                                    ))}
                                    <div className={`p-3 rounded-lg border-2 ${
                                        dashboardConfig.theme === 'dark' 
                                            ? 'bg-slate-600 border-purple-500' 
                                            : 'bg-purple-50 border-purple-200'
                                    }`}>
                                        <p className={`text-sm font-medium ${
                                            dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            คะแนนเฉลี่ย
                                        </p>
                                        <p className={`text-xl font-bold ${
                                            dashboardConfig.theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                                        }`}>
                                            {evaluateeData.scores?.average?.toFixed(2) || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Evaluators List */}
                            {evaluateeData.evaluators && evaluateeData.evaluators.length > 0 && (
                                <div className={`p-4 rounded-xl ${
                                    dashboardConfig.theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-50'
                                }`}>
                                    <h3 className={`text-lg font-semibold mb-4 ${
                                        dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                    }`}>
                                        รายชื่อผู้ประเมิน
                                    </h3>
                                    <div className="space-y-3">
                                        {evaluateeData.evaluators.map((evaluator: any, index: number) => (
                                            <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                                                dashboardConfig.theme === 'dark' ? 'bg-slate-600' : 'bg-white'
                                            }`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                                        evaluator.completed 
                                                            ? (dashboardConfig.theme === 'dark' ? 'bg-green-900 text-green-400' : 'bg-green-100 text-green-700')
                                                            : (dashboardConfig.theme === 'dark' ? 'bg-orange-900 text-orange-400' : 'bg-orange-100 text-orange-700')
                                                    }`}>
                                                        {evaluator.completed ? '✓' : '!'}
                                                    </div>
                                                    <div>
                                                        <p className={`font-medium ${
                                                            dashboardConfig.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                                        }`}>
                                                            {evaluator.name}
                                                        </p>
                                                        <p className={`text-sm ${
                                                            dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                                        }`}>
                                                            มุม: {evaluator.angle === 'self' ? 'ประเมินตนเอง' :
                                                                evaluator.angle === 'top' ? 'ผู้บังคับบัญชา' :
                                                                evaluator.angle === 'bottom' ? 'ผู้ใต้บังคับบัญชา' :
                                                                evaluator.angle === 'left' ? 'เพื่อนร่วมงาน (ซ้าย)' :
                                                                'เพื่อนร่วมงาน (ขวา)'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {evaluator.completed ? (
                                                        <>
                                                            <p className={`font-bold ${
                                                                dashboardConfig.theme === 'dark' ? 'text-green-400' : 'text-green-600'
                                                            }`}>
                                                                {evaluator.score?.toFixed(2) || 'N/A'}
                                                            </p>
                                                            <p className={`text-xs ${
                                                                dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                            }`}>
                                                                {evaluator.submittedAt ? new Date(evaluator.submittedAt).toLocaleDateString('th-TH') : ''}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                            dashboardConfig.theme === 'dark' 
                                                                ? 'bg-orange-900 text-orange-400' 
                                                                : 'bg-orange-100 text-orange-700'
                                                        }`}>
                                                            ยังไม่ประเมิน
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={`text-center py-12 ${
                            dashboardConfig.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                            ไม่พบข้อมูลผู้ถูกประเมิน
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminEvaluationReport;