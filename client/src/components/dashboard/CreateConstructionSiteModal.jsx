import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { HardHat, MapPin, Calendar, Loader2, X, Save } from 'lucide-react';

export default function CreateConstructionSiteModal({ isOpen, onClose, projectId, onSuccess }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [fetchingProjects, setFetchingProjects] = useState(true);

    const [formData, setFormData] = useState({
        project: projectId || '',
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
        if (isOpen) {
            setFormData({
                project: projectId || '',
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
            fetchProjects();
        }
    }, [isOpen, projectId]);

    const fetchProjects = async () => {
        setFetchingProjects(true);
        try {
            const response = await api.get('/projects/');
            setProjects(response.data.results || []);
        } catch (err) {
            console.error('Failed to fetch projects', err);
            showToast({ message: 'Impossible de charger la liste des projets.', type: 'error' });
        } finally {
            setFetchingProjects(false);
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
        ['start_date', 'end_date', 'budget', 'description'].forEach(field => {
            if (cleanedData[field] === '') {
                cleanedData[field] = null;
            }
        });

        try {
            await api.post('/construction/sites/', cleanedData);
            showToast({ message: 'Chantier créé avec succès !', type: 'success' });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.detail || 'Erreur lors de la création du chantier.';
            showToast({ message: errorMsg, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputClasses = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-muted/30 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <HardHat className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Nouveau <span className="text-primary">Chantier</span></h2>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Enregistrer un projet de construction</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    <form id="create-site-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Projet associé *</label>
                                    <select
                                        name="project"
                                        required
                                        disabled={fetchingProjects || !!projectId}
                                        className={inputClasses + " disabled:opacity-50"}
                                        value={formData.project}
                                        onChange={handleChange}
                                    >
                                        <option value="">-- Sélectionner un projet --</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nom du chantier *</label>
                                    <input type="text" name="name" required className={inputClasses} placeholder="Ex: Rénovation Bâtiment A" value={formData.name} onChange={handleChange} />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Budget estimé (€)</label>
                                    <input type="number" name="budget" className={inputClasses} placeholder="50000" value={formData.budget} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <MapPin className="h-3 w-3 text-primary" />
                                        Adresse *
                                    </label>
                                    <input type="text" name="address" required className={inputClasses} placeholder="123 Rue de la construction" value={formData.address} onChange={handleChange} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ville *</label>
                                        <input type="text" name="city" required className={inputClasses} placeholder="Paris" value={formData.city} onChange={handleChange} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CP *</label>
                                        <input type="text" name="postal_code" required className={inputClasses} placeholder="75000" value={formData.postal_code} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
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
                                            Fin (Est.)
                                        </label>
                                        <input type="date" name="end_date" className={inputClasses} value={formData.end_date} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                            <textarea name="description" rows="3" className={`${inputClasses} h-auto min-h-[80px] resize-none py-2`} placeholder="Décrivez les travaux prévus..." value={formData.description} onChange={handleChange} />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-muted/30 shrink-0">
                    <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-6">
                        Annuler
                    </button>
                    <button form="create-site-form" type="submit" disabled={loading} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 disabled:opacity-50">
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Création...</> : <><Save className="mr-2 h-4 w-4" /> Créer le chantier</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
