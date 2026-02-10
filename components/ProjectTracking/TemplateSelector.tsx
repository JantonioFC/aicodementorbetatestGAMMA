'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllTemplates, getTemplatesByCategory } from '../../lib/templates';
import { Template } from '../../types/templates';

interface TemplateSelectorProps {
    className?: string;
}

export default function TemplateSelector({ className = '' }: TemplateSelectorProps) {
    const router = useRouter();
    const [templates, setTemplates] = useState<Record<string, Template> | null>(null);
    const [categories, setCategories] = useState<Record<string, string[]> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const all = getAllTemplates();
        const cats = getTemplatesByCategory();
        setTemplates(all);
        setCategories(cats);
        setLoading(false);
    }, []);

    const handleSelect = (type: string) => {
        router.push(`/plantillas/crear?type=${type}`);
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Cargando plantillas...</div>;
    if (!templates || !categories) return null;

    return (
        <div className={className}>
            {Object.entries(categories).map(([cat, types]) => (
                <div key={cat} className="mb-12">
                    <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                        {cat}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {types.map(t => {
                            const data = templates[t];
                            if (!data) return null;
                            return (
                                <div
                                    key={t}
                                    onClick={() => handleSelect(t)}
                                    className="bg-white p-6 rounded-2xl border-2 border-gray-100 hover:border-indigo-600 hover:shadow-xl transition-all cursor-pointer group"
                                >
                                    <span className="text-3xl mb-4 block group-hover:scale-110 transition-transform">{data.icon}</span>
                                    <h3 className="font-black text-gray-900 mb-1">{data.name}</h3>
                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3">{data.subtitle}</p>
                                    <p className="text-sm text-gray-500 line-clamp-2">{data.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
