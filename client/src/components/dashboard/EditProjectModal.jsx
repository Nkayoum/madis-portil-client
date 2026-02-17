import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import {
    X, Loader2, Save, Building2,
    Calendar, Euro, ClipboardList, LayoutDashboard, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EditProjectModal({ isOpen, onClose, projectId, onSuccess }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [properties, setProperties] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        property: '',
        status: 'PLANIFIE',
        category: 'CONSTRUCTION',
        start_date: '',
        estimated_end_date: '',
        budget: ''
    });

    useEffect(() => {
        if (isOpen && projectId) {
            fetchData();
        }
    }, [isOpen, projectId]);

    const fetchData = async () => {
        setFetching(true);
        try {
            const [propsRes, projectRes] = await Promise.all([
                api.get('/properties/'),
                api.get(`/projects/${projectId}/`)
            ]);

            setProperties(propsRes.data.results || []);

            const proj = projectRes.data;
            setFormData({
                name: proj.name || '',
                description: proj.description || '',
                property: proj.property || '',
                status: proj.status || 'PLANIFIE',
                category: proj.category || 'CONSTRUCTION',
                start_date: proj.start_date || '',
                estimated_end_date: proj.estimated_end_date || '',
                budget: proj.budget || ''
            });
        } catch (err) {
            console.error('Failed to fetch data', err);
            showToast({ message: 'Impossible de charger les données du projet.', type: 'error' });
            onClose();
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (formData.property && properties.length > 0) {
            const selectedProp = properties.find(p => String(p.id) === String(formData.property));
            if (selectedProp) {
                const newCategory = selectedProp.management_type === 'GESTION' ? 'MAINTENANCE' : 'CONSTRUCTION';
                if (formData.category !== newCategory) {
                    setFormData(prev => ({ ...prev, category: newCategory }));
                }
            }
        }
    }, [formData.property, properties, formData.category]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const cleanedData = { ...formData };
        ['start_date', 'estimated_end_date', 'budget', 'description'].forEach(field => {
            if (cleanedData[field] === '') {
                cleanedData[field] = null;
            }
        });

        try {
            await api.patch(`/projects/${projectId}/`, cleanedData);
            showToast({ message: 'Projet mis à jour avec succès !', type: 'success' });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.detail || 'Impossible de mettre à jour le projet.';
            showToast({ message: errorMsg, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const ic = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b bg-muted/30 sticky top-0 bg-card z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <LayoutDashboard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Modifier <span className="text-primary tracking-tight">Projet</span></h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                {fetching ? (
                    <div className="p-20 flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <form id="edit-project-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Nom du projet *</label>
                                    <input type="text" name="name" required className={ic} placeholder="Ex: Rénovation Façade" value={formData.name} onChange={handleChange} />
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Bien immobilier *</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <select name="property" required className={cn(ic, "pl-9")} value={formData.property} onChange={handleChange}>
                                            <option value="">-- Sélectionner un bien --</option>
                                            {properties.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                                        <Clock className="h-3 w-3" /> Statut
                                    </label>
                                    <select name="status" className={ic} value={formData.status} onChange={handleChange}>
                                        <option value="PLANIFIE">Planifié</option>
                                        <option value="EN_COURS">En cours</option>
                                        <option value="TERMINE">Terminé</option>
                                        <option value="ANNULE">Annulé</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Catégorie *</label>
                                    <div className="relative">
                                        <ClipboardList className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <select name="category" required className={cn(ic, "pl-9")} value={formData.category} onChange={handleChange}>
                                            <option value="CONSTRUCTION">Construction / Développement</option>
                                            <option value="MAINTENANCE">Entretien / Rénovation</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Budget estimé (€)</label>
                                    <div className="relative">
                                        <Euro className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <input type="number" name="budget" className={cn(ic, "pl-9")} placeholder="0.00" value={formData.budget} onChange={handleChange} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Début</label>
                                        <input type="date" name="start_date" className={ic} value={formData.start_date} onChange={handleChange} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Fin estimée</label>
                                        <input type="date" name="estimated_end_date" className={ic} value={formData.estimated_end_date} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
                            <textarea name="description" rows="3" className={cn(ic, "h-auto py-2 min-h-[100px]")} placeholder="Détails du projet..." value={formData.description} onChange={handleChange}></textarea>
                        </div>
                    </form>
                )}

                <div className="flex justify-end gap-3 p-6 border-t bg-muted/30">
                    <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                        Annuler
                    </button>
                    <button form="edit-project-form" type="submit" disabled={loading || fetching} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-6 disabled:opacity-50 transition-all font-bold">
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</> : <><Save className="mr-2 h-4 w-4" /> Enregistrer les modifications</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
