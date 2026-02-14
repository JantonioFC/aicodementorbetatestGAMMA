import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { weekRepository } from '@/lib/repositories/WeekRepository';
import { contentRetriever } from '@/lib/rag/ContentRetriever';
import { buildLessonPromptMessages } from '@/lib/prompts/LessonPrompts';
import { modelDiscovery } from '@/lib/ai/discovery/ModelDiscovery';

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
        const messages = buildLessonPromptMessages({
            tematica_semanal: contexto.tematica_semanal,
            concepto_del_dia: contexto.concepto_del_dia || '',
            texto_del_pomodoro: contexto.texto_del_pomodoro || ''
        });

        // Convertir mensajes al formato Gemini contents con RAG context inyectado
        const systemMsg = messages.find(m => m.role === 'system');
        const nonSystemMsgs = messages.filter(m => m.role !== 'system');
        const contents = nonSystemMsgs.map(m => ({
            role: m.role === 'assistant' ? 'model' as const : 'user' as const,
            parts: [{ text: m.content }]
        }));
        // Inyectar RAG context en el último mensaje del usuario
        const lastUserIdx = contents.findLastIndex(c => c.role === 'user');
        if (lastUserIdx >= 0) {
            contents[lastUserIdx].parts[0].text = `${ragContext}\n\n---\n\n${contents[lastUserIdx].parts[0].text}`;
        }

        const primaryModel = await modelDiscovery.getPrimaryModel();
        const modelName = primaryModel?.name || 'gemini-2.5-flash';

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemMsg?.content
        });

        const result = await model.generateContentStream({
            contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
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

                    // Parse quiz from ---QUIZ--- separator and send each question as individual event
                    const sepMatch = fullText.match(/\n*---\s*QUIZ\s*---/i);
                    if (sepMatch && sepMatch.index !== undefined) {
                        const quizRaw = fullText.slice(sepMatch.index + sepMatch[0].length).trim();
                        try {
                            const cleaned = quizRaw.replace(/^```json?\s*\n?/, '').replace(/\n?```\s*$/, '');
                            const questions = JSON.parse(cleaned);
                            if (Array.isArray(questions)) {
                                for (const q of questions) {
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'quiz', question: q })}\n\n`));
                                }
                            }
                        } catch { /* quiz parse failed, skip */ }
                    }

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'end' })}\n\n`));
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
