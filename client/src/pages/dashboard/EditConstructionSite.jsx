import { useState, useEffect, useCallback } from 'react';
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

    const fetchData = useCallback(async () => {
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
        <div className="max-w-[1000px] mx-auto py-8 sm:py-12 px-4 sm:px-6 animate-fade-in">
            <div className="flex items-center gap-4 sm:gap-6 mb-8 sm:mb-12">
                <Link to={`/dashboard/construction/${id}`} className="p-3 bg-black text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all shrink-0">
                    <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </Link>
                <div>
                    <h1 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase leading-none mb-1 sm:mb-2 text-foreground">
                        Modifier le <span className="text-primary italic">Chantier</span>
                    </h1>
                    <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider opacity-60">Mise à jour des paramètres opérationnels.</p>
                </div>
            </div>

            <div className="solaris-glass rounded-[2.5rem] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden">
                <form id="edit-construction-site-form" onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1 flex items-center gap-2">
                            <HardHat className="h-3.5 w-3.5" />
                            Désignation du Chantier *
                        </label>
                        <input
                            type="text"
                            name="name"
                            required
                            className="ic w-full p-4 rounded-2xl bg-black/[0.01] dark:bg-white/[0.02] border-black/5 dark:border-white/5 focus:bg-white dark:focus:bg-white/10 transition-all text-[12px] font-bold dark:text-white"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1 flex items-center gap-2">
                                <Building2 className="h-3.5 w-3.5" />
                                Bien Immobilier
                            </label>
                            <select
                                name="property"
                                required
                                disabled
                                className="ic w-full p-4 rounded-2xl bg-black/[0.05] dark:bg-white/5 border-black/5 dark:border-white/5 transition-all text-[12px] font-bold dark:text-white/50 cursor-not-allowed appearance-none"
                                value={formData.property}
                                onChange={handleChange}
                            >
                                {properties.map(p => (
                                    <option key={p.id} value={p.id} className="dark:bg-[#0d121f] dark:text-white">{p.name}</option>
                                ))}
                            </select>
                            <p className="text-[9px] font-bold uppercase tracking-wider opacity-30 mt-1 ml-1">L'association au bien ne peut plus être modifiée.</p>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1 flex items-center gap-2">
                                <User className="h-3.5 w-3.5" />
                                Chef de Chantier Responsable *
                            </label>
                            <select
                                name="chef_de_chantier"
                                required
                                className="ic w-full p-4 rounded-2xl bg-black/[0.01] dark:bg-white/5 border border-black/5 dark:border-white/10 focus:bg-white dark:focus:bg-white/10 transition-all text-[12px] font-bold dark:text-white dark:[color-scheme:dark] appearance-none"
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
                        <div className="space-y-4">
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
                        <div className="space-y-4">
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

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1 flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5" />
                            Notes techniques & Description
                        </label>
                        <textarea
                            name="description"
                            rows="5"
                            className="ic w-full p-4 rounded-2xl bg-black/[0.01] dark:bg-white/5 border-black/5 dark:border-white/5 focus:bg-white dark:focus:bg-white/10 transition-all text-[12px] font-bold dark:text-white resize-none leading-relaxed"
                            value={formData.description}
                            onChange={handleChange}
                        ></textarea>
                    </div>
                </form>

                {/* Action Footer - Glassmorphism style without sticky behavior */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-t border-black/5 bg-white/40 dark:bg-black/20 backdrop-blur-md">
                    <Link to={`/dashboard/construction/${id}`} className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-black dark:hover:text-white transition-all px-4">
                        Annuler
                    </Link>
                    <button
                        form="edit-construction-site-form"
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center justify-center rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all bg-black dark:bg-primary text-white hover:bg-black/90 dark:hover:bg-primary/90 h-12 sm:h-14 px-8 sm:px-12 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.3)] disabled:opacity-50 group whitespace-nowrap"
                    >
                        {saving ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Save className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />}
                        Mettre à jour le Chantier
                    </button>
                </div>
            </div>
        </div>
    );
}

