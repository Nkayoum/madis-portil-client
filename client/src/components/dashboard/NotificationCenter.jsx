import { useState, useEffect } from 'react';
import { Bell, Check, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/');
            const data = res.data.results || res.data;
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Refresh every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/`, { is_read: true });
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    };

    const markAllAsRead = async () => {
        setLoading(true);
        try {
            const unread = notifications.filter(n => !n.is_read);
            await Promise.all(unread.map(n => api.patch(`/notifications/${n.id}/`, { is_read: true })));
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark all as read', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors relative"
                title="Notifications"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary rounded-full ring-2 ring-background" />
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-card border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="font-semibold">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    disabled={loading}
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                    Tout lire
                                </button>
                            )}
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "p-4 border-b last:border-0 hover:bg-accent/50 transition-colors relative group",
                                            !notification.is_read && "bg-primary/5"
                                        )}
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className={cn("text-xs font-bold leading-tight", !notification.is_read ? "text-foreground" : "text-muted-foreground")}>
                                                {notification.title}
                                            </h4>
                                            {!notification.is_read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="p-1 hover:bg-primary/10 rounded-full text-primary transition-colors"
                                                    title="Marquer comme lu"
                                                >
                                                    <Check className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-[10px] text-muted-foreground">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
                                            </span>
                                            {notification.link && (
                                                <Link
                                                    to={notification.link}
                                                    onClick={() => {
                                                        markAsRead(notification.id);
                                                        setIsOpen(false);
                                                    }}
                                                    className="text-[10px] text-primary hover:underline flex items-center gap-1"
                                                >
                                                    Voir <ExternalLink className="h-2 w-2" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">Aucune notification</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
