import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import {
    HardHat, ArrowLeft, Loader2, Save,
    Building2, Layout, Calendar, FileText
} from 'lucide-react';

export default function EditConstructionSite() {
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
        start_date: '',
        end_date: '',
        status: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [propsRes, siteRes] = await Promise.all([
                    api.get('/properties/'),
                    api.get(`/construction/sites/${id}/`)
                ]);
                setProperties(propsRes.data.results || []);
                const site = siteRes.data;
                setFormData({
                    name: site.name,
                    property: site.property,
                    description: site.description || '',
                    start_date: site.start_date,
                    end_date: site.end_date || '',
                    status: site.status
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
            await api.patch(`/construction/sites/${id}/`, formData);
            showToast({ message: 'Chantier mis à jour.', type: 'success' });
            navigate(`/dashboard/construction/${id}`);
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
                <Link to={`/dashboard/construction/${id}`} className="p-2 hover:bg-muted font-bold rounded-full transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">Modifier le <span className="text-primary">Chantier</span></h1>
                    <p className="text-muted-foreground">Mettez à jour les informations du chantier.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nom du chantier</label>
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
                            <label className="text-sm font-medium">Bien immobilier</label>
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Statut</label>
                            <select
                                name="status"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="PREPARATION">En préparation</option>
                                <option value="EN_COURS">En cours</option>
                                <option value="SUSPENDU">Suspendu</option>
                                <option value="TERMINE">Terminé</option>
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
                    <button type="submit" disabled={saving} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 disabled:opacity-50">
                        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Mettre à jour
                    </button>
                </div>
            </form>
        </div>
    );
}
