'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth/useAuth';
import { useAPITracking } from '../../contexts/APITrackingContext';
import Quiz from './Quiz';
import HistoryPanel from './HistoryPanel';
import ExportButton from './ExportButton';

interface ProcessedLesson {
    title: string;
    lesson: string;
    exercises: any[];
    metadata: any;
    generatedAt: string;
    inputLength: number;
}

const formatMarkdownContent = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-4 mb-2">{line.replace('### ', '')}</h3>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-6 mb-3">{line.replace('## ', '')}</h2>;
        if (line.startsWith('```')) return null; // Simplified for MVP migration
        return <p key={i} className="mb-2 text-gray-700 leading-relaxed">{line}</p>;
    });
};

export default function SandboxWidget() {
    const { session } = useAuth();
    const { recordAPICall } = useAPITracking();

    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<ProcessedLesson | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentDomain, setCurrentDomain] = useState('programming');

    const STUDY_DOMAINS = [
        { value: 'programming', label: '🖥️ Programación' },
        { value: 'logic', label: '🧠 Lógica' },
        { value: 'databases', label: '🗄️ Bases de Datos' },
        { value: 'math', label: '📐 Matemáticas' }
    ];

    const handleGenerateLesson = async () => {
        if (!inputText.trim() || inputText.length < 50) {
            alert('Mínimo 50 caracteres para procesar.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/sandbox/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customContent: inputText, domain: currentDomain }),
            });

            if (!response.ok) throw new Error('Error en generación');

            const rawData = await response.json();
            setGeneratedContent({
                title: rawData.title || 'Lección Generada',
                lesson: rawData.lesson || '',
                exercises: Array.isArray(rawData.exercises) ? rawData.exercises : [],
                metadata: rawData.sandboxMetadata || {},
                generatedAt: rawData.generatedAt || new Date().toISOString(),
                inputLength: inputText.length
            });

            recordAPICall('sandbox_generation', true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border">
                    <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        🧪 Sandbox de Aprendizaje
                    </h2>

                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-700">🎯 Dominio:</span>
                        <select
                            value={currentDomain}
                            onChange={(e) => setCurrentDomain(e.target.value)}
                            className="border rounded px-3 py-1 text-sm"
                        >
                            {STUDY_DOMAINS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                    </div>

                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="w-full h-48 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Pega aquí documentación, código o conceptos para crear una lección..."
                    />

                    <div className="flex justify-between items-center mt-4">
                        <button
                            onClick={handleGenerateLesson}
                            disabled={isLoading || inputText.length < 50}
                            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                            {isLoading ? 'Generando...' : '⚡ Generar Lección'}
                        </button>
                        {generatedContent && <ExportButton generatedLesson={generatedContent} />}
                    </div>
                </div>

                {generatedContent && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="bg-white rounded-xl shadow p-8 border">
                            <h1 className="text-4xl font-black text-gray-900 mb-6">{generatedContent.title}</h1>
                            <div className="prose max-w-none">{formatMarkdownContent(generatedContent.lesson)}</div>
                        </div>

                        {generatedContent.exercises.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-gray-800">🎯 Ejercicios Interactivos</h3>
                                {generatedContent.exercises.map((ex, i) => <Quiz key={i} exercise={ex} questionNumber={i + 1} />)}
                            </div>
                        )}
                    </div>
                )}

                {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">❌ {error}</div>}
            </div>

            <div className="lg:col-span-1">
                <HistoryPanel onRestoreGeneration={(gen) => {
                    setInputText(gen.custom_content);
                    setGeneratedContent({
                        title: gen.title,
                        lesson: gen.generated_lesson?.lesson || '',
                        exercises: gen.generated_lesson?.exercises || [],
                        metadata: {},
                        generatedAt: gen.created_at,
                        inputLength: gen.custom_content.length
                    });
                }} />
            </div>
        </div>
    );
}
