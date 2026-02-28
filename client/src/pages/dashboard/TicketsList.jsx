import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Plus, Loader2, Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../../lib/utils';

export default function TicketsList() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
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
            setError('Impossible de charger les tickets.');
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
                return { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', icon: AlertCircle, label: 'Ouvert' };
            case 'IN_PROGRESS':
                return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', icon: Clock, label: 'En cours' };
            case 'CLOSED':
                return { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', icon: CheckCircle2, label: 'Fermé' };
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
                    <h1 className="text-2xl md:text-4xl font-bold tracking-tight uppercase leading-tight md:leading-none mb-2 md:mb-3">Messagerie</h1>
                    <p className="text-[9px] md:text-[11px] font-semibold uppercase tracking-wider opacity-60">Gestion et suivi des protocoles de communication avec l'assistance MaDis.</p>
                </div>
                <Link
                    to="/dashboard/tickets/new"
                    className="inline-flex items-center justify-center rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all bg-black dark:bg-primary text-white hover:bg-black/90 dark:hover:bg-primary/90 h-11 md:h-14 px-6 md:px-10 shadow-xl shadow-black/10 dark:shadow-[0_0_30px_rgba(255,0,72,0.4),0_0_60px_rgba(255,0,72,0.15)] dark:hover:shadow-[0_0_40px_rgba(255,0,72,0.6),0_0_80px_rgba(255,0,72,0.2)] group whitespace-nowrap w-fit"
                >
                    <Plus className="mr-2 md:mr-3 h-4 w-4 md:h-5 md:w-5 group-hover:rotate-90 transition-transform duration-500" />
                    Nouveau ticket
                </Link>
            </div>

            {/* Filters Bar Solaris Style */}
            <div className="solaris-glass rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-10 border-none shadow-xl space-y-6 md:space-y-8">
                <div className="flex items-center gap-3 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">
                    <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    Console de Recherche et Filtrage
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5 md:gap-6">
                    <div className="space-y-2 md:space-y-3 lg:col-span-4">
                        <label className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">Sujet / Recherche</label>
                        <input
                            type="text"
                            placeholder="Rechercher une conversation..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ic w-full p-3.5 rounded-2xl bg-black/[0.01] dark:bg-white/5 border-black/5 dark:border-white/5 focus:bg-white dark:focus:bg-white/10 transition-all text-[12px] font-bold dark:text-white"
                        />
                    </div>

                    <div className="space-y-3 lg:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">État</label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="ic w-full p-3.5 rounded-2xl bg-black/[0.01] dark:bg-white/5 border-black/5 dark:border-white/5 focus:bg-white dark:focus:bg-white/10 transition-all text-[12px] font-bold dark:text-white"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="OPEN">Ouvert</option>
                            <option value="IN_PROGRESS">En cours</option>
                            <option value="CLOSED">Fermé</option>
                        </select>
                    </div>

                    <div className="space-y-3 lg:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">Niveau d'Urgence</label>
                        <select
                            name="priority"
                            value={filters.priority}
                            onChange={handleFilterChange}
                            className="ic w-full p-3.5 rounded-2xl bg-black/[0.01] dark:bg-white/5 border-black/5 dark:border-white/5 focus:bg-white dark:focus:bg-white/10 transition-all text-[12px] font-bold dark:text-white"
                        >
                            <option value="">Toutes priorités</option>
                            <option value="LOW">Basse (Low)</option>
                            <option value="MEDIUM">Moyenne (Medium)</option>
                            <option value="HIGH">Haute (High)</option>
                            <option value="URGENT">Critique (Urgent)</option>
                        </select>
                    </div>

                    <div className="space-y-3 lg:col-span-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">Actif Immobilier</label>
                        <select
                            name="property"
                            value={filters.property}
                            onChange={handleFilterChange}
                            className="ic w-full p-3.5 rounded-2xl bg-black/[0.01] dark:bg-white/5 border-black/5 dark:border-white/5 focus:bg-white dark:focus:bg-white/10 transition-all text-[12px] font-bold dark:text-white"
                        >
                            <option value="">Tous les biens</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end lg:col-span-1">
                        <button
                            onClick={resetFilters}
                            className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 shadow-sm hover:bg-black dark:hover:bg-white/20 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest w-full h-[46px] dark:text-white"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-4 md:space-y-6">
                {tickets.length === 0 ? (
                    <div className="solaris-glass rounded-[1.5rem] md:rounded-[2.5rem] p-12 md:p-32 text-center border-none shadow-xl mt-6 md:mt-10">
                        <div className="mx-auto h-24 w-24 rounded-full bg-black/[0.03] flex items-center justify-center mb-10">
                            <MessageSquare className="h-10 w-10 text-black/10" />
                        </div>
                        <h3 className="text-[14px] font-bold uppercase tracking-[0.2em] mb-4">Archives Vierges</h3>
                        <p className="text-[10px] font-semibold uppercase tracking-widest opacity-30 max-w-xs mx-auto leading-relaxed">
                            Aucun protocole de communication n'est actuellement actif dans votre registre.
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
                                    "solaris-glass rounded-[1.25rem] md:rounded-[2rem] border-none shadow-xl p-5 md:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8 group hover:shadow-2xl transition-all duration-500 relative overflow-hidden",
                                    ticket.unread_messages_count > 0 && "before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-red-600 before:shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                                )}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-6 md:gap-10 flex-1 min-w-0">
                                    <div className={cn(
                                        "h-14 w-14 md:h-16 md:w-16 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform group-hover:scale-110 duration-500 shrink-0",
                                        ticket.status === 'OPEN' ? "bg-black" : "bg-black/40"
                                    )}>
                                        <status.icon className="h-6 w-6 md:h-7 md:w-7" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3 mb-3">
                                            <h3 className="text-lg md:text-xl font-bold uppercase tracking-tight group-hover:text-red-600 transition-colors truncate">
                                                {ticket.subject}
                                            </h3>
                                            <span className={cn(
                                                "px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest whitespace-nowrap",
                                                status.bg, status.color
                                            )}>
                                                {status.label}
                                            </span>
                                            {ticket.unread_messages_count > 0 && (
                                                <span className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-full text-[8px] font-bold uppercase tracking-wider animate-pulse">
                                                    {ticket.unread_messages_count} Nouveau(x)
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-[11px] font-semibold text-black/40 dark:text-white/40 line-clamp-1 mb-6 uppercase tracking-wider">
                                            {ticket.last_message || "En attente de communication..."}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-6">
                                            <div className="flex items-center gap-2 bg-black/[0.03] dark:bg-white/5 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5">
                                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-30">ID</span>
                                                <span className="text-[11px] font-black font-mono">#{ticket.id}</span>
                                            </div>

                                            {ticket.property_name && (
                                                <div className="flex items-center gap-2 opacity-60">
                                                    <AlertCircle className="h-3.5 w-3.5" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{ticket.property_name}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 opacity-60">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                                    {format(new Date(ticket.created_at), 'd MMM yyyy', { locale: fr })}
                                                </span>
                                            </div>

                                            <div className={cn(
                                                "flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5",
                                                getPriorityColor(ticket.priority)
                                            )}>
                                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40">Priorité</span>
                                                <span className="text-[9px] font-bold uppercase tracking-widest">
                                                    {ticket.priority_display || ticket.priority}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end">
                                    <div className="flex items-center gap-3 text-black dark:text-white lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-500 lg:group-hover:translate-x-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Ouvrir le registre</span>
                                        <ArrowRight className="h-4 w-4" />
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
