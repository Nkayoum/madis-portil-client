import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { UserPlus, Loader2, Mail, Lock, Shield, X, User, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
        <div className="max-w-3xl mx-auto space-y-12 pb-8 animate-fade-in">
            <Link
                to="/dashboard/users"
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all group"
            >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                {t('users.create.back')}
            </Link>

            <div className="solaris-glass rounded-[3rem] border border-white/20 overflow-hidden shadow-2xl">
                <div className="p-12 border-b border-black/5 bg-black/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white shadow-xl">
                            <UserPlus className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{t('users.create.pre_title')}</span>
                            </div>
                            <h1 className="text-4xl font-black tracking-tighter">
                                {t('users.create.title')} <span className="opacity-40">{t('users.create.subtitle')}</span>
                            </h1>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-12 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
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
                        <div className="space-y-3">
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

                    <div className="space-y-3">
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

                    <div className="space-y-3">
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

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2 px-1">
                            <Shield className="h-3.5 w-3.5" />
                            {t('users.create.role')}
                        </label>
                        <select
                            name="role"
                            className={ic}
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <option value="CLIENT">{t('users.create.role_client')}</option>
                            <option value="CHEF_CHANTIER">{t('users.create.role_chef')}</option>
                            <option value="ADMIN_MADIS">{t('users.create.role_admin')}</option>
                        </select>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-4 pt-10 border-t border-black/5">
                        <Link
                            to="/dashboard/users"
                            className="h-14 px-10 rounded-2xl solaris-glass border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm"
                        >
                            {t('users.create.btn_cancel')}
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-14 px-12 rounded-2xl bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-2xl disabled:opacity-50 whitespace-nowrap"
                        >
                            {loading ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> {t('users.create.btn_submitting')}</>
                            ) : (
                                <><UserPlus className="h-4 w-4" /> {t('users.create.btn_submit')}</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
