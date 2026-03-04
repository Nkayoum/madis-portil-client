import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { UserPlus, Loader2, Mail, Lock, Shield, X, User, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

export default function CreateUser() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', password: '', role: 'CLIENT',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/users/', formData);
            showToast({ message: t('users.create.toast_success'), type: 'success' });
            navigate('/dashboard/users');
        } catch (err) {
            console.error(err);
            let msg = t('users.create.toast_error');
            if (err.response?.data) {
                const data = err.response.data;
                if (data.email) msg = data.email[0];
                else if (typeof data === 'object') {
                    const firstErr = Object.values(data)[0];
                    if (Array.isArray(firstErr)) msg = firstErr[0];
                }
            }
            showToast({ message: msg, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const ic = "h-14 w-full rounded-2xl solaris-glass border border-white/20 bg-white/40 px-6 text-[10px] font-black uppercase tracking-widest placeholder:text-muted-foreground/40 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm";

    return (
        <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 sm:px-6 animate-fade-in">
            <div className="flex items-center gap-4 sm:gap-6 mb-8 sm:mb-12">
                <Link
                    to="/dashboard/users"
                    className="p-3 bg-black text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all shrink-0"
                >
                    <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </Link>
                <div>
                    <h1 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase leading-none mb-1 sm:mb-2 text-foreground">
                        Nouveau <span className="text-primary italic">Utilisateur</span>
                    </h1>
                    <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider opacity-60">Initialisation d'un nouveau compte d'accès.</p>
                </div>
            </div>

            <div className="solaris-glass rounded-[2.5rem] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden">
                <form id="create-user-form" onSubmit={handleSubmit} className="p-6 sm:p-12 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2 px-1">
                                <User className="h-3.5 w-3.5" />
                                {t('users.create.first_name')}
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                required
                                className={ic}
                                placeholder="JEAN"
                                value={formData.first_name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2 px-1">
                                <User className="h-3.5 w-3.5" />
                                {t('users.create.last_name')}
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                required
                                className={ic}
                                placeholder="DUPONT"
                                value={formData.last_name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2 px-1">
                            <Mail className="h-3.5 w-3.5" />
                            {t('users.create.email')}
                        </label>
                        <input
                            type="email"
                            name="email"
                            required
                            className={ic}
                            placeholder="ADMIN@MADIS.COM"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2 px-1">
                            <Lock className="h-3.5 w-3.5" />
                            {t('users.create.password')}
                        </label>
                        <input
                            type="password"
                            name="password"
                            required
                            minLength={8}
                            className={ic}
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/40 px-1">{t('users.create.password_hint')}</p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2 px-1">
                            <Shield className="h-3.5 w-3.5" />
                            {t('users.create.role')}
                        </label>
                        <select
                            name="role"
                            className={cn(ic, "appearance-none")}
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <option value="CLIENT">{t('users.create.role_client')}</option>
                            <option value="CHEF_CHANTIER">{t('users.create.role_chef')}</option>
                            <option value="ADMIN_MADIS">{t('users.create.role_admin')}</option>
                        </select>
                    </div>
                </form>

                {/* Action Footer - Glassmorphism style without sticky behavior */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-t border-black/5 bg-white/40 dark:bg-black/20 backdrop-blur-md">
                    <Link
                        to="/dashboard/users"
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-black dark:hover:text-white transition-all px-4"
                    >
                        {t('users.create.btn_cancel')}
                    </Link>
                    <button
                        form="create-user-form"
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all bg-black dark:bg-primary text-white hover:bg-black/90 dark:hover:bg-primary/90 h-12 sm:h-14 px-8 sm:px-12 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.3)] disabled:opacity-50 group whitespace-nowrap"
                    >
                        {loading ? (
                            <><Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-3" /> {t('users.create.btn_submitting')}</>
                        ) : (
                            <><UserPlus className="h-4 w-4 sm:h-5 sm:w-5 mr-3 group-hover:scale-110 transition-transform" /> {t('users.create.btn_submit')}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
