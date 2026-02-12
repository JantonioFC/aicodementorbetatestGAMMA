import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { weekRepository } from '@/lib/repositories/WeekRepository';
import { contentRetriever } from '@/lib/rag/ContentRetriever';
import { TEMPLATE_PROMPT_UNIVERSAL, SYSTEM_PROMPT } from '@/lib/prompts/LessonPrompts';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const { semanaId, dia, pomodoroIndex } = await req.json();

        const semanaEncontrada = weekRepository.getWeekDetails(semanaId);
        if (!semanaEncontrada) throw new Error(`Semana ${semanaId} no encontrada`);

        const diaData = semanaEncontrada.esquema_diario?.[dia - 1];
        const textoPomodoro = diaData?.pomodoros?.[pomodoroIndex];

        const contexto = {
            tematica_semanal: semanaEncontrada.titulo_semana,
            concepto_del_dia: diaData?.concepto,
            texto_del_pomodoro: textoPomodoro
        };

        const ragContext = contentRetriever.buildPromptContext(semanaId, dia - 1, pomodoroIndex);
        const prompt = `${ragContext}\n\n---\n\n${TEMPLATE_PROMPT_UNIVERSAL
            .replace(/{tematica_semanal}/g, contexto.tematica_semanal)
            .replace(/{concepto_del_dia}/g, contexto.concepto_del_dia || '')
            .replace(/{texto_del_pomodoro}/g, contexto.texto_del_pomodoro || '')}`;

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const result = await model.generateContentStream({
            contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        });

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start', contexto })}\n\n`));
                    let fullText = '';
                    for await (const chunk of result.stream) {
                        const text = chunk.text();
                        fullText += text;
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text, accumulated: fullText.length })}\n\n`));
                    }

                    let parsed: Record<string, unknown> | null = null;
                    try {
                        const jsonMatch = fullText.match(/```json\n?([\s\S]*?)\n?```/);
                        parsed = JSON.parse(jsonMatch ? jsonMatch[1] : fullText);
                    } catch {
                        parsed = { rawContent: fullText };
                    }

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'end', success: true, data: parsed })}\n\n`));
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : String(error);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`));
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ error: message }), { status: 500 });
    }
}
