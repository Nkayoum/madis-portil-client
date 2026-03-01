import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Plus, Loader2, Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

export default function TicketsList() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'fr' ? fr : enUS;
    const [properties, setProperties] = useState([]);
    const [clients, setClients] = useState([]);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        property: '',
        created_by: ''
    });

    useEffect(() => {
        if (user?.role === 'ADMIN_MADIS') {
            fetchFilterData();
        }
    }, [user]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTickets();
        }, 300);
        return () => clearTimeout(timer);
    }, [filters, search]);

    const fetchFilterData = async () => {
        try {
            const [propRes, userRes] = await Promise.all([
                api.get('/properties/'),
                api.get('/auth/users/?role=CLIENT')
            ]);
            setProperties(propRes.data.results || propRes.data);
            setClients(userRes.data.results || userRes.data);
        } catch (err) {
            console.error('Failed to fetch filter options:', err);
        }
    };

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.priority) params.append('priority', filters.priority);
            if (filters.property) params.append('property', filters.property);
            if (filters.created_by) params.append('created_by', filters.created_by);
            if (search) params.append('search', search);

            const response = await api.get(`/tickets/?${params.toString()}`);
            setTickets(response.data.results || []);
        } catch (err) {
            setError(t('messaging.list.empty_desc'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        setFilters({
            status: '',
            priority: '',
            property: '',
            created_by: ''
        });
        setSearch('');
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'OPEN':
                return { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', icon: AlertCircle, label: t('messaging.list.status_open') };
            case 'IN_PROGRESS':
                return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', icon: Clock, label: t('messaging.list.status_in_progress') };
            case 'CLOSED':
                return { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', icon: CheckCircle2, label: t('messaging.list.status_closed') };
            default:
                return { color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', icon: MessageSquare, label: status };
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'URGENT': return 'text-red-600 dark:text-red-400 font-bold';
            case 'HIGH': return 'text-orange-600 dark:text-orange-400 font-semibold';
            case 'MEDIUM': return 'text-yellow-600 dark:text-yellow-400';
            default: return 'text-muted-foreground';
        }
    };

    if (loading && tickets.length === 0) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 animate-fade-in pb-20 px-4 md:px-10">
            {/* Header Solaris Style */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase leading-tight md:leading-none mb-1.5 md:mb-2">{t('messaging.list.title')}</h1>
                    <p className="text-[9px] md:text-[10px] font-semibold uppercase tracking-wider opacity-60">{t('messaging.list.subtitle')}</p>
                </div>
                <Link
                    to="/dashboard/tickets/new"
                    className="inline-flex items-center justify-center rounded-xl text-[8px] md:text-[9px] font-bold uppercase tracking-widest transition-all bg-black dark:bg-primary text-white hover:bg-black/90 dark:hover:bg-primary/90 h-9 px-5 shadow-lg shadow-black/10 dark:shadow-[0_0_20px_rgba(255,0,72,0.3)] group whitespace-nowrap w-fit"
                >
                    <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-500" />
                    {t('messaging.list.new_ticket')}
                </Link>
            </div>

            {/* Filters Bar Solaris Style */}
            <div className="solaris-glass rounded-[1.25rem] md:rounded-[2rem] p-4 md:p-6 border-none shadow-sm space-y-4 md:space-y-6">
                <div className="flex items-center gap-3 text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] opacity-30">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {t('messaging.list.search_console')}
                </div>
                <div className="flex flex-wrap items-center gap-3 md:gap-4 lg:gap-6">
                    {/* Search Field */}
                    <div className="flex items-center gap-2 flex-grow min-w-[200px]">
                        <label className="text-[8px] font-bold uppercase tracking-widest opacity-40 shrink-0">{t('messaging.list.search_label')}</label>
                        <input
                            type="text"
                            placeholder={t('messaging.list.search_placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ic flex-1 px-3 py-2 rounded-xl bg-black/[0.01] dark:bg-white/5 border-black/5 dark:border-white/5 focus:bg-white transition-all text-[11px] font-semibold dark:text-white h-9"
                        />
                    </div>

                    {/* Status Select */}
                    <div className="flex items-center gap-2 min-w-[140px]">
                        <label className="text-[8px] font-bold uppercase tracking-widest opacity-40 shrink-0">{t('messaging.list.status_label')}</label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="ic px-3 py-2 rounded-xl bg-black/[0.01] dark:bg-white/5 border-black/5 dark:border-white/5 focus:bg-white transition-all text-[11px] font-semibold dark:text-white h-9 w-full"
                        >
                            <option value="">{t('messaging.list.status_all')}</option>
                            <option value="OPEN">{t('messaging.list.status_open')}</option>
                            <option value="IN_PROGRESS">{t('messaging.list.status_in_progress')}</option>
                            <option value="CLOSED">{t('messaging.list.status_closed')}</option>
                        </select>
                    </div>

                    {/* Priority Select */}
                    <div className="flex items-center gap-2 min-w-[140px]">
                        <label className="text-[8px] font-bold uppercase tracking-widest opacity-40 shrink-0">{t('messaging.list.priority_label')}</label>
                        <select
                            name="priority"
                            value={filters.priority}
                            onChange={handleFilterChange}
                            className="ic px-3 py-2 rounded-xl bg-black/[0.01] dark:bg-white/5 border-black/5 dark:border-white/5 focus:bg-white transition-all text-[11px] font-semibold dark:text-white h-9 w-full"
                        >
                            <option value="">{t('messaging.list.priority_all')}</option>
                            <option value="LOW">{t('messaging.list.priority_low')}</option>
                            <option value="MEDIUM">{t('messaging.list.priority_medium')}</option>
                            <option value="HIGH">{t('messaging.list.priority_high')}</option>
                            <option value="URGENT">{t('messaging.list.priority_urgent')}</option>
                        </select>
                    </div>

                    {/* Property Select */}
                    <div className="flex items-center gap-2 min-w-[180px]">
                        <label className="text-[8px] font-bold uppercase tracking-widest opacity-40 shrink-0">{t('messaging.list.property_label')}</label>
                        <select
                            name="property"
                            value={filters.property}
                            onChange={handleFilterChange}
                            className="ic px-3 py-2 rounded-xl bg-black/[0.01] dark:bg-white/5 border-black/5 dark:border-white/5 focus:bg-white transition-all text-[11px] font-semibold dark:text-white h-9 w-full"
                        >
                            <option value="">{t('messaging.list.property_all')}</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Reset Button */}
                    <button
                        onClick={resetFilters}
                        className="px-4 h-9 rounded-xl bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 shadow-sm hover:bg-black hover:text-white transition-all text-[8px] font-bold uppercase tracking-widest dark:text-white shrink-0 ml-auto"
                    >
                        {t('messaging.list.btn_reset')}
                    </button>
                </div>
            </div>

            <div className="space-y-4 md:space-y-6">
                {tickets.length === 0 ? (
                    <div className="solaris-glass rounded-[1.5rem] md:rounded-[2.5rem] p-12 md:p-32 text-center border-none shadow-xl mt-6 md:mt-10">
                        <div className="mx-auto h-24 w-24 rounded-full bg-black/[0.03] flex items-center justify-center mb-10">
                            <MessageSquare className="h-10 w-10 text-black/10" />
                        </div>
                        <h3 className="text-[14px] font-bold uppercase tracking-[0.2em] mb-4">{t('messaging.list.empty_title')}</h3>
                        <p className="text-[10px] font-semibold uppercase tracking-widest opacity-30 max-w-xs mx-auto leading-relaxed">
                            {t('messaging.list.empty_desc')}
                        </p>
                    </div>
                ) : (
                    tickets.map((ticket) => {
                        const status = getStatusConfig(ticket.status);
                        return (
                            <Link
                                key={ticket.id}
                                to={`/dashboard/tickets/${ticket.id}`}
                                className={cn(
                                    "solaris-glass rounded-[1rem] md:rounded-[1.5rem] border-none shadow-sm p-4 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6 group hover:shadow-lg transition-all duration-500 relative overflow-hidden",
                                    ticket.unread_messages_count > 0 && "before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-red-600 before:shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                                )}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6 flex-1 min-w-0">
                                    <div className={cn(
                                        "h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110 duration-500 shrink-0",
                                        ticket.status === 'OPEN' ? "bg-black" : "bg-black/40"
                                    )}>
                                        <status.icon className="h-5 w-5 md:h-6 md:w-6" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                            <h3 className="text-sm md:text-base font-bold uppercase tracking-tight group-hover:text-red-600 transition-colors truncate">
                                                {ticket.subject}
                                            </h3>
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[8px] md:text-[9px] font-bold uppercase tracking-widest whitespace-nowrap",
                                                status.bg, status.color
                                            )}>
                                                {status.label}
                                            </span>
                                            {ticket.unread_messages_count > 0 && (
                                                <span className="flex items-center gap-2 px-2 py-0.5 bg-red-600 text-white rounded-full text-[7px] font-bold uppercase tracking-wider animate-pulse">
                                                    {ticket.unread_messages_count}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-[10px] font-medium text-black/40 dark:text-white/40 line-clamp-1 mb-4 uppercase tracking-wider">
                                            {ticket.last_message || t('messaging.list.waiting_comm')}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-1.5 bg-black/[0.03] dark:bg-white/5 px-2 py-1 rounded-lg border border-black/5 dark:border-white/5">
                                                <span className="text-[8px] font-bold uppercase tracking-widest opacity-30">{t('messaging.list.id')}</span>
                                                <span className="text-[10px] font-bold font-mono">#{ticket.id}</span>
                                            </div>

                                            {ticket.property_name && (
                                                <div className="flex items-center gap-1.5 opacity-60">
                                                    <AlertCircle className="h-3 w-3" />
                                                    <span className="text-[9px] font-semibold uppercase tracking-widest">{ticket.property_name}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-1.5 opacity-60">
                                                <Clock className="h-3 w-3" />
                                                <span className="text-[9px] font-semibold uppercase tracking-widest">
                                                    {format(new Date(ticket.created_at), 'd MMM yyyy', { locale: dateLocale })}
                                                </span>
                                            </div>

                                            <div className={cn(
                                                "flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5",
                                                getPriorityColor(ticket.priority)
                                            )}>
                                                <span className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-40">{t('messaging.list.priority_label')}</span>
                                                <span className="text-[8px] font-bold uppercase tracking-widest">
                                                    {ticket.priority_display || ticket.priority}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end">
                                    <div className="flex items-center gap-2 text-black dark:text-white lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-500 lg:group-hover:translate-x-1">
                                        <span className="text-[9px] font-bold uppercase tracking-widest">{t('messaging.list.details')}</span>
                                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
