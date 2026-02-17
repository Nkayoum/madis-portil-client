import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import {
    ArrowLeft, Send, Loader2, AlertCircle, CheckCircle2,
    Clock, MessageSquare, User, Paperclip
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function TicketDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchTicketData();
    }, [id]);

    const fetchTicketData = async () => {
        try {
            const [ticketRes, messagesRes] = await Promise.all([
                api.get(`/tickets/${id}/`),
                api.get(`/tickets/${id}/messages/`)
            ]);
            setTicket(ticketRes.data);
            setMessages(messagesRes.data.results || []);
        } catch (err) {
            setError('Impossible de charger la conversation.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            const response = await api.post(`/tickets/${id}/messages/`, {
                content: newMessage
            });
            setMessages([...messages, response.data]);
            setNewMessage('');
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setSending(false);
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'OPEN': return { color: 'text-primary', bg: 'bg-primary/10', label: 'Ouvert' };
            case 'IN_PROGRESS': return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/20', label: 'En cours' };
            case 'CLOSED': return { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/20', label: 'Fermé' };
            default: return { color: 'text-muted-foreground', bg: 'bg-muted', label: status };
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div className="space-y-4">
                <Link to="/dashboard/tickets" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour aux messages
                </Link>
                <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                    {error || "Ticket non trouvé."}
                </div>
            </div>
        );
    }

    const statusConfig = getStatusConfig(ticket.status);

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
            <div className="mb-4">
                <Link to="/dashboard/tickets" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group w-fit">
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Retour aux messages
                </Link>
            </div>

            {/* Ticket Header */}
            <div className="bg-card border rounded-t-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-xl font-bold tracking-tight">{ticket.subject}</h1>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                            {ticket.status_display || statusConfig.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded">#{ticket.id}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(ticket.created_at), 'd MMM yyyy à HH:mm', { locale: fr })}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-primary">Priorité {ticket.priority}</span>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 bg-muted/30 border-x overflow-y-auto p-6 space-y-6">
                {/* Initial Ticket Description as first message */}
                <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl rounded-tl-none px-5 py-4 bg-card border shadow-sm relative">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                {ticket.creator_name?.[0] || 'V'}
                            </div>
                            <span className="font-semibold text-sm">
                                {ticket.creator_name || 'Vous'}
                            </span>
                            <span className="text-xs text-muted-foreground ml-auto">
                                {format(new Date(ticket.created_at), 'HH:mm', { locale: fr })}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                    </div>
                </div>

                {messages.map((msg) => {
                    const isMe = msg.sender === user?.id;
                    const isStaff = msg.sender_role === 'ADMIN_MADIS' || msg.sender_role === 'CHEF_CHANTIER';

                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                            {!isMe && isStaff && (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0">
                                    <User className="h-4 w-4 text-primary" />
                                </div>
                            )}
                            <div className={`max-w-[80%] rounded-2xl px-5 py-4 shadow-sm border transition-all duration-200 ${isMe
                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                : 'bg-card rounded-tl-none'
                                }`}>
                                <div className={`flex items-center gap-2 mb-2 ${isMe ? 'justify-end' : ''}`}>
                                    <span className={`font-semibold text-sm ${isMe ? 'text-primary-foreground' : ''}`}>
                                        {msg.sender_name || (isMe ? 'Vous' : 'Support MaDis')}
                                    </span>
                                    <span className={`text-xs ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                        {format(new Date(msg.created_at), 'HH:mm', { locale: fr })}
                                    </span>
                                </div>
                                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isMe ? '' : 'text-muted-foreground'}`}>
                                    {msg.content}
                                </p>
                                {msg.attachment && (
                                    <a href={msg.attachment} target="_blank" rel="noreferrer" className={`flex items-center gap-2 mt-3 text-xs font-medium px-3 py-2 rounded-lg transition-colors w-fit ${isMe ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
                                        <Paperclip className="h-3 w-3" />
                                        Pièce jointe
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-card border rounded-b-xl p-4 shadow-sm z-10 relative">
                <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                    <button
                        type="button"
                        className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors mb-0.5"
                        title="Joindre un fichier (bientôt disponible)"
                    >
                        <Paperclip className="h-5 w-5" />
                    </button>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            className="flex h-10 w-full rounded-full border border-input bg-background px-5 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="Écrivez votre message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={sending || ticket.status === 'CLOSED'}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim() || ticket.status === 'CLOSED'}
                        className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm mb-0.5"
                    >
                        {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </button>
                </form>
                {ticket.status === 'CLOSED' && (
                    <p className="text-center text-xs text-muted-foreground mt-3 font-medium flex items-center justify-center gap-2">
                        <AlertCircle className="h-3 w-3" />
                        Ce ticket est fermé. Vous ne pouvez plus y répondre.
                    </p>
                )}
            </div>
        </div>
    );
}
