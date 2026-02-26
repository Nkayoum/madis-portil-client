import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import {
    Plus, ArrowLeft, Loader2, Save,
    Building2, Layout, Euro, Calendar,
    FileText, Briefcase
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function CreateProject() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [searchParams] = useSearchParams();
    const propertyId = searchParams.get('propertyId');

    const [loading, setLoading] = useState(false);
    const [properties, setProperties] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        property: propertyId || '',
        description: '',
        budget: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        category: 'CONSTRUCTION'
    });

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await api.get('/properties/');
                const props = res.data.results || [];
                setProperties(props);

                if (propertyId) {
                    const prop = props.find(p => p.id === parseInt(propertyId));
                    if (prop) {
                        setFormData(prev => ({
                            ...prev,
                            category: prop.management_type === 'GESTION' ? 'MAINTENANCE' : 'CONSTRUCTION'
                        }));
                    }
                }
            } catch (err) {
                console.error('Error fetching properties:', err);
            }
        };
        fetchProperties();
    }, [propertyId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'property' && value) {
                const prop = properties.find(p => p.id === parseInt(value));
                if (prop) {
                    newData.category = prop.management_type === 'GESTION' ? 'MAINTENANCE' : 'CONSTRUCTION';
                }
            }
            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/projects/', formData);
            showToast({ message: 'Projet créé avec succès.', type: 'success' });
            navigate(propertyId ? `/dashboard/properties/${propertyId}?tab=projects` : '/dashboard/projects');
        } catch (err) {
            console.error(err);
            showToast({ message: 'Erreur lors de la création du projet.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const ic = "flex h-12 w-full rounded-2xl border-none bg-black/[0.03] px-4 py-3 text-[12px] font-bold outline-none ring-0 placeholder:text-muted-foreground focus:bg-black/[0.05] transition-all duration-300";

    return (
        <div className="max-w-4xl mx-auto py-12 px-6 animate-fade-in pb-32">
            <div className="flex items-center justify-between mb-16">
                <div className="flex items-center gap-6">
                    <Link
                        to={propertyId ? `/dashboard/properties/${propertyId}` : "/dashboard/projects"}
                        className="p-3.5 bg-black text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Nouveau Projet</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mt-2">Configuration technique du chantier</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                <div className="solaris-glass rounded-[2.5rem] p-10 border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] space-y-10">
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
                                        placeholder="Ex: Rénovation Cuisine, Réparation Toiture..."
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
                                        disabled={!!propertyId}
                                        className={cn(ic, "pl-11 appearance-none disabled:opacity-50")}
                                        value={formData.property}
                                        onChange={handleChange}
                                    >
                                        <option value="">Sélectionnez un bien...</option>
                                        {properties.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.management_type})</option>
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
                                        disabled={!!formData.property}
                                        className={cn(ic, "pl-11 appearance-none disabled:opacity-50")}
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
                </div>

                <div className="flex justify-end items-center gap-8 pt-4">
                    <Link
                        to={propertyId ? `/dashboard/properties/${propertyId}` : "/dashboard/projects"}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-black transition-all px-4"
                    >
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all bg-black text-white hover:bg-black/90 h-14 px-12 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.3)] disabled:opacity-50 group"
                    >
                        {loading ? (
                            <><Loader2 className="mr-3 h-5 w-5 animate-spin" /> Création...</>
                        ) : (
                            <><Plus className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" /> Créer le Projet</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
