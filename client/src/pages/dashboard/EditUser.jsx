import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { Save, Loader2, Mail, Shield, User, Phone, CheckCircle2, XCircle, Lock, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

export default function EditUser() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [resetingPassword, setResetingPassword] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'CLIENT',
        is_active: true,
    });

    const fetchUser = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get(`/auth/users/${id}/`);
            const data = response.data;
            setFormData({
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                email: data.email || '',
                phone: data.phone || '',
                role: data.role || 'CLIENT',
                is_active: data.is_active ?? true,
            });
        } catch (err) {
            console.error(err);
            showToast({ message: t('users.edit.toast_load_error'), type: 'error' });
            navigate('/dashboard/users');
        } finally {
            setLoading(false);
        }
    }, [id, navigate, showToast, t]);

    useEffect(() => {
        if (id) {
            fetchUser();
        }
    }, [id, fetchUser]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 8) {
            showToast({ message: t('users.edit.toast_pwd_length'), type: 'error' });
            return;
        }

        setResetingPassword(true);
        try {
            await api.post(`/auth/users/${id}/set-password/`, { new_password: newPassword });
            showToast({ message: t('users.edit.toast_pwd_success'), type: 'success' });
            setNewPassword('');
        } catch (err) {
            console.error(err);
            showToast({ message: t('users.edit.toast_pwd_error'), type: 'error' });
        } finally {
            setResetingPassword(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.patch(`/auth/users/${id}/`, formData);
            showToast({ message: t('users.edit.toast_success'), type: 'success' });
            navigate('/dashboard/users');
        } catch (err) {
            console.error(err);
            let msg = t('users.edit.toast_error');
            if (err.response?.data) {
                const data = err.response.data;
                if (typeof data === 'object') {
                    const firstErr = Object.values(data)[0];
                    if (Array.isArray(firstErr)) msg = firstErr[0];
                }
            }
            showToast({ message: msg, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const ic = "h-14 w-full rounded-2xl solaris-glass border border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/5 px-6 text-[10px] font-black uppercase tracking-widest placeholder:text-muted-foreground/40 focus:bg-white dark:focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm dark:text-white";

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

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
                        Modifier <span className="text-primary italic">l'Utilisateur</span>
                    </h1>
                    <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider opacity-60">Mise à jour des profils d'accès.</p>
                </div>
            </div>

            <div className="solaris-glass rounded-[2.5rem] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden">
                <div className="p-6 sm:p-12 space-y-16">
                    {/* Information Form */}
                    <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2 px-1">{t('users.edit.first_name')}</label>
                                <input type="text" name="first_name" required className={ic} placeholder="JEAN" value={formData.first_name} onChange={handleChange} />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2 px-1">{t('users.edit.last_name')}</label>
                                <input type="text" name="last_name" required className={ic} placeholder="DUPONT" value={formData.last_name} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2 px-1">
                                <Mail className="h-3.5 w-3.5" />
                                {t('users.edit.email')}
                            </label>
                            <input type="email" name="email" required className={ic} placeholder="JEAN@MADIS.COM" value={formData.email} onChange={handleChange} />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2 px-1">
                                <Phone className="h-3.5 w-3.5" />
                                {t('users.edit.phone')}
                            </label>
                            <input type="text" name="phone" className={ic} placeholder="+33 6 12 34 56 78" value={formData.phone} onChange={handleChange} />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2 px-1">
                                <Shield className="h-3.5 w-3.5" />
                                {t('users.edit.role')}
                            </label>
                            <select name="role" className={cn(ic, "appearance-none")} value={formData.role} onChange={handleChange}>
                                <option value="CLIENT">{t('users.edit.role_client')}</option>
                                <option value="CHEF_CHANTIER">{t('users.edit.role_chef')}</option>
                                <option value="ADMIN_MADIS">{t('users.edit.role_admin')}</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-6 p-6 sm:p-8 rounded-[2rem] bg-black/[0.02] border border-black/5">
                            <label className="flex items-center gap-6 cursor-pointer select-none">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-14 h-8 bg-zinc-200 peer-checked:bg-primary rounded-full transition-all duration-300 shadow-inner"></div>
                                    <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 peer-checked:left-7 shadow-lg"></div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest mb-1">{t('users.edit.status_label')}</div>
                                    <div className="text-[9px] uppercase tracking-wider font-bold">
                                        {formData.is_active ?
                                            <span className="text-emerald-500 flex items-center gap-1.5"><CheckCircle2 className="w-3 w-3" /> {t('users.edit.status_active')}</span> :
                                            <span className="text-rose-500 flex items-center gap-1.5"><XCircle className="w-3 w-3" /> {t('users.edit.status_revoked')}</span>
                                        }
                                    </div>
                                </div>
                            </label>
                        </div>
                    </form>

                    {/* Password Reset Section */}
                    <div className="pt-16 border-t border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-500 mb-8 px-1">
                            <Lock className="h-4 w-4" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">{t('users.edit.security_title')}</h3>
                        </div>
                        <div className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 dark:border-rose-500/20 rounded-[2.5rem] p-6 sm:p-10">
                            <p className="text-[9px] sm:text-[10px] text-rose-700/60 dark:text-rose-400/80 mb-8 font-bold uppercase tracking-widest leading-relaxed">
                                {t('users.edit.security_desc')}
                            </p>
                            <form onSubmit={handlePasswordReset} className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative group">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-500/40 transition-colors group-focus-within:text-rose-500" />
                                    <input
                                        type="password"
                                        className="h-14 w-full rounded-2xl bg-white dark:bg-white/5 border border-rose-500/10 dark:border-rose-500/30 px-6 pl-14 text-[10px] font-black uppercase tracking-widest placeholder:text-rose-500/20 focus:outline-none focus:ring-4 focus:ring-rose-500/5 transition-all shadow-sm dark:text-white"
                                        placeholder={t('users.edit.new_password_placeholder')}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        minLength={8}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={resetingPassword || !newPassword}
                                    className="h-14 px-10 rounded-2xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center shadow-lg shadow-rose-600/20 disabled:opacity-50"
                                >
                                    {resetingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : t('users.edit.btn_reset')}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Action Footer - Glassmorphism style without sticky behavior */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-t border-black/5 bg-white/40 dark:bg-black/20 backdrop-blur-md">
                    <Link to="/dashboard/users" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-black dark:hover:text-white transition-all px-4">
                        {t('users.edit.btn_cancel')}
                    </Link>
                    <button
                        form="edit-user-form"
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center justify-center rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all bg-black dark:bg-primary text-white hover:bg-black/90 dark:hover:bg-primary/90 h-11 px-8 sm:px-12 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.3)] disabled:opacity-50 group whitespace-nowrap active:scale-95"
                    >
                        {saving ? (
                            <><Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-3" /> {t('users.edit.btn_submitting')}</>
                        ) : (
                            <><Save className="h-4 w-4 sm:h-5 sm:w-5 mr-3 group-hover:scale-110 transition-transform" /> {t('users.edit.btn_submit')}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
