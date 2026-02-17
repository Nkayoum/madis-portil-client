import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import { Save, Loader2, Mail, Shield, User, Phone, CheckCircle2, XCircle, Lock, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EditUser() {
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

    useEffect(() => {
        if (id) {
            fetchUser();
        }
    }, [id]);

    const fetchUser = async () => {
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
            showToast({ message: "Impossible de charger les données du client.", type: 'error' });
            navigate('/dashboard/users');
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
            showToast({ message: 'Le mot de passe doit faire au moins 8 caractères.', type: 'error' });
            return;
        }

        setResetingPassword(true);
        try {
            await api.post(`/auth/users/${id}/set-password/`, { new_password: newPassword });
            showToast({ message: 'Mot de passe mis à jour avec succès !', type: 'success' });
            setNewPassword('');
        } catch (err) {
            console.error(err);
            showToast({ message: 'Erreur lors du changement de mot de passe.', type: 'error' });
        } finally {
            setResetingPassword(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.patch(`/auth/users/${id}/`, formData);
            showToast({ message: 'Client mis à jour avec succès !', type: 'success' });
            navigate('/dashboard/users');
        } catch (err) {
            console.error(err);
            let msg = 'Erreur lors de la mise à jour.';
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

    const ic = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none transition-all";

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-20">
            <Link to="/dashboard/users" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Retour aux clients
            </Link>

            <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Modifier <span className="text-primary tracking-tight">le Client</span></h1>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1 italic">
                                {formData.first_name} {formData.last_name}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Information Form */}
                    <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">Prénom *</label>
                                <input type="text" name="first_name" required className={ic} placeholder="Jean" value={formData.first_name} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">Nom *</label>
                                <input type="text" name="last_name" required className={ic} placeholder="Dupont" value={formData.last_name} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5" />
                                Email *
                            </label>
                            <input type="email" name="email" required className={ic} placeholder="jean@email.com" value={formData.email} onChange={handleChange} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5" />
                                Téléphone
                            </label>
                            <input type="text" name="phone" className={ic} placeholder="+33 6 12 34 56 78" value={formData.phone} onChange={handleChange} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                                <Shield className="h-3.5 w-3.5" />
                                Rôle
                            </label>
                            <select name="role" className={ic} value={formData.role} onChange={handleChange}>
                                <option value="CLIENT">Client</option>
                                <option value="CHEF_CHANTIER">Chef de Chantier</option>
                                <option value="ADMIN_MADIS">Administrateur MaDis</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-4 py-4 px-6 rounded-2xl bg-muted/30 border border-dashed">
                            <label className="text-sm font-bold flex items-center gap-4 cursor-pointer select-none">
                                <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="h-6 w-6 rounded-md border-input text-primary focus:ring-primary/20 accent-primary" />
                                <div>
                                    <div className="text-sm">Compte Actif</div>
                                    <div className="text-[10px] uppercase tracking-wider mt-0.5 font-bold">
                                        {formData.is_active ?
                                            <span className="text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Accès Autorisé</span> :
                                            <span className="text-rose-600 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Accès Bloqué</span>
                                        }
                                    </div>
                                </div>
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t">
                            <Link to="/dashboard/users" className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-11 px-6 transition-all">
                                Annuler
                            </Link>
                            <button form="edit-user-form" type="submit" disabled={saving} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-11 px-8 disabled:opacity-50 transition-all font-bold">
                                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</> : <><Save className="mr-2 h-4 w-4" /> Enregistrer les modifications</>}
                            </button>
                        </div>
                    </form>

                    {/* Password Reset Section */}
                    <div className="pt-8 border-t">
                        <div className="flex items-center gap-2 text-rose-600 mb-4">
                            <Lock className="h-4 w-4" />
                            <h3 className="text-sm font-extrabold uppercase tracking-widest">Zone de Danger : Réinitialiser le mot de passe</h3>
                        </div>
                        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-xl p-6">
                            <p className="text-xs text-rose-800 dark:text-rose-300 mb-4 font-medium italic">Vous pouvez forcer la mise à jour du mot de passe de ce client. Le client devra utiliser ce nouveau mot de passe pour sa prochaine connexion.</p>
                            <form onSubmit={handlePasswordReset} className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <input type="password" className={`${ic} pl-10 h-11`} placeholder="Nouveau mot de passe (min 8 car.)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} />
                                </div>
                                <button type="submit" disabled={resetingPassword || !newPassword} className="inline-flex items-center justify-center rounded-md text-sm font-bold px-6 h-11 bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-md shadow-rose-600/20 disabled:opacity-50">
                                    {resetingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Réinitialiser"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
