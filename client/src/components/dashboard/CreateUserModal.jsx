import { useState } from 'react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { UserPlus, Loader2, Mail, Lock, Shield, X, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function CreateUserModal({ isOpen, onClose, onSuccess }) {
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
            showToast({ message: 'Utilisateur créé avec succès !', type: 'success' });
            if (onSuccess) onSuccess();
            onClose();
            // Reset form
            setFormData({ first_name: '', last_name: '', email: '', password: '', role: 'CLIENT' });
        } catch (err) {
            console.error(err);
            let msg = 'Erreur lors de la création.';
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

    if (!isOpen) return null;

    const ic = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none transition-all";

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <UserPlus className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Nouvel <span className="text-primary tracking-tight">Utilisateur</span></h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <form id="create-user-form" onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Prénom *</label>
                            <input type="text" name="first_name" required className={ic} placeholder="Jean" value={formData.first_name} onChange={handleChange} />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Nom *</label>
                            <input type="text" name="last_name" required className={ic} placeholder="Dupont" value={formData.last_name} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Email *</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input type="email" name="email" required className={`${ic} pl-9`} placeholder="jean@email.com" value={formData.email} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Mot de passe *</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input type="password" name="password" required minLength={8} className={`${ic} pl-9`} placeholder="••••••••" value={formData.password} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">Rôle</label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <select name="role" className={`${ic} pl-9`} value={formData.role} onChange={handleChange}>
                                <option value="CLIENT">Client</option>
                                <option value="CHEF_CHANTIER">Chef de Chantier</option>
                                <option value="ADMIN_MADIS">Administrateur MaDis</option>
                            </select>
                        </div>
                    </div>
                </form>

                <div className="flex justify-end gap-3 p-6 border-t bg-muted/30">
                    <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                        Annuler
                    </button>
                    <button form="create-user-form" type="submit" disabled={loading} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-6 disabled:opacity-50 transition-all font-bold">
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Création...</> : <><UserPlus className="mr-2 h-4 w-4" /> Créer l'utilisateur</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
