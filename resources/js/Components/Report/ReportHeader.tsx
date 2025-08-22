import React from "react";
import { Calendar, Building2, GraduationCap, RefreshCw, Settings } from "lucide-react";

interface ReportHeaderProps {
    fiscalYear: string;
    filters: {
        fiscal_year?: string;
        division?: string;
        grade?: string;
        user_id?: string;
    };
    availableYears: string[];
    availableDivisions: { id: number; name: string }[];
    availableGrades: number[];
    onFiltersChange: (filters: any) => void;
    onRefresh: () => void;
    loading?: boolean;
}

const ReportHeader: React.FC<ReportHeaderProps> = ({
    fiscalYear,
    filters,
    availableYears,
    availableDivisions,
    availableGrades,
    onFiltersChange,
    onRefresh,
    loading = false,
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Settings className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            รายงานการประเมิน 360 องศา
                        </h1>
                        <p className="text-gray-600">
                            ปีงบประมาณ {parseInt(fiscalYear) + 543}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Fiscal Year Filter */}
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <select
                            value={filters.fiscal_year || fiscalYear}
                            onChange={(e) => onFiltersChange({ ...filters, fiscal_year: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {availableYears.map((year) => (
                                <option key={year} value={year}>
                                    {parseInt(year) + 543}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Division Filter */}
                    <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <select
                            value={filters.division || ""}
                            onChange={(e) => onFiltersChange({ ...filters, division: e.target.value || undefined })}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">ทุกสายงาน</option>
                            {availableDivisions.map((division) => (
                                <option key={division.id} value={division.id}>
                                    {division.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Grade Filter */}
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-gray-500" />
                        <select
                            value={filters.grade || ""}
                            onChange={(e) => onFiltersChange({ ...filters, grade: e.target.value || undefined })}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">ทุกระดับ</option>
                            {availableGrades.map((grade) => (
                                <option key={grade} value={grade}>
                                    C{grade}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">รีเฟรช</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportHeader;