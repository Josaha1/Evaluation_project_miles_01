/**
 * Utility functions for evaluation report processing
 * Provides data formatting, calculations, and chart configurations
 */

// Type definitions
export interface EvaluationData {
    id: number;
    name: string;
    position: string;
    grade: number;
    division: string;
    user_type: string;
    self: number;
    top: number;
    bottom?: number;
    left: number;
    right?: number;
    average: number;
    rating: number;
    rating_text: string;
    completion_rate: number;
}

export interface ChartDataPoint {
    name: string;
    value: number;
    color?: string;
}

export interface PerformanceLevel {
    level: number;
    text: string;
    color: string;
    bgColor: string;
    minScore: number;
    maxScore: number;
}

// Performance level constants
export const PERFORMANCE_LEVELS: PerformanceLevel[] = [
    { level: 5, text: 'ดีเยี่ยม', color: 'text-green-800', bgColor: 'bg-green-100', minScore: 4.50, maxScore: 5.00 },
    { level: 4, text: 'ดีมาก', color: 'text-blue-800', bgColor: 'bg-blue-100', minScore: 4.00, maxScore: 4.49 },
    { level: 3, text: 'ดี', color: 'text-yellow-800', bgColor: 'bg-yellow-100', minScore: 3.00, maxScore: 3.99 },
    { level: 2, text: 'ควรปรับปรุง', color: 'text-orange-800', bgColor: 'bg-orange-100', minScore: 2.00, maxScore: 2.99 },
    { level: 1, text: 'ต้องปรับปรุงมาก', color: 'text-red-800', bgColor: 'bg-red-100', minScore: 0.00, maxScore: 1.99 },
];

// Color schemes for charts
export const CHART_COLORS = {
    primary: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
    performance: {
        excellent: '#10B981',
        very_good: '#3B82F6',
        good: '#F59E0B',
        fair: '#F97316',
        poor: '#EF4444',
    },
    gradients: {
        blue: 'from-blue-500 to-purple-600',
        green: 'from-green-500 to-blue-600',
        orange: 'from-orange-500 to-red-600',
        purple: 'from-purple-500 to-pink-600',
    }
};

/**
 * Get performance level based on score
 */
export const getPerformanceLevel = (score: number): PerformanceLevel => {
    return PERFORMANCE_LEVELS.find(level => 
        score >= level.minScore && score <= level.maxScore
    ) || PERFORMANCE_LEVELS[4]; // Default to lowest level
};

/**
 * Format score with appropriate color classes
 */
export const getScoreColorClass = (score: number): string => {
    const level = getPerformanceLevel(score);
    return level.color;
};

/**
 * Calculate statistics for a dataset
 */
export const calculateStatistics = (values: number[]) => {
    if (values.length === 0) {
        return {
            mean: 0,
            median: 0,
            mode: 0,
            standardDeviation: 0,
            min: 0,
            max: 0,
            range: 0,
        };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / values.length;

    // Median
    const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    // Mode
    const frequency: Record<number, number> = {};
    values.forEach(val => {
        frequency[val] = (frequency[val] || 0) + 1;
    });
    const mode = Object.keys(frequency).reduce((a, b) => 
        frequency[Number(a)] > frequency[Number(b)] ? a : b
    );

    // Standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    return {
        mean: Number(mean.toFixed(2)),
        median: Number(median.toFixed(2)),
        mode: Number(mode),
        standardDeviation: Number(standardDeviation.toFixed(2)),
        min: Number(min.toFixed(2)),
        max: Number(max.toFixed(2)),
        range: Number(range.toFixed(2)),
    };
};

/**
 * Group data by specified criteria
 */
export const groupDataBy = <T>(
    data: T[],
    keyFn: (item: T) => string
): Record<string, T[]> => {
    return data.reduce((groups, item) => {
        const key = keyFn(item);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {} as Record<string, T[]>);
};

/**
 * Format number for display
 */
export const formatNumber = (
    value: number,
    decimals: number = 2,
    locale: string = 'th-TH'
): string => {
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
};

/**
 * Format percentage for display
 */
export const formatPercentage = (
    value: number,
    decimals: number = 1,
    locale: string = 'th-TH'
): string => {
    return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value / 100);
};

/**
 * Generate export filename
 */
export const generateExportFilename = (
    fiscalYear: string,
    division?: string,
    groupFilter?: string,
    format: string = 'xlsx'
): string => {
    const parts = ['รายงานการประเมิน360องศา'];
    
    // Add fiscal year (Buddhist calendar)
    parts.push(`ปีงบ${parseInt(fiscalYear) + 543}`);
    
    // Add division if specified
    if (division) {
        parts.push(`สายงาน${division}`);
    }
    
    // Add group filter if specified
    if (groupFilter && groupFilter !== 'all') {
        const groupName = groupFilter === '5-8' ? 'พนักงานภายใน5-8' :
                         groupFilter === '9-12' ? 'ผู้บริหาร9-12' : 'กลุ่มเฉพาะ';
        parts.push(groupName);
    } else {
        parts.push('ทุกกลุ่ม');
    }
    
    // Add timestamp
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
    parts.push(timestamp);
    
    return `${parts.join('_')}.${format}`;
};

/**
 * Validate score range
 */
export const isValidScore = (score: number): boolean => {
    return score >= 0 && score <= 5 && !isNaN(score);
};

/**
 * Calculate completion percentage
 */
export const calculateCompletionRate = (completed: number, total: number): number => {
    if (total === 0) return 0;
    return (completed / total) * 100;
};

/**
 * Get trend direction based on current and previous values
 */
export const getTrendDirection = (current: number, previous: number): 'up' | 'down' | 'stable' => {
    const threshold = 0.1; // 10% threshold for "stable"
    const change = ((current - previous) / previous) * 100;
    
    if (Math.abs(change) < threshold) return 'stable';
    return change > 0 ? 'up' : 'down';
};

/**
 * Generate chart configuration for Highcharts
 */
export const generateChartConfig = (type: string, data: any[], options: any = {}) => {
    const baseConfig = {
        chart: {
            type,
            backgroundColor: 'transparent',
            height: options.height || 400,
        },
        title: {
            text: options.title || '',
            style: {
                fontSize: '18px',
                fontWeight: 'bold',
            },
        },
        credits: { enabled: false },
        legend: {
            enabled: options.showLegend !== false,
        },
        plotOptions: {
            [type]: {
                colorByPoint: true,
                colors: CHART_COLORS.primary,
                ...options.plotOptions,
            },
        },
        series: [{
            name: options.seriesName || 'Data',
            data,
        }],
        ...options.customConfig,
    };

    return baseConfig;
};

/**
 * Debounce function for search/filter inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

/**
 * Export data to CSV format
 */
export const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header];
                return typeof value === 'string' ? `"${value}"` : value;
            }).join(',')
        )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Local storage utilities for user preferences
 */
export const storage = {
    set: (key: string, value: any) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
    },
    
    get: <T>(key: string, defaultValue: T): T => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('Failed to read from localStorage:', error);
            return defaultValue;
        }
    },
    
    remove: (key: string) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn('Failed to remove from localStorage:', error);
        }
    },
};