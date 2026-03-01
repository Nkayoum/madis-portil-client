import { useState, useEffect } from 'react';
import { Bell, Check, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

export default function NotificationCenter() {
    const { t, i18n } = useTranslation();
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
                    <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
                    <div className="fixed inset-x-4 top-16 sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-4 sm:w-96 bg-white dark:bg-[#0a1628] rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] z-[101] overflow-hidden animate-in fade-in zoom-in duration-300 border border-black/10 dark:border-white/10">
                        <div className="p-3.5 sm:p-6 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-gray-50 dark:bg-white/5">
                            <h3 className="text-sm sm:text-xl font-black uppercase tracking-widest sm:tracking-tighter">{t('notification_center.title')}</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    disabled={loading}
                                    className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                    {t('notification_center.btn_read_all')}
                                </button>
                            )}
                        </div>

                        <div className="max-h-[32rem] overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "p-4 sm:p-6 border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/5 transition-all relative group",
                                            !notification.is_read && "bg-primary/[0.05] dark:bg-primary/[0.03] border-l-4 border-l-primary"
                                        )}
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <h4 className={cn(
                                                "text-[13px] sm:text-sm font-bold tracking-tight leading-snug",
                                                !notification.is_read ? "text-foreground" : "text-muted-foreground"
                                            )}>
                                                {notification.title}
                                            </h4>
                                            {!notification.is_read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="p-1.5 sm:p-2 bg-primary/10 hover:bg-primary/20 rounded-full text-primary transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                                    title={t('notification_center.btn_mark_read')}
                                                >
                                                    <Check className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-[11px] sm:text-xs text-muted-foreground/80 mt-1 sm:mt-2 leading-relaxed line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <div className="flex justify-between items-center mt-3 sm:mt-4">
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: i18n.language === 'fr' ? fr : enUS })}
                                            </span>
                                            {notification.link && (
                                                <Link
                                                    to={notification.link}
                                                    onClick={() => {
                                                        markAsRead(notification.id);
                                                        setIsOpen(false);
                                                    }}
                                                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors"
                                                >
                                                    {t('notification_center.btn_view')} <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="h-16 w-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Bell className="h-8 w-8 text-muted-foreground opacity-20" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('notification_center.empty_text')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
