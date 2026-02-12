'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon, PlayIcon } from '@heroicons/react/24/solid';
import { Analytics } from '@/lib/analytics';

export default function ChallengeClient() {
    const router = useRouter();
    const [code, setCode] = useState('def greet(name):\n    print "Hello " + name  # FIXME: Syntax Error here!');
    const [output, setOutput] = useState('');
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
    const [attempts, setAttempts] = useState(0);

    useEffect(() => {
        Analytics.track('challenge_viewed', { referrer: typeof document !== 'undefined' ? document.referrer : '' });
    }, []);

    const handleRun = () => {
        setStatus('running');
        setOutput('Running python3 script.py...');
        setAttempts(prev => prev + 1);

        Analytics.track('challenge_attempt_run', {
            code_length: code.length,
            attempt_number: attempts + 1
        });

        setTimeout(() => {
            const isFixed = /print\s*\(.+\)/.test(code);
            if (isFixed) {
                setStatus('success');
                setOutput('Hello World\n\n✅ TEST PASSED: Syntax verified.');
                Analytics.track('challenge_success', { attempts_needed: attempts + 1 });
                setTimeout(() => {
                    Analytics.track('redirecting_to_signup');
                    router.push('/signup?ref=challenge_passed');
                }, 1500);
            } else {
                setStatus('error');
                setOutput('File "script.py", line 2\n    print "Hello " + name\n          ^\nSyntaxError: Missing parentheses in call to "print".');
                Analytics.track('challenge_failed', { error_type: 'SyntaxError' });
            }
        }, 800);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6 text-white font-sans selection:bg-indigo-500/30">
            <div className="max-w-5xl w-full bg-[#121216] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden flex flex-col md:flex-row h-[700px]">

                {/* Left column: Challenge Context */}
                <div className="md:w-[320px] p-10 bg-[#16161c] border-r border-white/5 flex flex-col justify-between">
                    <div>
                        <div className="mb-8">
                            <span className="px-3 py-1 bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-500/20">
                                Lvl 01: Firewall
                            </span>
                        </div>
                        <h1 className="text-4xl font-black mb-4 bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">Fix the Bug</h1>
                        <p className="text-gray-400 leading-relaxed text-sm">
                            Solo los humanos que dominan la sintaxis pueden entrar aquí.
                            <br /><br />
                            Corrige el error de <strong>Python 3</strong> para desbloquear tu acceso al mentor.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-2 items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            Critical Exception Found
                        </div>
                        <p className="font-mono text-[10px] text-red-400/80">Exception: SyntaxError at 0x4f82</p>
                    </div>
                </div>

                {/* Right column: IDE experience */}
                <div className="flex-1 flex flex-col">
                    {/* Tab bar */}
                    <div className="bg-[#0c0c0e] px-6 py-4 border-b border-white/5 flex justify-between items-center">
                        <div className="flex gap-4">
                            <span className="text-[10px] font-bold text-indigo-400 border-b border-indigo-400 pb-4 -mb-4">main.py</span>
                            <span className="text-[10px] font-bold text-gray-600 opacity-40">config.json</span>
                        </div>
                        <span className="text-[10px] font-black text-gray-500">PY3.12</span>
                    </div>

                    <div className="flex-1 relative bg-[#0a0a0c]">
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            spellCheck={false}
                            className="w-full h-full p-8 font-mono text-sm bg-transparent text-gray-300 resize-none focus:outline-none"
                        />
                    </div>

                    {/* Console */}
                    <div className={`h-[200px] border-t border-white/5 p-8 font-mono text-xs transition-all ${status === 'error' ? 'bg-red-500/5' : status === 'success' ? 'bg-emerald-500/5' : 'bg-[#08080a]'
                        }`}>
                        {status === 'running' && <div className="text-indigo-400 animate-pulse mb-2">[$] Executing unit tests...</div>}
                        {output && (
                            <div className={status === 'error' ? 'text-red-400' : status === 'success' ? 'text-emerald-400' : 'text-gray-500'}>
                                {output}
                            </div>
                        )}
                        {status === 'idle' && <div className="text-gray-600">Espereando ejecución...</div>}
                    </div>

                    {/* Footer Action */}
                    <div className="bg-[#121216] p-6 border-t border-white/5 flex justify-between items-center">
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Intentos: {attempts}</p>
                        <button
                            onClick={handleRun}
                            disabled={status === 'running' || status === 'success'}
                            className={`flex gap-3 items-center px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${status === 'success'
                                    ? 'bg-emerald-500 text-black'
                                    : 'bg-indigo-600 text-white hover:bg-white hover:text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                                } disabled:opacity-50`}
                        >
                            {status === 'success' ? (
                                <><CheckCircleIcon className="w-4 h-4" /> Entry Granted</>
                            ) : (
                                <><PlayIcon className="w-4 h-4" /> Run Protocol</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
