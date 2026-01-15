'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        getProfile();
    }, []);

    async function getProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push('/login');

        setUser(user);

        const { data, error } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single();

        if (data) setAvatarUrl(data.avatar_url);
        setLoading(false);
    }

    async function uploadAvatar(event: any) {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) throw new Error('Wähle ein Bild aus.');

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload in den Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Öffentliche URL generieren
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. In der Datenbank (profiles Tabelle) speichern
            const { error: updateError } = await supabase
                .from('profiles')
                .upsert({ id: user.id, avatar_url: publicUrl, updated_at: new Date() });

            if (updateError) throw updateError;

            setAvatarUrl(publicUrl);
            alert('Profilbild aktualisiert!');
        } catch (error: any) {
            alert(error.message);
        } finally {
            setUploading(false);
        }
    }

    if (loading) return <div className="h-screen bg-[#0f172a] flex items-center justify-center text-white">MioChat Profil...</div>;

    return (
        <main className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col items-center p-8">
            <div className="max-w-md w-full backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl text-center">

                <h1 className="text-3xl font-black mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                    Dein Look
                </h1>
                <p className="text-slate-500 text-sm mb-10 tracking-widest uppercase font-bold">MioChat Profile</p>

                {/* Die Bild-Vorschau */}
                <div className="relative inline-block group">
                    <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-violet-500/30 shadow-[0_0_50px_rgba(139,92,246,0.3)] bg-slate-800 flex items-center justify-center">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                        ) : (
                            <span className="text-5xl">👤</span>
                        )}
                    </div>

                    {/* Schwebender Upload-Button */}
                    <label className="absolute bottom-1 right-1 bg-violet-600 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:bg-violet-500 transition-all shadow-lg active:scale-90 border-4 border-[#0f172a]">
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={uploadAvatar}
                            disabled={uploading}
                        />
                        <span className="text-xl">{uploading ? '⏳' : '📸'}</span>
                    </label>
                </div>

                <div className="mt-12 space-y-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter mb-1">E-Mail Adresse</p>
                        <p className="text-slate-200">{user.email}</p>
                    </div>

                    <button
                        onClick={() => router.push('/')}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all border border-white/10"
                    >
                        Zurück zum Chat
                    </button>
                </div>
            </div>
        </main>
    );
}