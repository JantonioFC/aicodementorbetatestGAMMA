import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { weekRepository } from '@/lib/repositories/WeekRepository';
import { contentRetriever } from '@/lib/rag/ContentRetriever';
import { TEMPLATE_PROMPT_UNIVERSAL, SYSTEM_PROMPT } from '@/lib/prompts/LessonPrompts';
import { modelDiscovery } from '@/lib/ai/discovery/ModelDiscovery';

export async function POST(req: NextRequest) {
    try {
        const { semanaId, dia, pomodoroIndex } = await req.json();

        if (!semanaId || !dia || pomodoroIndex === undefined) {
            return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'API Key no configurada' }, { status: 501 });
        }

        // 1. Contexto de la base de datos
        const semanaEncontrada = weekRepository.getWeekDetails(parseInt(semanaId));
        if (!semanaEncontrada) throw new Error('Semana no encontrada');

        const diaData = semanaEncontrada.esquema_diario?.[dia - 1];
        const textoPomodoro = diaData?.pomodoros?.[pomodoroIndex];

        const contexto = {
            tematica_semanal: semanaEncontrada.titulo_semana,
            concepto_del_dia: diaData?.concepto,
            texto_del_pomodoro: textoPomodoro
        };

        // 2. RAG Context
        const ragContext = contentRetriever.buildPromptContext(
            parseInt(semanaId),
            parseInt(dia) - 1,
            parseInt(pomodoroIndex)
        );

        // 3. Prompt
        const prompt = `${ragContext}\n\n---\n\n${TEMPLATE_PROMPT_UNIVERSAL
            .replace(/{tematica_semanal}/g, contexto.tematica_semanal)
            .replace(/{concepto_del_dia}/g, contexto.concepto_del_dia || '')
            .replace(/{texto_del_pomodoro}/g, contexto.texto_del_pomodoro || '')}`;

        // 4. Model Discovery
        const primaryModel = await modelDiscovery.getPrimaryModel();
        if (!primaryModel) throw new Error('No Gemini model found');

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: primaryModel.name });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        });

        const response = await result.response;
        const text = response.text();

        let lessonData;
        try {
            const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
            lessonData = JSON.parse(jsonMatch ? jsonMatch[1] : text);
        } catch {
            lessonData = { title: 'Lección Generada', lesson: text, exercises: [] };
        }

        return NextResponse.json({
            success: true,
            ...lessonData,
            metadata: {
                weekId: semanaId,
                dayNumber: dia,
                pomodoroNumber: pomodoroIndex,
                generatedAt: new Date().toISOString(),
                model: primaryModel.name
            }
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Internal Server Error', message }, { status: 500 });
    }
}
