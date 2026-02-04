import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CheckCircleIcon, XCircleIcon, PlayIcon } from '@heroicons/react/24/solid';

import { Analytics } from '../lib/analytics';

export default function Challenge() {
    const router = useRouter();
    const [code, setCode] = useState('def greet(name):\n    print "Hello " + name  # FIXME: Syntax Error here!');
    const [output, setOutput] = useState('');
    const [status, setStatus] = useState('idle'); // idle, running, success, error
    const [attempts, setAttempts] = useState(0);

    // Track view on mount
    React.useEffect(() => {
        Analytics.track('challenge_viewed', {
            referrer: document.referrer
        });
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
            // MVP Validation: Check if they added parentheses to print
            // Regex looks for print(...) pattern
            const fixed = /print\s*\(.+\)/.test(code);

            if (fixed) {
                setStatus('success');
                setOutput('Hello World\n\n✅ TEST PASSED: Syntax verified.');

                Analytics.track('challenge_success', {
                    attempts_needed: attempts + 1
                });

                // Auto-redirect after success
                setTimeout(() => {
                    Analytics.track('redirecting_to_signup');
                    router.push('/signup?ref=challenge_passed');
                }, 1500);
            } else {
                setStatus('error');
                setOutput('File "script.py", line 2\n    print "Hello " + name\n          ^\nSyntaxError: Missing parentheses in call to "print". Did you mean print(...)?');

                Analytics.track('challenge_failed', {
                    error_type: 'SyntaxError'
                });
            }
        }, 800);
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans">
            <Head>
                <title>Prove You Are Human (and a Dev)</title>
            </Head>

            <div className="max-w-4xl w-full bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-700">

                {/* Left Panel: Instructions */}
                <div className="p-8 md:w-1/3 bg-gray-800 border-r border-gray-700 flex flex-col justify-between">
                    <div>
                        <div className="mb-6">
                            <span className="inline-block px-3 py-1 bg-red-900/50 text-red-400 text-xs font-mono rounded border border-red-800">
                                CRITICAL_ERROR
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-4">Fix the Bug</h1>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                            We don&apos;t allow bots or non-coders here.
                            <br /><br />
                            Fix the <strong>Python 3</strong> syntax error to unlock access to the platform.
                        </p>
                    </div>

                    <div className="text-xs text-gray-500 font-mono">
                        Error: SyntaxError in main.py
                    </div>
                </div>

                {/* Right Panel: Editor & Console */}
                <div className="md:w-2/3 flex flex-col bg-gray-900">

                    {/* Mock Editor Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 text-xs text-gray-400 font-mono">
                        <div className="flex space-x-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <div>main.py</div>
                        <div>Python 3.10</div>
                    </div>

                    {/* Editor */}
                    <div className="flex-1 relative">
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full h-full bg-gray-900 text-green-400 font-mono p-4 resize-none focus:outline-none"
                            spellCheck="false"
                        />
                    </div>

                    {/* Console Output */}
                    <div className={`h-32 border-t border-gray-800 p-4 font-mono text-sm transition-colors ${status === 'error' ? 'bg-red-900/10' : status === 'success' ? 'bg-green-900/10' : 'bg-black'
                        }`}>
                        {status === 'running' && <div className="text-gray-400 animate-pulse">_ Executing...</div>}
                        {output && <div className={`whitespace-pre-wrap ${status === 'error' ? 'text-red-400' : status === 'success' ? 'text-green-400' : 'text-gray-300'
                            }`}>{output}</div>}
                    </div>

                    {/* Action Bar */}
                    <div className="p-4 border-t border-gray-800 bg-gray-800 flex justify-end">
                        <button
                            onClick={handleRun}
                            disabled={status === 'running' || status === 'success'}
                            className={`flex items-center space-x-2 px-6 py-2 rounded font-bold transition-all ${status === 'success'
                                ? 'bg-green-600 text-white cursor-default'
                                : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-lg active:transform active:scale-95'
                                }`}
                        >
                            {status === 'success' ? (
                                <>
                                    <CheckCircleIcon className="w-5 h-5" />
                                    <span>Access Granted</span>
                                </>
                            ) : (
                                <>
                                    <PlayIcon className="w-5 h-5" />
                                    <span>Run Code</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
