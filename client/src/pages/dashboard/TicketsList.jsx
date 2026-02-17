import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/axios';
import { MessageSquare, Plus, Loader2, Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function TicketsList() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const response = await api.get('/tickets/');
            setTickets(response.data.results || []);
        } catch (err) {
            setError('Impossible de charger les tickets.');
            console.error(err);
        } finally {
            setLoading(false);
        }
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

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">Messagerie</h1>
                    <p className="text-muted-foreground">Suivez vos échanges avec l'équipe MaDis.</p>
                </div>
                <Link
                    to="/dashboard/tickets/new"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau ticket
                </Link>
            </div>

            <div className="space-y-3">
                {tickets.length === 0 ? (
                    <div className="text-center py-16 bg-card rounded-xl border border-dashed">
                        <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <MessageSquare className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Aucun message</h3>
                        <p className="text-muted-foreground max-w-md mx-auto text-sm">
                            Vous n'avez pas encore de conversation en cours. Créez un ticket pour commencer.
                        </p>
                    </div>
                ) : (
                    tickets.map((ticket) => {
                        const status = getStatusConfig(ticket.status);
                        return (
                            <Link
                                key={ticket.id}
                                to={`/dashboard/tickets/${ticket.id}`}
                                className="group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-2.5 rounded-lg ${status.bg} ${status.color} mt-0.5`}>
                                        <status.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                            <h3 className="font-semibold group-hover:text-primary transition-colors">
                                                {ticket.subject}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.color} ${status.border}`}>
                                                {status.label}
                                            </span>
                                        </div>

                                        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                                            {ticket.last_message ? (
                                                <>
                                                    <span className="font-medium">Dernier message : </span>
                                                    {ticket.last_message}
                                                </>
                                            ) : (
                                                "Aucun message"
                                            )}
                                        </p>

                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">#{ticket.id}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {format(new Date(ticket.created_at), 'd MMM yyyy', { locale: fr })}
                                            </span>
                                            <span>•</span>
                                            <span className={`${getPriorityColor(ticket.priority)} px-1.5 py-0.5 rounded bg-muted`}>
                                                Priorité {ticket.priority_display || ticket.priority}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 md:mt-0 md:ml-4 flex items-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-sm font-medium mr-2">Ouvrir</span>
                                    <ArrowRight className="h-4 w-4" />
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
