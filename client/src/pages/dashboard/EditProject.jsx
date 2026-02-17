import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import {
    Plus, ArrowLeft, Loader2, Save,
    Building2, Layout, Euro, Calendar,
    FileText, Briefcase
} from 'lucide-react';

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

    useEffect(() => {
        const fetchData = async () => {
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
        };
        fetchData();
    }, [id]);

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

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <Link to={`/dashboard/projects/${id}`} className="p-2 hover:bg-muted rounded-full transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">Modifier le <span className="text-primary">Projet</span></h1>
                    <p className="text-muted-foreground">Mettez à jour les détails du projet ou de l'intervention.</p>
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
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Category */}
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
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                            value={formData.description}
                            onChange={handleChange}
                        ></textarea>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Link
                        to={`/dashboard/projects/${id}`}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-6"
                    >
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Mettre à jour
                    </button>
                </div>
            </form>
        </div>
    );
}
