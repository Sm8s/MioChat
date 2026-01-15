'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleAuth = async (type: 'LOGIN' | 'SIGNUP') => {
        setLoading(true);
        setError('');

        const { error } = type === 'LOGIN'
            ? await supabase.auth.signInWithPassword({ email, password })
            : await supabase.auth.signUp({ email, password });

        if (error) {
            setError(error.message);
        } else {
            if (type === 'SIGNUP') {
                alert('Check deine E-Mails zur Bestaetigung!');
            } else {
                router.push('/');
            }
        }
        setLoading(false);
    };

    return (
        <main className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Hintergrund-Deko */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-violet-600/20 blur-[100px] rounded-full"></div>

            <div className="max-w-md w-full backdrop-blur-xl bg-white/5 border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative z-10">
                <h1 className="text-3xl font-black text-center mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                    MioChat
                </h1>
                <p className="text-center text-slate-500 text-xs uppercase tracking-widest mb-10 font-bold">Willkommen zurueck</p>

                <div className="space-y-4">
                    <input
                        type="email"
                        placeholder="E-Mail"
                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-violet-500 transition-all text-white"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Passwort"
                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-violet-500 transition-all text-white"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {error && <p className="text-red-400 text-xs text-center bg-red-400/10 py-2 rounded-lg">{error}</p>}

                    <div className="flex flex-col gap-3 pt-4">
                        <button
                            onClick={() => handleAuth('LOGIN')}
                            disabled={loading}
                            className="w-full bg-violet-600 text-white py-4 rounded-2xl font-bold hover:bg-violet-500 transition-all shadow-lg shadow-violet-900/20 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Moment...' : 'Einloggen'}
                        </button>
                        <button
                            onClick={() => handleAuth('SIGNUP')}
                            disabled={loading}
                            className="w-full bg-white/5 text-slate-300 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/5"
                        >
                            Registrieren
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}