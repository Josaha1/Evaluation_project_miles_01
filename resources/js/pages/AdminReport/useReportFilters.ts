import { useState, useMemo } from 'react';
import type { DetailedResult, FilterState } from './types';

export function useReportFilters(detailedResults: DetailedResult[]) {
    const [search, setSearch] = useState('');
    const [division, setDivision] = useState('');
    const [grade, setGrade] = useState('');
    const [externalOrg, setExternalOrg] = useState('');

    const filters: FilterState = { search, division, grade, externalOrg };

    const filteredResults = useMemo(() => {
        return detailedResults.filter((result) => {
            // Search filter: case-insensitive match on evaluateeName
            if (search && !result.evaluateeName.toLowerCase().includes(search.toLowerCase())) {
                return false;
            }

            // Division filter: exact match on evaluateeDivision
            if (division && result.evaluateeDivision !== division) {
                return false;
            }

            // Grade filter: match evaluateeGrade as string
            if (grade && result.evaluateeGrade.toString() !== grade) {
                return false;
            }

            return true;
        });
    }, [detailedResults, search, division, grade]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (search) count++;
        if (division) count++;
        if (grade) count++;
        if (externalOrg) count++;
        return count;
    }, [search, division, grade, externalOrg]);

    const clearAll = () => {
        setSearch('');
        setDivision('');
        setGrade('');
        setExternalOrg('');
    };

    return {
        filters,
        setters: {
            setSearch,
            setDivision,
            setGrade,
            setExternalOrg,
            clearAll,
        },
        filteredResults,
        activeFilterCount,
    };
}
