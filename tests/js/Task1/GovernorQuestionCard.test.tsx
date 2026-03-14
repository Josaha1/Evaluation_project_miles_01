import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '../helpers/inertia-mock';
import { QuestionCard } from '@/Components/QuestionCard';

describe('QuestionCard', () => {
    const ratingQuestion = {
        id: 1,
        title: 'ท่านมีความพึงพอใจในการทำงานมากน้อยเพียงใด',
        type: 'rating' as const,
        options: [
            { id: 1, label: 'มากที่สุด', score: 5 },
            { id: 2, label: 'มาก', score: 4 },
            { id: 3, label: 'ปานกลาง', score: 3 },
            { id: 4, label: 'น้อย', score: 2 },
            { id: 5, label: 'น้อยที่สุด', score: 1 },
        ],
    };

    const choiceQuestion = {
        id: 2,
        title: 'เลือกตำแหน่งที่ต้องการ',
        type: 'choice' as const,
        options: [
            { id: 10, label: 'ตัวเลือก A', score: 1 },
            { id: 11, label: 'ตัวเลือก B', score: 2 },
            { id: 12, label: 'ตัวเลือก C', score: 3 },
        ],
    };

    const openTextQuestion = {
        id: 3,
        title: 'กรุณาให้ข้อเสนอแนะ',
        type: 'open_text' as const,
    };

    it('renders rating question with title', () => {
        const onAnswerChange = vi.fn();
        render(
            <QuestionCard
                question={ratingQuestion}
                answer={undefined}
                onAnswerChange={onAnswerChange}
                questionNumber={1}
            />
        );

        expect(screen.getByText(ratingQuestion.title)).toBeInTheDocument();
    });

    it('renders 5 rating options with score labels', () => {
        const onAnswerChange = vi.fn();
        render(
            <QuestionCard
                question={ratingQuestion}
                answer={undefined}
                onAnswerChange={onAnswerChange}
                questionNumber={1}
            />
        );

        // The rating buttons show score numbers and Thai labels
        expect(screen.getByText('ดีเยี่ยม')).toBeInTheDocument();
        expect(screen.getByText('ดีมาก')).toBeInTheDocument();
        expect(screen.getByText('ดี')).toBeInTheDocument();
        expect(screen.getByText('ต้องปรับปรุง')).toBeInTheDocument();
        expect(screen.getByText('ต้องปรับปรุงอย่างมาก')).toBeInTheDocument();
    });

    it('calls onAnswerChange when rating selected', () => {
        const onAnswerChange = vi.fn();
        render(
            <QuestionCard
                question={ratingQuestion}
                answer={undefined}
                onAnswerChange={onAnswerChange}
                questionNumber={1}
            />
        );

        // Click on score 5 button (ดีเยี่ยม)
        const scoreButton = screen.getByText('5');
        fireEvent.click(scoreButton);

        expect(onAnswerChange).toHaveBeenCalledWith(5);
    });

    it('renders choice question with options', () => {
        const onAnswerChange = vi.fn();
        render(
            <QuestionCard
                question={choiceQuestion}
                answer={undefined}
                onAnswerChange={onAnswerChange}
                questionNumber={2}
            />
        );

        expect(screen.getByText('ตัวเลือก A')).toBeInTheDocument();
        expect(screen.getByText('ตัวเลือก B')).toBeInTheDocument();
        expect(screen.getByText('ตัวเลือก C')).toBeInTheDocument();
    });

    it('renders open text question with textarea', () => {
        const onAnswerChange = vi.fn();
        render(
            <QuestionCard
                question={openTextQuestion}
                answer={undefined}
                onAnswerChange={onAnswerChange}
                questionNumber={3}
            />
        );

        expect(screen.getByPlaceholderText('กรุณาใส่คำตอบของคุณ...')).toBeInTheDocument();
    });

    it('shows question number', () => {
        const onAnswerChange = vi.fn();
        render(
            <QuestionCard
                question={ratingQuestion}
                answer={undefined}
                onAnswerChange={onAnswerChange}
                questionNumber={7}
            />
        );

        expect(screen.getByText('7')).toBeInTheDocument();
    });
});
