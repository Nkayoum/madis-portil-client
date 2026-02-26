import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import {
    ArrowLeft, Send, Loader2, AlertCircle, CheckCircle2,
    Clock, MessageSquare, User, Paperclip, X, Building,
    Phone, Mail, ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../../lib/utils';

export default function TicketDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [isInternal, setIsInternal] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchTicketData();
        markNotificationsAsRead();
    }, [id]);

    const markNotificationsAsRead = async () => {
        try {
            await api.post('/notifications/mark_as_read_by_link/', {
                link: `/dashboard/tickets/${id}`
            });
        } catch (err) {
            console.error('Failed to mark notifications as read:', err);
        }
    };

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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !selectedFile) return;

        setSending(true);
        try {
            const formData = new FormData();
            formData.append('content', newMessage);
            if (selectedFile) {
                formData.append('attachment', selectedFile);
            }
            if (isInternal) {
                formData.append('is_internal', 'true');
            }

            const response = await api.post(`/tickets/${id}/messages/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setMessages([...messages, response.data]);
            setNewMessage('');
            setSelectedFile(null);
            setIsInternal(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setSending(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        setUpdatingStatus(true);
        try {
            const response = await api.patch(`/tickets/${id}/`, { status: newStatus });
            setTicket(response.data);
        } catch (err) {
            console.error('Failed to update ticket status:', err);
        } finally {
            setUpdatingStatus(false);
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
        <div className="max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-8rem)] animate-fade-in pb-10 px-4 md:px-10">
            <div className="mb-8">
                <Link to="/dashboard/tickets" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-black dark:hover:text-white transition-all group">
                    <ArrowLeft className="mr-3 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Retour au registre des échanges
                </Link>
            </div>

            {/* Ticket Header Solaris Style */}
            <div className="solaris-glass rounded-[2.5rem] border-none shadow-xl overflow-hidden z-20 relative mb-6">
                <div className="p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div>
                        <div className="flex flex-wrap items-center gap-6 mb-4">
                            <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">{ticket.subject}</h1>
                            <span className={cn(
                                "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                                statusConfig.bg, statusConfig.color
                            )}>
                                {ticket.status_display || statusConfig.label}
                            </span>
                            {ticket.property && (
                                <Link
                                    to={`/dashboard/properties/${ticket.property}`}
                                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-black text-white hover:bg-black/90 transition-all shadow-lg"
                                >
                                    <Building className="h-4 w-4" />
                                    {ticket.property_name}
                                    <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
                                </Link>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-8 dark:text-white/60">
                            <div className="flex items-center gap-2 bg-black/[0.03] dark:bg-white/5 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5">
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-20">ID</span>
                                <span className="text-[11px] font-black font-mono">#{ticket.id}</span>
                            </div>
                            <div className="flex items-center gap-2 text-black/40 dark:text-white/40">
                                <Clock className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    Ouvert le {format(new Date(ticket.created_at), 'd MMM yyyy à HH:mm', { locale: fr })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-red-600 dark:text-red-400">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Priorité</span>
                                <span className="text-[9px] font-black uppercase tracking-widest font-bold">
                                    {ticket.priority}
                                </span>
                            </div>
                        </div>
                    </div>

                    {user?.role === 'ADMIN_MADIS' && (
                        <div className="flex gap-4">
                            {ticket.status !== 'CLOSED' ? (
                                <button
                                    onClick={() => handleStatusChange('CLOSED')}
                                    disabled={updatingStatus}
                                    className="inline-flex items-center justify-center rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-red-600 text-white hover:bg-red-700 h-12 px-8 shadow-[0_0_30px_rgba(220,38,38,0.4),0_0_60px_rgba(220,38,38,0.15)] hover:shadow-[0_0_40px_rgba(220,38,38,0.6),0_0_80px_rgba(220,38,38,0.2)]"
                                >
                                    {updatingStatus ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : <X className="mr-3 h-4 w-4" />}
                                    Clôturer le protocole
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleStatusChange('OPEN')}
                                    disabled={updatingStatus}
                                    className="inline-flex items-center justify-center rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-black text-white hover:bg-black/90 h-12 px-8 shadow-lg"
                                >
                                    {updatingStatus ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : <CheckCircle2 className="mr-3 h-4 w-4" />}
                                    Réactiver l'échange
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Admin Quick Info Bar Solaris style */}
                {user?.role === 'ADMIN_MADIS' && ticket.creator_details && (
                    <div className="px-10 py-5 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5 flex flex-wrap items-center gap-10">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center text-[10px] font-black text-white">
                                {ticket.creator_details.full_name?.[0]}
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-tight">{ticket.creator_details.full_name}</span>
                        </div>
                        <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                            <Mail className="h-4 w-4" />
                            <a href={`mailto:${ticket.creator_details.email}`} className="text-[11px] font-bold">
                                {ticket.creator_details.email}
                            </a>
                        </div>
                        {ticket.creator_details.phone && (
                            <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                <Phone className="h-4 w-4" />
                                <a href={`tel:${ticket.creator_details.phone}`} className="text-[11px] font-bold">
                                    {ticket.creator_details.phone}
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Messages Area Solaris Style */}
            <div className="flex-1 overflow-y-auto py-10 space-y-10 pr-4 scrollbar-thin scrollbar-thumb-black/10">
                {/* Initial Ticket Description */}
                <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-[2rem] rounded-tl-none px-8 py-6 bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-xl relative group">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-8 w-8 rounded-xl bg-black flex items-center justify-center text-[10px] font-black text-white transition-transform group-hover:scale-110">
                                {ticket.creator_name?.[0] || 'V'}
                            </div>
                            <span className="text-[12px] font-black uppercase tracking-tight">
                                {ticket.creator_name || 'Émetteur'}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-20 ml-auto">
                                {format(new Date(ticket.created_at), 'HH:mm', { locale: fr })}
                            </span>
                        </div>
                        <p className="text-[14px] font-medium leading-relaxed text-black/70 dark:text-white/70 whitespace-pre-wrap">{ticket.description}</p>
                        {ticket.attachment && (
                            <a href={ticket.attachment} target="_blank" rel="noreferrer" className="flex items-center gap-3 mt-6 text-[10px] font-black uppercase tracking-widest p-4 rounded-2xl bg-black/[0.03] dark:bg-white/5 hover:bg-black hover:text-white transition-all w-fit shadow-sm border border-black/5 dark:border-white/5">
                                <Paperclip className="h-4 w-4" />
                                Pièce jointe d'ouverture
                            </a>
                        )}
                    </div>
                </div>

                {messages.map((msg) => {
                    const isMe = msg.author === user?.id;
                    const isInternalNote = msg.is_internal;

                    return (
                        <div key={msg.id} className={cn("flex group", isMe ? 'justify-end' : 'justify-start')}>
                            <div className={cn(
                                "max-w-[85%] rounded-[2rem] px-8 py-6 shadow-xl border transition-all duration-500",
                                isInternalNote
                                    ? 'bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800/30 rounded-tl-none'
                                    : isMe
                                        ? 'bg-black text-white rounded-tr-none'
                                        : 'bg-white dark:bg-white/5 border-black/5 dark:border-white/5 rounded-tl-none'
                            )}>
                                <div className={cn("flex items-center gap-4 mb-4", isMe && !isInternalNote && "flex-row-reverse text-right")}>
                                    <div className={cn(
                                        "h-8 w-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-transform group-hover:scale-110",
                                        isMe ? "bg-white text-black" : "bg-black text-white"
                                    )}>
                                        {msg.author_name?.[0] || (isMe ? 'V' : 'S')}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[12px] font-black uppercase tracking-tight">
                                            {msg.author_name || (isMe ? 'Vous' : 'Support MaDis')}
                                        </span>
                                        {isInternalNote && (
                                            <span className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg animate-pulse tracking-widest uppercase">
                                                NOTE INTERNE
                                            </span>
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest opacity-20",
                                        isMe && !isInternalNote && "ml-0 mr-auto"
                                    )}>
                                        {format(new Date(msg.created_at), 'HH:mm', { locale: fr })}
                                    </span>
                                </div>
                                <p className={cn(
                                    "text-[14px] font-medium leading-relaxed whitespace-pre-wrap",
                                    isMe && !isInternalNote ? "text-white/90" : "text-black/70 dark:text-white/70"
                                )}>
                                    {msg.content}
                                </p>
                                {msg.attachment && (
                                    <a
                                        href={msg.attachment}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={cn(
                                            "flex items-center gap-3 mt-6 text-[10px] font-black uppercase tracking-widest p-4 rounded-2xl transition-all w-fit shadow-sm",
                                            isMe && !isInternalNote
                                                ? "bg-white/10 hover:bg-white/20 text-white"
                                                : "bg-black/[0.03] dark:bg-white/5 hover:bg-black hover:text-white border border-black/5 dark:border-white/5"
                                        )}
                                    >
                                        <Paperclip className="h-4 w-4" />
                                        Documentation Jointe
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area Solaris Style */}
            <div className="solaris-glass rounded-[2rem] p-6 shadow-2xl z-20 relative">
                {selectedFile && (
                    <div className="mb-4 p-4 bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl flex items-center justify-between animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-black text-white rounded-lg">
                                <Paperclip className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[11px] font-black uppercase truncate block">{selectedFile.name}</span>
                                <span className="text-[9px] font-black uppercase opacity-20 block">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Préproduction jointe
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={removeFile}
                            className="h-10 w-10 flex items-center justify-center hover:bg-red-600 hover:text-white text-muted-foreground rounded-xl transition-all"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}

                <form onSubmit={handleSendMessage} className="space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
                        {user?.role === 'ADMIN_MADIS' && (
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={cn(
                                    "h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
                                    isInternal ? "bg-red-600 border-red-600 shadow-lg shadow-red-200 dark:shadow-red-900/30" : "border-black/10 dark:border-white/10 group-hover:border-black dark:group-hover:border-white"
                                )}>
                                    {isInternal && <AlertCircle className="h-3 w-3 text-white" />}
                                    <input
                                        type="checkbox"
                                        checked={isInternal}
                                        onChange={(e) => setIsInternal(e.target.checked)}
                                        className="absolute opacity-0 cursor-pointer"
                                    />
                                </div>
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-widest transition-colors",
                                    isInternal ? "text-red-600 dark:text-red-400" : "text-black/30 dark:text-white/30 group-hover:text-black dark:group-hover:text-white"
                                )}>
                                    Note interne de service (Confidentiel)
                                </span>
                            </label>
                        )}

                        {ticket.status === 'CLOSED' && (
                            <div className="flex items-center gap-2 text-red-600 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                <AlertCircle className="h-4 w-4" />
                                Canal de communication verrouillé
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 items-center">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-14 w-14 flex items-center justify-center text-muted-foreground hover:text-black dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl transition-all shadow-sm flex-shrink-0"
                            title="Joindre documentation"
                            disabled={sending || ticket.status === 'CLOSED'}
                        >
                            <Paperclip className="h-6 w-6" />
                        </button>

                        <div className="flex-1 relative">
                            <input
                                type="text"
                                className="ic w-full h-14 pl-8 pr-8 rounded-2xl bg-black/[0.01] dark:bg-white/[0.03] border-black/5 dark:border-white/5 focus:bg-white dark:focus:bg-white/5 transition-all text-[14px] font-bold"
                                placeholder={ticket.status === 'CLOSED' ? "Échange clôturé..." : "Saisir une transmission..."}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                disabled={sending || ticket.status === 'CLOSED'}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={sending || (!newMessage.trim() && !selectedFile) || ticket.status === 'CLOSED'}
                            className="h-14 w-14 flex items-center justify-center bg-black text-white rounded-2xl hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl shadow-black/10 flex-shrink-0 group"
                        >
                            {sending ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <Send className="h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
