import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import {
    HardHat, ArrowLeft, Loader2, Save,
    Building2, Layout, Calendar, FileText, User
} from 'lucide-react';

export default function EditConstructionSite() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [properties, setProperties] = useState([]);
    const [chefs, setChefs] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        property: '',
        description: '',
        start_date: '',
        end_date: '',
        status: '',
        chef_de_chantier: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [propsRes, siteRes, usersRes] = await Promise.all([
                    api.get('/properties/'),
                    api.get(`/construction/sites/${id}/`),
                    api.get('/auth/users/?role=CHEF_CHANTIER')
                ]);
                setProperties(propsRes.data.results || []);
                setChefs(usersRes.data.results || usersRes.data || []);
                const site = siteRes.data;
                setFormData({
                    name: site.name,
                    property: site.property,
                    description: site.description || '',
                    start_date: site.start_date,
                    end_date: site.end_date || '',
                    status: site.status,
                    chef_de_chantier: site.chef_de_chantier || ''
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
        <div className="max-w-[1000px] mx-auto py-12 px-6 animate-fade-in pb-20">
            <div className="flex items-center gap-6 mb-12">
                <Link to={`/dashboard/construction/${id}`} className="p-3 hover:bg-black hover:text-white rounded-2xl transition-all shadow-sm border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 group dark:text-white">
                    <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase leading-none mb-2">
                        Modifier le <span className="text-primary">Chantier</span>
                    </h1>
                    <p className="text-[11px] font-bold uppercase tracking-wider opacity-60">Mise à jour des paramètres opérationnels du chantier.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                <div className="solaris-glass rounded-[2.5rem] p-10 border-none shadow-xl space-y-10">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1 flex items-center gap-2">
                            <HardHat className="h-3.5 w-3.5" />
                            Désignation du Chantier *
                        </label>
                        <input
                            type="text"
                            name="name"
                            required
                            className="ic w-full p-4 rounded-2xl bg-black/[0.01] dark:bg-white/5 border-black/5 dark:border-white/5 focus:bg-white dark:focus:bg-white/10 transition-all text-[12px] font-bold dark:text-white"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1 flex items-center gap-2">
                                <Building2 className="h-3.5 w-3.5" />
                                Bien Immobilier
                            </label>
                            <select
                                name="property"
                                required
                                disabled
                                className="ic w-full p-4 rounded-2xl bg-black/[0.05] dark:bg-white/5 border-black/5 dark:border-white/5 transition-all text-[12px] font-bold dark:text-white/50 cursor-not-allowed"
                                value={formData.property}
                                onChange={handleChange}
                            >
                                {properties.map(p => (
                                    <option key={p.id} value={p.id} className="dark:bg-[#0d121f] dark:text-white">{p.name}</option>
                                ))}
                            </select>
                            <p className="text-[9px] font-bold uppercase tracking-wider opacity-30 mt-1 ml-1">L'association au bien ne peut plus être modifiée.</p>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1 flex items-center gap-2">
                                <User className="h-3.5 w-3.5" />
                                Chef de Chantier Responsable *
                            </label>
                            <select
                                name="chef_de_chantier"
                                required
                                className="ic w-full p-4 rounded-2xl bg-black/[0.01] dark:bg-white/5 border border-black/5 dark:border-white/10 focus:bg-white dark:focus:bg-white/10 transition-all text-[12px] font-bold dark:text-white dark:[color-scheme:dark]"
                                value={formData.chef_de_chantier}
                                onChange={handleChange}
                            >
                                <option value="" className="dark:bg-[#0d121f] dark:text-white">Sélectionnez un chef...</option>
                                {chefs.map(chef => (
                                    <option key={chef.id} value={chef.id} className="dark:bg-[#0d121f] dark:text-white">
                                        {chef.first_name} {chef.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1 flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5" />
                                Date de Lancement *
                            </label>
                            <input
                                type="date"
                                name="start_date"
                                required
                                className="ic w-full p-4 rounded-2xl bg-black/[0.01] dark:bg-white/5 border-black/5 dark:border-white/5 focus:bg-white dark:focus:bg-white/10 transition-all text-[12px] font-bold dark:text-white font-mono dark:[color-scheme:dark]"
                                value={formData.start_date}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1 flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5" />
                                Livraison Estimée
                            </label>
                            <input
                                type="date"
                                name="end_date"
                                className="ic w-full p-4 rounded-2xl bg-black/[0.01] dark:bg-white/5 border-black/5 dark:border-white/5 focus:bg-white dark:focus:bg-white/10 transition-all text-[12px] font-bold dark:text-white font-mono dark:[color-scheme:dark]"
                                value={formData.end_date}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1 flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5" />
                            Notes techniques & Description
                        </label>
                        <textarea
                            name="description"
                            rows="5"
                            className="ic w-full p-4 rounded-2xl bg-black/[0.01] dark:bg-white/5 border-black/5 dark:border-white/5 focus:bg-white dark:focus:bg-white/10 transition-all text-[12px] font-bold dark:text-white resize-none"
                            value={formData.description}
                            onChange={handleChange}
                        ></textarea>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center justify-center rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-primary text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] h-14 px-12 disabled:opacity-50 shadow-lg shadow-primary/20 group dark:shadow-[0_0_20px_rgba(236,72,153,0.3)]"
                    >
                        {saving ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Save className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />}
                        Mettre à jour le Chantier
                    </button>
                </div>
            </form>
        </div>
    );
}
