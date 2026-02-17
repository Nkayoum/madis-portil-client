import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import {
    HardHat, ArrowLeft, Loader2, Save,
    Building2, Layout, Calendar, FileText,
    Briefcase
} from 'lucide-react';

export default function CreateConstructionSite() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [searchParams] = useSearchParams();
    const propertyId = searchParams.get('propertyId');
    const projectId = searchParams.get('projectId');

    const [loading, setLoading] = useState(false);
    const [properties, setProperties] = useState([]);
    const [projects, setProjects] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        property: propertyId || '',
        project: projectId || '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        category: 'CONSTRUCTION'
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [propsRes, projsRes] = await Promise.all([
                    api.get('/properties/'),
                    api.get('/projects/')
                ]);
                setProperties(propsRes.data.results || []);
                setProjects(projsRes.data.results || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post('/construction/sites/', formData);
            showToast({ message: 'Chantier créé.', type: 'success' });
            navigate(`/dashboard/construction/${res.data.id}`);
        } catch (err) {
            console.error(err);
            showToast({ message: 'Erreur lors de la création.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/dashboard/construction" className="p-2 hover:bg-muted rounded-full transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">Nouveau <span className="text-primary">Chantier</span></h1>
                    <p className="text-muted-foreground">Créez un nouveau suivi de chantier ou intervention.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <HardHat className="h-4 w-4 text-muted-foreground" />
                            Nom du chantier
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                Bien immobilier
                            </label>
                            <select
                                name="property"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={formData.property}
                                onChange={handleChange}
                            >
                                <option value="">Sélectionnez...</option>
                                {properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                Projet (optionnel)
                            </label>
                            <select
                                name="project"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={formData.project}
                                onChange={handleChange}
                            >
                                <option value="">Aucun...</option>
                                {projects
                                    .filter(p => !formData.property || p.property === parseInt(formData.property))
                                    .map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date de début</label>
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
                            <label className="text-sm font-medium">Date de fin (est.)</label>
                            <input
                                type="date"
                                name="end_date"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={formData.end_date}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
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
                    <Link to="/dashboard/construction" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-6">
                        Annuler
                    </Link>
                    <button type="submit" disabled={loading} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 disabled:opacity-50">
                        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Créer le Chantier
                    </button>
                </div>
            </form>
        </div>
    );
}
