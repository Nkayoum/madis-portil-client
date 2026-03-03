import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import {
    ArrowLeft, Send, Loader2, AlertCircle, CheckCircle2,
    Clock, MessageSquare, User, Paperclip, X, Building,
    Phone, Mail, ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

export default function TicketDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'fr' ? fr : enUS;
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
    }, [fetchTicketData, markNotificationsAsRead]);

    const markNotificationsAsRead = useCallback(async () => {
        try {
            await api.post('/notifications/mark_as_read_by_link/', {
                link: `/dashboard/tickets/${id}`
            });
        } catch (err) {
            console.error('Failed to mark notifications as read:', err);
        }
    }, [id]);

    const fetchTicketData = useCallback(async () => {
        try {
            const [ticketRes, messagesRes] = await Promise.all([
                api.get(`/tickets/${id}/`),
                api.get(`/tickets/${id}/messages/`)
            ]);
            setTicket(ticketRes.data);
            setMessages(messagesRes.data.results || []);
        } catch (err) {
            setError(t('messaging.detail.not_found'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id, t]);

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
            case 'OPEN': return { color: 'text-primary', bg: 'bg-primary/10', label: t('messaging.list.status_open') };
            case 'IN_PROGRESS': return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/20', label: t('messaging.list.status_in_progress') };
            case 'CLOSED': return { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/20', label: t('messaging.list.status_closed') };
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
                    {t('messaging.detail.back_to_list')}
                </Link>
                <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                    {error || t('messaging.detail.not_found')}
                </div>
            </div>
        );
    }

    const statusConfig = getStatusConfig(ticket.status);

    return (
        <div className="max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-7rem)] md:h-[calc(100vh-8rem)] animate-fade-in px-2 sm:px-4 md:px-10">
            <div className="mb-3 md:mb-5">
                <Link to="/dashboard/tickets" className="inline-flex items-center text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-black dark:hover:text-white transition-all group">
                    <ArrowLeft className="mr-2 h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                    <span className="truncate">{t('messaging.detail.back_to_registry')}</span>
                </Link>
            </div>

            {/* Ticket Header Solaris Style */}
            <div className="solaris-glass rounded-[1.25rem] md:rounded-[2rem] border-none shadow-sm overflow-hidden z-20 relative mb-3 md:mb-6">
                <div className="p-4 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-8">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-3 md:mb-4">
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase leading-tight">{ticket.subject}</h1>
                            <span className={cn(
                                "px-3 md:px-4 py-1 rounded-full text-[8px] md:text-[9px] font-bold uppercase tracking-widest shadow-sm",
                                statusConfig.bg, statusConfig.color
                            )}>
                                {ticket.status_display || statusConfig.label}
                            </span>
                            {ticket.property && (
                                <Link
                                    to={`/dashboard/properties/${ticket.property}`}
                                    className="inline-flex items-center gap-1.5 px-3 md:px-4 py-1 rounded-full text-[8px] md:text-[9px] font-bold uppercase tracking-widest bg-black text-white hover:bg-black/90 transition-all shadow-md"
                                >
                                    <Building className="h-3 md:h-3.5 w-3 md:w-3.5" />
                                    <span className="truncate max-w-[100px] md:max-w-none">{ticket.property_name}</span>
                                    <ExternalLink className="h-2.5 w-2.5 ml-0.5 opacity-50" />
                                </Link>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 md:gap-6 dark:text-white/60">
                            <div className="flex items-center gap-1.5 bg-black/[0.03] dark:bg-white/5 px-2 py-0.5 rounded-lg border border-black/5 dark:border-white/5">
                                <span className="text-[8px] font-bold uppercase tracking-widest opacity-20">{t('messaging.list.id')}</span>
                                <span className="text-[10px] font-bold font-mono">#{ticket.id}</span>
                            </div>
                            <div className="flex items-center gap-2 text-black/40 dark:text-white/40">
                                <Clock className="h-3.5 w-3.5" />
                                <span className="text-[9px] font-bold uppercase tracking-widest">
                                    {t('messaging.detail.opened_on')} {format(new Date(ticket.created_at), 'd MMM yyyy', { locale: dateLocale })}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/5 text-red-600 dark:text-red-400">
                                <span className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-40">{t('messaging.detail.priority')}</span>
                                <span className="text-[8px] font-bold uppercase tracking-widest">
                                    {ticket.priority}
                                </span>
                            </div>
                        </div>
                    </div>

                    {user?.role === 'ADMIN_MADIS' && (
                        <div className="flex gap-2">
                            {ticket.status !== 'CLOSED' ? (
                                <button
                                    onClick={() => handleStatusChange('CLOSED')}
                                    disabled={updatingStatus}
                                    className="flex-1 lg:flex-none inline-flex items-center justify-center rounded-xl text-[8px] md:text-[9px] font-bold uppercase tracking-widest transition-all bg-red-600 text-white hover:bg-red-700 h-9 md:h-10 px-4 md:px-6 shadow-md"
                                >
                                    {updatingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <X className="mr-2 h-3.5 w-3.5" />}
                                    {t('messaging.detail.btn_close')}
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleStatusChange('OPEN')}
                                    disabled={updatingStatus}
                                    className="flex-1 lg:flex-none inline-flex items-center justify-center rounded-xl text-[8px] md:text-[9px] font-bold uppercase tracking-widest transition-all bg-black text-white hover:bg-black/90 h-9 md:h-10 px-4 md:px-6 shadow-md"
                                >
                                    {updatingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-3.5 w-3.5" />}
                                    {t('messaging.detail.btn_reopen')}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Admin Quick Info Bar Solaris style */}
                {user?.role === 'ADMIN_MADIS' && ticket.creator_details && (
                    <div className="px-6 md:px-10 py-4 md:py-5 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5 flex flex-wrap items-center gap-6 md:gap-10">
                        <div className="flex items-center gap-3">
                            <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-black flex items-center justify-center text-[9px] md:text-[10px] font-black text-white">
                                {ticket.creator_details.full_name?.[0]}
                            </div>
                            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-tight">{ticket.creator_details.full_name}</span>
                        </div>
                        <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                            <Mail className="h-3.5 md:h-4 w-3.5 md:w-4" />
                            <a href={`mailto:${ticket.creator_details.email}`} className="text-[10px] md:text-[11px] font-bold">
                                {ticket.creator_details.email}
                            </a>
                        </div>
                        {ticket.creator_details.phone && (
                            <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                <Phone className="h-3.5 md:h-4 w-3.5 md:w-4" />
                                <a href={`tel:${ticket.creator_details.phone}`} className="text-[10px] md:text-[11px] font-bold">
                                    {ticket.creator_details.phone}
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Messages Area Solaris Style */}
            <div className="flex-1 overflow-y-auto py-6 md:py-10 space-y-6 md:space-y-10 pr-2 md:pr-4 no-scrollbar [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {/* Initial Ticket Description */}
                <div className="flex justify-start">
                    <div className="max-w-[98%] sm:max-w-[90%] md:max-w-[85%] rounded-[1rem] md:rounded-[1.5rem] rounded-tl-none px-3.5 py-2.5 md:px-6 md:py-4 bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-md relative group">
                        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                            <div className="h-6 w-6 md:h-7 md:w-7 rounded-lg bg-black flex items-center justify-center text-[8px] md:text-[9px] font-bold text-white transition-transform group-hover:scale-110">
                                {ticket.creator_name?.[0] || 'V'}
                            </div>
                            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-tight">
                                {ticket.creator_name || t('messaging.detail.sender')}
                            </span>
                            <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-20 ml-auto">
                                {format(new Date(ticket.created_at), 'HH:mm', { locale: dateLocale })}
                            </span>
                        </div>
                        <p className="text-[12px] md:text-[13px] font-medium leading-relaxed text-black/70 dark:text-white/70 whitespace-pre-wrap">{ticket.description}</p>
                        {ticket.attachment && (
                            <a href={ticket.attachment} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 md:gap-2 mt-3 md:mt-4 text-[8px] md:text-[9px] font-bold uppercase tracking-widest p-2 md:p-3 rounded-xl bg-black/[0.03] dark:bg-white/5 hover:bg-black hover:text-white transition-all w-fit shadow-sm border border-black/5 dark:border-white/5">
                                <Paperclip className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                {t('messaging.detail.initial_attachment')}
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
                                "max-w-[98%] sm:max-w-[90%] md:max-w-[85%] rounded-[1rem] md:rounded-[1.5rem] px-3.5 py-2.5 md:px-6 md:py-4 shadow-md border transition-all duration-500",
                                isInternalNote
                                    ? 'bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800/30 rounded-tl-none'
                                    : isMe
                                        ? 'bg-black text-white rounded-tr-none'
                                        : 'bg-white dark:bg-white/5 border-black/5 dark:border-white/5 rounded-tl-none'
                            )}>
                                <div className={cn("flex items-center gap-2 md:gap-3 mb-2 md:mb-3", isMe && !isInternalNote && "flex-row-reverse text-right")}>
                                    <div className={cn(
                                        "h-6 w-6 md:h-7 md:w-7 rounded-lg flex items-center justify-center text-[8px] md:text-[9px] font-bold transition-transform group-hover:scale-110",
                                        isMe ? "bg-white text-black" : "bg-black text-white"
                                    )}>
                                        {msg.author_name?.[0] || (isMe ? 'V' : 'S')}
                                    </div>
                                    <div className="flex items-center gap-1.5 md:gap-2">
                                        <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-tight">
                                            {msg.author_name || (isMe ? t('messaging.detail.you') : t('messaging.detail.support'))}
                                        </span>
                                        {isInternalNote && (
                                            <span className="bg-red-600 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse tracking-widest uppercase">
                                                {t('messaging.detail.internal')}
                                            </span>
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-20",
                                        isMe && !isInternalNote && "ml-0 mr-auto"
                                    )}>
                                        {format(new Date(msg.created_at), 'HH:mm', { locale: dateLocale })}
                                    </span>
                                </div>
                                <p className={cn(
                                    "text-[12px] md:text-[13px] font-medium leading-relaxed whitespace-pre-wrap",
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
                                            "flex items-center gap-2 md:gap-3 mt-4 md:mt-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest p-3 md:p-4 rounded-xl md:rounded-2xl transition-all w-fit shadow-sm",
                                            isMe && !isInternalNote
                                                ? "bg-white/10 hover:bg-white/20 text-white"
                                                : "bg-black/[0.03] dark:bg-white/5 hover:bg-black hover:text-white border border-black/5 dark:border-white/5"
                                        )}
                                    >
                                        <Paperclip className="h-3.5 md:h-4 w-3.5 md:w-4" />
                                        {t('messaging.detail.attachment')}
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area Solaris Style - Refined Footer Hook */}
            <div className="mt-auto pt-2 md:pt-4">
                <div className="solaris-glass rounded-[1.25rem] md:rounded-[2rem] p-2.5 md:p-3 shadow-md border border-black/5 dark:border-white/5 relative z-20">
                    {selectedFile && (
                        <div className="mb-2 p-2 bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className="p-1.5 bg-black text-white rounded-lg">
                                    <Paperclip className="h-3 w-3" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[8px] md:text-[9px] font-bold uppercase truncate block">{selectedFile.name}</span>
                                    <span className="text-[7px] font-bold uppercase opacity-20 block">
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={removeFile}
                                className="h-7 w-7 flex items-center justify-center hover:bg-red-600 hover:text-white text-muted-foreground rounded-lg transition-all"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSendMessage} className="space-y-2">
                        {user?.role === 'ADMIN_MADIS' && (
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 px-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={cn(
                                        "h-3 w-3 rounded border flex items-center justify-center transition-all",
                                        isInternal ? "bg-red-600 border-red-600" : "border-black/10 dark:border-white/10 group-hover:border-black dark:group-hover:border-white"
                                    )}>
                                        {isInternal && <AlertCircle className="h-2 w-2 text-white" />}
                                        <input
                                            type="checkbox"
                                            checked={isInternal}
                                            onChange={(e) => setIsInternal(e.target.checked)}
                                            className="absolute opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <span className={cn(
                                        "text-[7px] md:text-[8px] font-bold uppercase tracking-[0.15em] transition-colors",
                                        isInternal ? "text-red-600 dark:text-red-400" : "text-black/30 dark:text-white/30 group-hover:text-black dark:group-hover:text-white"
                                    )}>
                                        {t('messaging.detail.internal_note')}
                                    </span>
                                </label>

                                {ticket.status === 'CLOSED' && (
                                    <div className="flex items-center gap-1.5 text-red-600 text-[7px] md:text-[8px] font-bold uppercase tracking-widest animate-pulse">
                                        <AlertCircle className="h-2.5 w-2.5" />
                                        {t('messaging.detail.closed')}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-2 items-end">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="h-9 w-9 md:h-10 md:w-10 flex items-center justify-center text-muted-foreground hover:text-black dark:hover:text-white bg-black/[0.03] dark:bg-white/[0.03] hover:bg-black/[0.05] border border-black/5 dark:border-white/5 rounded-xl transition-all shadow-sm flex-shrink-0"
                                disabled={sending || ticket.status === 'CLOSED'}
                            >
                                <Paperclip className="h-4 w-4" />
                            </button>

                            <div className="flex-1 relative">
                                <textarea
                                    className="w-full min-h-[44px] md:min-h-[40px] max-h-32 py-3 px-4 rounded-xl bg-black/[0.01] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 focus:bg-white transition-all text-[12px] md:text-[13px] font-semibold resize-none scrollbar-none"
                                    placeholder={ticket.status === 'CLOSED' ? t('messaging.detail.closed') : t('messaging.detail.placeholder')}
                                    value={newMessage}
                                    onChange={(e) => {
                                        setNewMessage(e.target.value);
                                        e.target.style.height = 'inherit';
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey && !sending) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                    disabled={sending || ticket.status === 'CLOSED'}
                                    rows={1}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={sending || (!newMessage.trim() && !selectedFile) || ticket.status === 'CLOSED'}
                                className="h-11 w-11 md:h-10 md:w-10 flex items-center justify-center bg-black text-white dark:bg-white dark:text-black rounded-xl hover:scale-105 disabled:opacity-30 transition-all shadow-sm flex-shrink-0"
                            >
                                {sending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
