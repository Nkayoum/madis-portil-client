import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import {
    Plus, ArrowLeft, Loader2, Save,
    Building2, Layout, Euro, Calendar,
    FileText, Briefcase
} from 'lucide-react';

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

    return (
        <div className="max-w-2xl mx-auto py-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <Link to={propertyId ? `/dashboard/properties/${propertyId}` : "/dashboard/projects"} className="p-2 hover:bg-muted rounded-full transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">Nouveau <span className="text-primary">Projet</span></h1>
                    <p className="text-muted-foreground">Créez un nouveau projet ou une intervention de maintenance.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
                    {/* Project Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            Nom du projet
                        </label>
                        <input
                            type="text"
                            name="name"
                            required
                            placeholder="Ex: Rénovation Cuisine, Réparation Toiture..."
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Property Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            Bien immobilier associé
                        </label>
                        <select
                            name="property"
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            value={formData.property}
                            onChange={handleChange}
                        >
                            <option value="">Sélectionnez un bien...</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.management_type})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Category (Auto-selected but visible) */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Layout className="h-4 w-4 text-muted-foreground" />
                                Type
                            </label>
                            <select
                                name="category"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={formData.category}
                                onChange={handleChange}
                            >
                                <option value="CONSTRUCTION">Développement / Chantier</option>
                                <option value="MAINTENANCE">Entretien / Maintenance</option>
                            </select>
                        </div>

                        {/* Budget */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Euro className="h-4 w-4 text-muted-foreground" />
                                Budget estimé (€)
                            </label>
                            <input
                                type="number"
                                name="budget"
                                required
                                placeholder="0.00"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={formData.budget}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                Date de début
                            </label>
                            <input
                                type="date"
                                name="start_date"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={formData.start_date}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                Date de fin (estimée)
                            </label>
                            <input
                                type="date"
                                name="end_date"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={formData.end_date}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            Description
                        </label>
                        <textarea
                            name="description"
                            rows="4"
                            placeholder="Détails du projet..."
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                            value={formData.description}
                            onChange={handleChange}
                        ></textarea>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Link
                        to={propertyId ? `/dashboard/properties/${propertyId}` : "/dashboard/projects"}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-6"
                    >
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Créer le Projet
                    </button>
                </div>
            </form>
        </div>
    );
}
