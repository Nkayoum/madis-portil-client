import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import { HardHat, MapPin, Calendar, Loader2, X, Save, User as UserIcon } from 'lucide-react';

export default function EditConstructionSiteModal({ isOpen, onClose, siteId, onSuccess }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);

    const [formData, setFormData] = useState({
        project: '',
        chef_de_chantier: '',
        name: '',
        address: '',
        city: '',
        postal_code: '',
        description: '',
        start_date: '',
        end_date: '',
        budget: '',
        status: 'PREPARATION',
    });

    useEffect(() => {
        if (isOpen && siteId) {
            fetchData();
        }
    }, [isOpen, siteId]);

    const fetchData = async () => {
        setFetching(true);
        try {
            const [projectsRes, usersRes, siteRes] = await Promise.all([
                api.get('/projects/'),
                api.get('/auth/users/'),
                api.get(`/construction/sites/${siteId}/`)
            ]);

            setProjects(projectsRes.data.results || []);
            setUsers(usersRes.data.results || usersRes.data);

            const site = siteRes.data;
            setFormData({
                project: site.project?.toString() || '',
                chef_de_chantier: site.chef_de_chantier?.toString() || '',
                name: site.name || '',
                address: site.address || '',
                city: site.city || '',
                postal_code: site.postal_code || '',
                description: site.description || '',
                start_date: site.start_date || '',
                end_date: site.end_date || '',
                budget: site.budget?.toString() || '',
                status: site.status || 'PREPARATION',
            });
        } catch (err) {
            console.error('Failed to fetch data', err);
            showToast({ message: 'Impossible de charger les données du chantier.', type: 'error' });
            onClose();
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const cleanedData = { ...formData };
        ['start_date', 'end_date', 'budget', 'description', 'city', 'postal_code', 'chef_de_chantier'].forEach(field => {
            if (cleanedData[field] === '') {
                cleanedData[field] = null;
            }
        });

        try {
            await api.patch(`/construction/sites/${siteId}/`, cleanedData);
            showToast({ message: 'Chantier mis à jour !', type: 'success' });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            showToast({ message: 'Erreur lors de la mise à jour.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputClasses = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-muted/30 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <HardHat className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Modifier <span className="text-primary tracking-tight">le Chantier</span></h2>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-0.5">{formData.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    {fetching ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <form id="edit-site-form" onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-5">
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Projet associé *</label>
                                        <select name="project" required className={inputClasses} value={formData.project} onChange={handleChange}>
                                            <option value="">-- Sélectionner un projet --</option>
                                            {projects.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nom du chantier *</label>
                                        <input type="text" name="name" required className={inputClasses} value={formData.name} onChange={handleChange} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <UserIcon className="h-3 w-3 text-primary" />
                                            Chef de chantier *
                                        </label>
                                        <select name="chef_de_chantier" required className={inputClasses} value={formData.chef_de_chantier} onChange={handleChange}>
                                            <option value="">-- Sélectionner un chef --</option>
                                            {users.filter(u => u.role === 'CHEF_CHANTIER' || u.role === 'ADMIN_MADIS').map(u => (
                                                <option key={u.id} value={u.id}>{u.get_full_name || `${u.first_name} ${u.last_name}`}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Statut</label>
                                        <select name="status" className={inputClasses} value={formData.status} onChange={handleChange}>
                                            <option value="PREPARATION">En préparation</option>
                                            <option value="EN_COURS">En cours</option>
                                            <option value="SUSPENDU">Suspendu</option>
                                            <option value="TERMINE">Terminé</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <MapPin className="h-3 w-3 text-primary" />
                                            Adresse *
                                        </label>
                                        <input type="text" name="address" required className={inputClasses} value={formData.address} onChange={handleChange} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ville</label>
                                            <input type="text" name="city" className={inputClasses} value={formData.city} onChange={handleChange} />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Code postal</label>
                                            <input type="text" name="postal_code" className={inputClasses} value={formData.postal_code} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                <Calendar className="h-3 w-3 text-primary" />
                                                Début
                                            </label>
                                            <input type="date" name="start_date" className={inputClasses} value={formData.start_date} onChange={handleChange} />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                <Calendar className="h-3 w-3 text-primary" />
                                                Fin
                                            </label>
                                            <input type="date" name="end_date" className={inputClasses} value={formData.end_date} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Budget estimé (€)</label>
                                        <input type="number" name="budget" className={inputClasses} value={formData.budget} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                                <textarea name="description" rows="3" className={`${inputClasses} h-auto min-h-[80px] resize-none py-2`} value={formData.description} onChange={handleChange} />
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-muted/30 shrink-0">
                    <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-6">
                        Annuler
                    </button>
                    <button form="edit-site-form" type="submit" disabled={loading || fetching} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 disabled:opacity-50">
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</> : <><Save className="mr-2 h-4 w-4" /> Sauvegarder</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
