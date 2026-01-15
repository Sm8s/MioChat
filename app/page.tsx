'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import { User, Mail, Calendar, Settings, Camera, Send, X } from 'lucide-react';

export default function MioChat() {
    const [user, setUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [myContacts, setMyContacts] = useState<any[]>([]);
    const [activeChat, setActiveChat] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [showProfile, setShowProfile] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Auto-Scroll nach unten
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return router.push('/landing');

            // Hole das Profil für den User (wegen Username)
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setUser({ ...user, ...profile });
            fetchContacts(user.id);
        };
        init();
    }, []);

    // Realtime Subscription für Nachrichten
    useEffect(() => {
        if (!activeChat || !user) return;

        const channel = supabase
            .channel('realtime_messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${user.id}`
            }, (payload) => {
                if (payload.new.sender_id === activeChat.id) {
                    setMessages((prev) => [...prev, payload.new]);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [activeChat, user]);

    useEffect(scrollToBottom, [messages]);

    const fetchContacts = async (userId: string) => {
        const { data } = await supabase
            .from('contacts')
            .select('status, profiles:contact_id(*)')
            .eq('user_id', userId)
            .neq('status', 'blocked');
        if (data) setMyContacts(data);
    };

    const searchUsers = async () => {
        if (searchQuery.length < 2) return;
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .ilike('username', `%${searchQuery}%`)
            .neq('id', user.id);
        setSearchResults(data || []);
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        const msgObj = {
            sender_id: user.id,
            receiver_id: activeChat.id,
            content: newMessage
        };

        const { error } = await supabase.from('messages').insert(msgObj);
        if (!error) {
            setMessages([...messages, msgObj]);
            setNewMessage('');
        }
    };

    const updateContact = async (contactId: string, status: string) => {
        await supabase.from('contacts').upsert({
            user_id: user.id,
            contact_id: contactId,
            status: status
        });
        fetchContacts(user.id);
        setSearchQuery('');
        setSearchResults([]);
    };

    const fetchMessages = async (receiverId: string) => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true });
        setMessages(data || []);
    };

    useEffect(() => {
        if (activeChat) fetchMessages(activeChat.id);
    }, [activeChat]);

    return (
        <main className="flex h-screen bg-[#070b14] text-slate-200 overflow-hidden font-sans">

            {/* PROFIL MODAL OVERLAY */}
            {showProfile && user && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="h-24 bg-gradient-to-r from-violet-600 to-fuchsia-600 flex justify-end p-4">
                            <button onClick={() => setShowProfile(false)} className="text-white/80 hover:text-white"><X /></button>
                        </div>
                        <div className="px-6 pb-6 text-center">
                            <div className="relative -mt-12 mb-4 inline-block">
                                <img src={user.avatar_url || 'https://via.placeholder.com/150'} className="w-24 h-24 rounded-full border-4 border-[#0f172a] mx-auto object-cover" />
                                <div className="absolute bottom-0 right-0 p-1.5 bg-violet-600 rounded-full border-2 border-[#0f172a]"><Camera size={14} /></div>
                            </div>
                            <h2 className="text-xl font-bold">@{user.username}</h2>
                            <p className="text-slate-400 text-sm mb-6">{user.email}</p>
                            <div className="grid grid-cols-2 gap-3 text-left">
                                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                    <p className="text-[10px] uppercase text-slate-500 font-bold">Status</p>
                                    <p className="text-xs text-emerald-400 font-medium">Online</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                    <p className="text-[10px] uppercase text-slate-500 font-bold">ID</p>
                                    <p className="text-xs font-mono">{user.id.substring(0, 8)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SIDEBAR */}
            <aside className="w-80 bg-[#0f172a]/50 border-r border-white/5 flex flex-col">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">MioChat</h1>
                        <button onClick={() => setShowProfile(true)} className="w-8 h-8 rounded-full overflow-hidden border border-white/20 hover:border-violet-500 transition-colors">
                            <img src={user?.avatar_url || 'https://via.placeholder.com/100'} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <input
                                className="flex-1 bg-white/5 border border-white/10 p-2.5 rounded-xl text-sm outline-none focus:border-violet-500 transition-all"
                                placeholder="User suchen..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button onClick={searchUsers} className="bg-violet-600 px-4 rounded-xl text-xs font-bold hover:bg-violet-500 transition-colors">Find</button>
                        </div>

                        {searchResults.length > 0 && (
                            <div className="bg-slate-800 rounded-xl p-2 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-2">
                                {searchResults.map(u => (
                                    <div key={u.id} className="flex justify-between items-center p-2 border-b border-white/5 last:border-0">
                                        <span className="text-xs font-bold">@{u.username}</span>
                                        <button onClick={() => updateContact(u.id, 'friend')} className="text-[10px] bg-emerald-500 px-2 py-1 rounded-md text-white font-bold">+ Add</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black px-2 mb-2">Chats</p>
                    {myContacts.map((c: any) => (
                        <div
                            key={c.profiles.id}
                            onClick={() => setActiveChat(c.profiles)}
                            className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${activeChat?.id === c.profiles.id ? 'bg-violet-600 shadow-lg shadow-violet-600/20' : 'hover:bg-white/5'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <img src={c.profiles.avatar_url || 'https://via.placeholder.com/100'} className="w-10 h-10 rounded-full border border-white/10" />
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#070b14] rounded-full"></div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold">{c.profiles.username}</h3>
                                    <span className="text-[10px] opacity-50">Klicke zum Chatten</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* CHAT BEREICH */}
            <section className="flex-1 flex flex-col relative bg-[#070b14]">
                {activeChat ? (
                    <>
                        <header className="h-20 bg-[#0f172a]/40 backdrop-blur-md border-b border-white/5 flex items-center px-8 justify-between z-10">
                            <div className="flex items-center gap-4">
                                <img src={activeChat.avatar_url || 'https://via.placeholder.com/100'} className="w-10 h-10 rounded-full border border-violet-500/50" />
                                <div>
                                    <h2 className="font-bold text-white">@{activeChat.username}</h2>
                                    <p className="text-[10px] text-emerald-400">aktiv</p>
                                </div>
                            </div>
                        </header>

                        <div className="flex-1 p-6 overflow-y-auto space-y-4">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'} animate-in fade-in zoom-in-95 duration-200`}>
                                    <div className={`p-3 px-4 rounded-2xl max-w-[70%] shadow-sm ${m.sender_id === user.id ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/5'}`}>
                                        <p className="text-sm leading-relaxed">{m.content}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={sendMessage} className="p-6 bg-gradient-to-t from-[#070b14] to-transparent">
                            <div className="flex gap-3 bg-white/5 border border-white/10 p-2 rounded-2xl focus-within:border-violet-500 transition-all shadow-2xl">
                                <input
                                    className="flex-1 bg-transparent border-none p-2 outline-none text-sm"
                                    placeholder="Schreibe eine Nachricht..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <button type="submit" className="bg-violet-600 p-2.5 rounded-xl hover:bg-violet-500 transition-colors">
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-4">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                            <User size={40} className="opacity-20" />
                        </div>
                        <p className="font-medium italic">Wähle einen Chat aus, um zu schreiben.</p>
                    </div>
                )}
            </section>
        </main>
    );
}