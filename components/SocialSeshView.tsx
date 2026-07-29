import React, { useState, useEffect, useRef } from 'react';
import { Group, User } from '../types';
import { api } from '../services/supabaseClient';
import { Phone, Send } from 'lucide-react';

const SocialSeshView: React.FC<{ group: Group, user: User, onSendMessage: (text: string) => void }> = ({ group, user, onSendMessage }) => {
    const [message, setMessage] = useState('');
    const [isCallActive, setIsCallActive] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [group.messages]);
    
    const handleSend = () => {
        if (!message.trim()) return;
        onSendMessage(message);
        setMessage('');
    };

    return (
        <div className="h-full flex flex-col relative pb-20 lg:pb-0 ys-group-root">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center ys-group-header" style={{backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${group.cover_image_url || ''})`, backgroundSize: 'cover', backgroundPosition: 'center'}}>
                <div>
                    <h2 className="text-xl font-bold">{group.name}</h2>
                    <p className="text-sm text-[var(--text-muted)]">{group.description}</p>
                </div>
                <div>
                    <button onClick={() => setIsCallActive(true)} className="p-2 bg-black/30 rounded-full hover:bg-black/60 transition-colors text-white">
                        <Phone size={18} />
                    </button>
                </div>
            </div>
            {isCallActive && (
                <div className="bg-green-500/20 border-b border-green-500/30 p-2 text-center text-sm text-green-300 flex items-center justify-center gap-4">
                    <span className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Voice/Video chat is active
                    </span>
                    <button className="px-3 py-1 bg-green-500 text-black text-xs font-bold rounded-full">Join</button>
                    <button onClick={() => setIsCallActive(false)} className="text-xs hover:underline">Leave</button>
                </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 ys-group-chat">
                {group.messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.userId === user.id ? 'justify-end' : ''}`}>
                        {msg.userId !== user.id && <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.userId}`} className="w-8 h-8 rounded-full" alt={msg.userName}/>}
                        <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ys-message-bubble ${msg.userId === user.id ? 'bg-[var(--accent)] text-white rounded-br-none' : 'bg-[var(--bg-card)] text-[var(--text-main)] rounded-bl-none'}`}>
                           {msg.userId !== user.id && <p className="text-xs font-bold text-[var(--accent)] mb-0.5">{msg.userName}</p>}
                            <p className="text-sm">{msg.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-main)]">
                <div className="bg-[var(--bg-input)] rounded-full flex items-center px-2 border border-[var(--border-strong)]">
                    <input 
                        type="text" 
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                        placeholder="Send a message..." 
                        className="flex-1 bg-transparent p-3 focus:outline-none"
                    />
                    <button onClick={handleSend} className="p-2 bg-[var(--accent)] text-white rounded-full hover:scale-110 transition-transform">
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SocialSeshView;