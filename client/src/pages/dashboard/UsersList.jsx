import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { Users, Search, MoreHorizontal, Shield, UserCheck, Loader2, Plus, UserX, HardHat, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';


export default function UsersList() {
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'fr' ? fr : enUS;
    const { showToast } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);



    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/auth/users/');
            setUsers(response.data.results || []);
        } catch (err) {
            setError(t('users.list.load_error'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('users.list.confirm_delete'))) {
            return;
        }

        try {
            await api.delete(`/auth/users/${id}/`);
            setUsers(users.filter(u => u.id !== id));
            showToast({ message: t('users.list.toast_delete_success'), type: 'success' });
        } catch (err) {
            console.error(err);
            showToast({ message: t('users.list.toast_delete_error'), type: 'error' });
        }
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.first_name.toLowerCase().includes(search.toLowerCase()) ||
        user.last_name.toLowerCase().includes(search.toLowerCase())
    );

    const getRoleBadge = (role) => {
        switch (role) {
            case 'ADMIN_MADIS':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"><Shield className="w-3 h-3 mr-1" /> {t('users.list.role_admin')}</span>;
            case 'CHEF_CHANTIER':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"><HardHat className="w-3 h-3 mr-1" /> {t('users.list.role_chef')}</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"><UserCheck className="w-3 h-3 mr-1" /> {t('users.list.role_client')}</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center p-4 bg-destructive/10 dark:bg-destructive/20 rounded-full mb-4">
                    <UserX className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-xl font-bold mb-2">{t('users.list.access_denied')}</h2>
                <p className="text-muted-foreground">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-24 animate-fade-in">
            {/* Standard Solaris Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-black/5 dark:border-white/5">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">{t('users.list.overview')}</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight md:leading-none">
                        {t('users.list.title')} <span className="opacity-40">{t('users.list.subtitle')}</span>
                    </h1>
                </div>
                <Link
                    to="/dashboard/users/new"
                    className="h-10 px-6 rounded-2xl bg-primary text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-primary/20"
                >
                    <Plus className="h-4 w-4" />
                    {t('users.list.btn_new')}
                </Link>
            </div>

            {/* Solaris Search Bar */}
            <div className="max-w-xl">
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground dark:text-white/20 transition-colors group-focus-within:text-primary" />
                    <input
                        type="text"
                        placeholder={t('users.list.search_placeholder')}
                        className="h-16 w-full rounded-[1.25rem] solaris-glass border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/60 px-6 pl-16 text-[10px] font-bold uppercase tracking-widest placeholder:text-muted-foreground/40 focus:bg-white dark:focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Solaris Data Grid */}
            <div className="solaris-glass rounded-[3rem] border border-white/20 dark:border-white/5 overflow-hidden shadow-2xl dark:bg-black/40">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/5">
                                <th className="px-8 py-6 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t('users.list.col_user')}</th>
                                <th className="px-8 py-6 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t('users.list.col_role')}</th>
                                <th className="px-8 py-6 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t('users.list.col_status')}</th>
                                <th className="px-8 py-6 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t('users.list.col_joined')}</th>
                                <th className="px-8 py-6 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t('users.list.col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-white/40 dark:hover:bg-white/[0.03] transition-colors group">
                                    <td className="px-8 py-8">
                                        <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 rounded-2xl bg-zinc-900 dark:bg-white/10 flex items-center justify-center text-white text-sm font-bold shadow-xl group-hover:scale-110 transition-transform">
                                                {user.first_name?.[0]}{user.last_name?.[0]}
                                            </div>
                                            <div>
                                                <div className="text-base font-bold tracking-tight group-hover:text-primary transition-colors">
                                                    {user.first_name} {user.last_name}
                                                </div>
                                                <div className="text-[10px] font-semibold text-muted-foreground uppercase opacity-60 font-mono tracking-tight">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-8">
                                        {getRoleBadge(user.role)}
                                    </td>
                                    <td className="px-8 py-8">
                                        {user.is_active ? (
                                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 text-green-600 text-[9px] font-bold uppercase tracking-widest border border-green-200/20">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                {t('users.list.status_active')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 text-rose-600 text-[9px] font-bold uppercase tracking-widest border border-rose-200/20">
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                {t('users.list.status_suspended')}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-8">
                                        <span className="text-[10px] font-bold text-muted-foreground/60 font-mono">
                                            {format(new Date(user.date_joined || user.created_at || new Date()), 'dd/MM/yyyy', { locale: dateLocale })}
                                        </span>
                                    </td>
                                    <td className="px-8 py-8 text-right underline-offset-4">
                                        <div className="flex items-center justify-end gap-3 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                            <Link
                                                to={`/dashboard/users/${user.id}/edit`}
                                                className="p-3 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/5 rounded-xl text-muted-foreground dark:text-white/60 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white/20 transition-all shadow-sm"
                                                title={t('users.list.btn_edit')}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 rounded-xl text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                title={t('users.list.btn_delete')}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="h-24 w-24 rounded-[2rem] bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-8 shadow-inner">
                            <Users className="h-10 w-10 text-slate-200 dark:text-white/10" />
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight mb-2">{t('users.list.empty_title')}</h3>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground opacity-60 max-w-xs">
                            {t('users.list.empty_desc')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
