import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

interface ExerciseAttempt {
    lessonPath: string;
    exerciseId: string;
    code: string;
    language: string;
    result: { results: string[]; errors?: string[]; analysis?: unknown };
}

export async function POST(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');
        const body = await req.json();

        switch (action) {
            case 'execute-code': {
                const { code, language, exerciseId, lessonPath } = body;
                let result;
                if (language === 'javascript') {
                    result = await executeJavaScript(code);
                } else if (language === 'react') {
                    result = await executeReact(code);
                } else {
                    result = { results: [], errors: ['Lenguaje no soportado'] };
                }

                await autoSaveAttempt({ lessonPath, exerciseId, code, language, result });
                return NextResponse.json({ success: true, result });
            }

            case 'check-solution': {
                const { userCode, exerciseDescription, language } = body;
                const feedback = await checkSolutionWithAI(userCode, exerciseDescription, language);
                return NextResponse.json({ success: true, feedback });
            }

            default:
                return NextResponse.json({ error: 'Action not valid' }, { status: 400 });
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');
        const lessonPath = searchParams.get('lesson_path');
        const exerciseId = searchParams.get('exercise_id');

        if (action === 'get-exercise-history' && lessonPath && exerciseId) {
            const history = getHistory(lessonPath, exerciseId);
            return NextResponse.json({ success: true, history });
        }
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

async function executeJavaScript(code: string) {
    try {
        const results: string[] = [];
        const errors: string[] = [];
        const sandbox = {
            console: { log: (...args: unknown[]) => results.push(args.map(String).join(' ')), error: (...args: unknown[]) => errors.push(args.map(String).join(' ')) },
            results, errors
        };
        const context = vm.createContext(sandbox);
        vm.runInContext(`try { ${code} } catch(e) { errors.push(e.message); }`, context, { timeout: 1000 });
        return { results, errors };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return { results: [], errors: [message] };
    }
}

async function executeReact(code: string) {
    return { results: ['Análisis superficial: React no ejecutable en servidor sin DOM'], analysis: { isValid: /function|const/.test(code) } };
}

async function checkSolutionWithAI(code: string, desc: string, lang: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return 'API Key missing';
    const prompt = `Evalúa este código:\n${code}\nPara este ejercicio:\n${desc}`;
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await resp.json();
    return data.candidates?.[0].content?.parts?.[0].text || 'Error';
}

async function autoSaveAttempt(data: ExerciseAttempt) {
    const dir = path.join(process.cwd(), 'exports', 'ejercicios');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const file = `${data.lessonPath.replace(/\./g, '_')}_${data.exerciseId}_${Date.now()}.json`;
    fs.writeFileSync(path.join(dir, file), JSON.stringify({ ...data, timestamp: new Date().toISOString() }));
}

function getHistory(lessonPath: string, exerciseId: string) {
    const dir = path.join(process.cwd(), 'exports', 'ejercicios');
    if (!fs.existsSync(dir)) return [];
    const pattern = `${lessonPath.replace(/\./g, '_')}_${exerciseId}_`;
    return fs.readdirSync(dir).filter(f => f.startsWith(pattern)).map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
