import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { Save, Loader2, Mail, Shield, User, Phone, CheckCircle2, XCircle, Lock, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function EditUserModal({ isOpen, onClose, userId, onSuccess }) {
    const { t } = useTranslation();
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

    useEffect(() => {
        if (isOpen && userId) {
            fetchUser();
        }
    }, [isOpen, userId]);

    const fetchUser = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/auth/users/${userId}/`);
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
            showToast({ message: t('user_modal.toast_load_error'), type: 'error' });
            onClose();
        } finally {
            setLoading(false);
        }
    };

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
            showToast({ message: t('user_modal.pwd_min_error'), type: 'error' });
            return;
        }

        setResetingPassword(true);
        try {
            await api.post(`/auth/users/${userId}/set-password/`, { new_password: newPassword });
            showToast({ message: t('user_modal.toast_pwd_success'), type: 'success' });
            setNewPassword('');
        } catch (err) {
            console.error(err);
            showToast({ message: t('user_modal.toast_pwd_error'), type: 'error' });
        } finally {
            setResetingPassword(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.patch(`/auth/users/${userId}/`, formData);
            showToast({ message: t('user_modal.toast_update_success'), type: 'success' });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            let msg = t('user_modal.toast_update_error');
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

    if (!isOpen) return null;

    const ic = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none transition-all";

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b bg-muted/30 sticky top-0 bg-card z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">{t('user_modal.title_edit')} <span className="text-primary tracking-tight">{t('user_modal.title_highlight')}</span></h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                {loading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="p-6 space-y-8">
                        {/* Information Form */}
                        <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">{t('user_modal.label_first_name')}</label>
                                    <input type="text" name="first_name" required className={ic} placeholder={t('user_modal.ph_first_name')} value={formData.first_name} onChange={handleChange} />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">{t('user_modal.label_last_name')}</label>
                                    <input type="text" name="last_name" required className={ic} placeholder={t('user_modal.ph_last_name')} value={formData.last_name} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase">{t('user_modal.label_email')}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input type="email" name="email" required className={`${ic} pl-9`} placeholder={t('user_modal.ph_email')} value={formData.email} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase">{t('user_modal.label_phone')}</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input type="text" name="phone" className={`${ic} pl-9`} placeholder={t('user_modal.ph_phone')} value={formData.phone} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">{t('user_modal.label_role')}</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <select name="role" className={`${ic} pl-9`} value={formData.role} onChange={handleChange}>
                                        <option value="CLIENT">{t('user_modal.role_client')}</option>
                                        <option value="CHEF_CHANTIER">{t('user_modal.role_manager')}</option>
                                        <option value="ADMIN_MADIS">{t('user_modal.role_admin')}</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 py-3 px-4 rounded-xl bg-muted/30 border border-dashed">
                                <label className="text-sm font-medium flex items-center gap-3 cursor-pointer select-none">
                                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="h-5 w-5 rounded-md border-input text-primary focus:ring-primary/20 accent-primary" />
                                    <span>{t('user_modal.label_active')}</span>
                                </label>
                                <div className="text-[10px] font-bold uppercase tracking-wider">
                                    {formData.is_active ?
                                        <span className="text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> {t('user_modal.label_authorized')}</span> :
                                        <span className="text-rose-600 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> {t('user_modal.label_blocked')}</span>
                                    }
                                </div>
                            </div>
                        </form>

                        {/* Password Reset Section */}
                        <div className="pt-6 border-t">
                            <div className="flex items-center gap-2 text-rose-600 mb-4">
                                <Lock className="h-4 w-4" />
                                <h3 className="text-sm font-bold uppercase tracking-wider">{t('user_modal.title_reset_pwd')}</h3>
                            </div>
                            <form onSubmit={handlePasswordReset} className="flex gap-3">
                                <div className="flex-1 relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input type="password" className={`${ic} pl-9`} placeholder={t('user_modal.ph_new_password')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} />
                                </div>
                                <button type="submit" disabled={resetingPassword || !newPassword} className="inline-flex items-center justify-center rounded-md text-xs font-bold px-4 h-10 bg-rose-100 text-rose-700 hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50">
                                    {resetingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : t('user_modal.btn_refresh')}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 p-6 border-t bg-muted/30">
                    <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                        {t('user_modal.btn_cancel')}
                    </button>
                    <button form="edit-user-form" type="submit" disabled={saving || loading} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-6 disabled:opacity-50 transition-all font-bold">
                        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('user_modal.btn_saving')}</> : <><Save className="mr-2 h-4 w-4" /> {t('user_modal.btn_save')}</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
