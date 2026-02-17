import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import { UserPlus, Loader2, Mail, Lock, Shield, X, User, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CreateUser() {
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
            showToast({ message: 'Client créé avec succès !', type: 'success' });
            navigate('/dashboard/users');
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

    const ic = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none transition-all";

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <Link to="/dashboard/users" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Retour aux clients
            </Link>

            <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <UserPlus className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Nouvel <span className="text-primary tracking-tight">Client</span></h1>
                            <p className="text-sm text-muted-foreground">Créez un nouveau compte avec les accès appropriés.</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                                <User className="h-3.5 w-3.5" />
                                Prénom *
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                required
                                className={ic}
                                placeholder="Jean"
                                value={formData.first_name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                                <User className="h-3.5 w-3.5" />
                                Nom *
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                required
                                className={ic}
                                placeholder="Dupont"
                                value={formData.last_name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5" />
                            Email de connexion *
                        </label>
                        <input
                            type="email"
                            name="email"
                            required
                            className={ic}
                            placeholder="jean@email.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                            <Lock className="h-3.5 w-3.5" />
                            Mot de passe *
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
                        <p className="text-[10px] text-muted-foreground italic">Minimum 8 caractères.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                            <Shield className="h-3.5 w-3.5" />
                            Rôle & Permissions
                        </label>
                        <select
                            name="role"
                            className={ic}
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <option value="CLIENT">Client (Accès limité à ses biens)</option>
                            <option value="CHEF_CHANTIER">Chef de Chantier (Accès aux chantiers)</option>
                            <option value="ADMIN_MADIS">Administrateur MaDis (Tous les accès)</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 border-t">
                        <Link
                            to="/dashboard/users"
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-11 px-6 transition-all"
                        >
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-11 px-8 disabled:opacity-50 transition-all font-bold"
                        >
                            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Création...</> : <><UserPlus className="mr-2 h-4 w-4" /> Créer le client</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
