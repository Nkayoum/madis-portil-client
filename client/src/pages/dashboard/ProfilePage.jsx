import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { User, Mail, Shield, Loader2, Save } from 'lucide-react';

export default function ProfilePage() {
    const { user, login } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.patch('/auth/user/', formData);
            showToast({ message: 'Profil mis à jour avec succès.', type: 'success' });
        } catch (err) {
            console.error(err);
            showToast({ message: 'Impossible de mettre à jour le profil.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center space-x-5">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                        <User className="h-8 w-8 text-primary" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mon Profil</h1>
                    <p className="text-muted-foreground mt-1">
                        Gérez vos informations personnelles et préférences de sécurité.
                    </p>
                </div>
            </div>

            <div className="bg-card border rounded-xl p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                        <div className="p-2 rounded-full bg-primary/10">
                            <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-primary">Rôle Actuel</p>
                            <p className="text-xs text-muted-foreground font-mono tracking-wider mt-0.5">{user?.role}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none">Prénom</label>
                            <input
                                type="text"
                                name="first_name"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={formData.first_name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none">Nom</label>
                            <input
                                type="text"
                                name="last_name"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={formData.last_name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium leading-none">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="email"
                                name="email"
                                disabled
                                className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 pl-9 text-sm text-muted-foreground cursor-not-allowed"
                                value={formData.email}
                            />
                        </div>
                        <p className="text-[0.8rem] text-muted-foreground">Pour modifier votre email, veuillez contacter le support.</p>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enregistrement...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Sauvegarder les modifications
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-card border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-lg mb-1">Sécurité du compte</h3>
                        <p className="text-sm text-muted-foreground">Changez votre mot de passe pour sécuriser votre compte.</p>
                    </div>
                    <button disabled className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        Modifier le mot de passe
                    </button>
                </div>
            </div>
        </div>
    );
}
