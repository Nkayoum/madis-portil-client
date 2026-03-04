import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import {
    Plus, ArrowLeft, Loader2, Save,
    Building2, Layout, Euro, Calendar,
    FileText, Briefcase
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function EditProject() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [properties, setProperties] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        property: '',
        description: '',
        budget: '',
        start_date: '',
        end_date: '',
        category: 'CONSTRUCTION'
    });

    const fetchData = useCallback(async () => {
        try {
            const [propsRes, projRes] = await Promise.all([
                api.get('/properties/'),
                api.get(`/projects/${id}/`)
            ]);
            setProperties(propsRes.data.results || []);
            const proj = projRes.data;
            setFormData({
                name: proj.name,
                property: proj.property,
                description: proj.description || '',
                budget: proj.budget,
                start_date: proj.start_date,
                end_date: proj.end_date || '',
                category: proj.category
            });
        } catch (err) {
            console.error(err);
            showToast({ message: 'Erreur lors du chargement.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [id, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await api.patch(`/projects/${id}/`, formData);
            showToast({ message: 'Projet mis à jour.', type: 'success' });
            navigate(`/dashboard/projects/${id}`);
        } catch (err) {
            console.error(err);
            showToast({ message: 'Erreur lors de la mise à jour.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const ic = "flex h-12 w-full rounded-2xl border-none bg-black/[0.03] px-4 py-3 text-[12px] font-bold outline-none ring-0 placeholder:text-muted-foreground focus:bg-black/[0.05] transition-all duration-300";

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-32 gap-6 animate-fade-in">
                <Loader2 className="h-12 w-12 animate-spin text-black opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Chargement du configurateur...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 animate-fade-in">
            <div className="flex items-center gap-4 sm:gap-6 mb-8 sm:mb-16">
                <Link
                    to={`/dashboard/projects/${id}`}
                    className="p-3 bg-black text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all shrink-0"
                >
                    <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </Link>
                <div>
                    <h1 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase leading-none">Modifier le Projet</h1>
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mt-1 sm:mt-2">Édition des paramètres industriels</p>
                </div>
            </div>

            <div className="solaris-glass rounded-[2.5rem] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden">
                <form id="edit-project-form" onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-10">
                    <div className="grid gap-10 md:grid-cols-2">
                        <div className="space-y-8">
                            {/* Project Name */}
                            <div className="grid gap-3">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Nom du projet *</label>
                                <div className="relative group">
                                    <Briefcase className="absolute left-4 top-[14px] h-5 w-5 text-muted-foreground opacity-30 group-focus-within:opacity-100 transition-opacity" />
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        className={cn(ic, "pl-11")}
                                        placeholder="Ex: Rénovation Façade"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Property Selection */}
                            <div className="grid gap-3">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Bien immobilier associé *</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-4 top-[14px] h-5 w-5 text-muted-foreground opacity-30 group-focus-within:opacity-100 transition-opacity" />
                                    <select
                                        name="property"
                                        required
                                        className={cn(ic, "pl-11 appearance-none")}
                                        value={formData.property}
                                        onChange={handleChange}
                                    >
                                        {properties.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-3">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Type de projet *</label>
                                <div className="relative group">
                                    <Layout className="absolute left-4 top-[14px] h-5 w-5 text-muted-foreground opacity-30 group-focus-within:opacity-100 transition-opacity" />
                                    <select
                                        name="category"
                                        required
                                        className={cn(ic, "pl-11 appearance-none")}
                                        value={formData.category}
                                        onChange={handleChange}
                                    >
                                        <option value="CONSTRUCTION">Développement / Chantier</option>
                                        <option value="MAINTENANCE">Entretien / Maintenance</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="grid gap-3">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Budget estimé (€)</label>
                                <div className="relative group">
                                    <Euro className="absolute left-4 top-[14px] h-5 w-5 text-muted-foreground opacity-30 group-focus-within:opacity-100 transition-opacity" />
                                    <input
                                        type="number"
                                        name="budget"
                                        required
                                        className={cn(ic, "pl-11")}
                                        placeholder="0.00"
                                        value={formData.budget}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-3">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Début</label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        required
                                        className={cn(ic, "font-mono")}
                                        value={formData.start_date}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Fin estimée</label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        className={cn(ic, "font-mono text-amber-600")}
                                        value={formData.end_date}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-3">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Description</label>
                                <div className="relative group">
                                    <FileText className="absolute left-4 top-[14px] h-5 w-5 text-muted-foreground opacity-30 group-focus-within:opacity-100 transition-opacity" />
                                    <textarea
                                        name="description"
                                        rows="4"
                                        className={cn(ic, "pl-11 h-auto py-4 min-h-[120px] leading-relaxed resize-none")}
                                        placeholder="Détails techniques du projet..."
                                        value={formData.description}
                                        onChange={handleChange}
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Action Footer - Glassmorphism style without sticky behavior */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-t border-black/5 bg-white/40 dark:bg-black/20 backdrop-blur-md">
                    <Link
                        to={`/dashboard/projects/${id}`}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-black transition-all px-4"
                    >
                        Annuler
                    </Link>
                    <button
                        form="edit-project-form"
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center justify-center rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all bg-black text-white hover:bg-black/90 h-11 px-8 sm:px-12 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.3)] disabled:opacity-50 group whitespace-nowrap active:scale-95"
                    >
                        {saving ? (
                            <><Loader2 className="mr-3 h-5 w-5 animate-spin" /> Mise à jour...</>
                        ) : (
                            <><Save className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" /> Mettre à jour le projet</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
