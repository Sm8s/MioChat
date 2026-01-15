'use client';

import { useRouter } from 'next/navigation';

export default function Landing() {
    const router = useRouter();

    return (
        <main className="h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white p-10 text-center">
            <h1 className="text-5xl font-black mb-4">MioChat</h1>
            <p className="text-slate-400 mb-8 max-w-md">Willkommen beim elegantesten Messenger der Zukunft.</p>
            <button
                onClick={() => router.push('/login')}
                className="bg-violet-600 px-8 py-4 rounded-2xl font-bold hover:bg-violet-500 transition-all"
            >
                Loslegen
            </button>
        </main>
    );
}