import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import {
    HardHat, ArrowLeft, Loader2, Save,
    Building2, Layout, Calendar, FileText,
    Briefcase, User
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
    const [chefs, setChefs] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        property: propertyId || '',
        project: projectId || '',
        description: '',
        address: '',
        city: '',
        postal_code: '',
        budget: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        category: 'CONSTRUCTION',
        chef_de_chantier: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [propsRes, projsRes, usersRes] = await Promise.all([
                    api.get('/properties/'),
                    api.get('/projects/'),
                    api.get('/auth/users/?role=CHEF_CHANTIER')
                ]);
                const allProps = propsRes.data.results || [];
                const allProjs = projsRes.data.results || [];
                const allChefs = usersRes.data.results || usersRes.data || [];

                setProperties(allProps);
                setProjects(allProjs);
                setChefs(allChefs);

                // If projectId or propertyId is in URL, ensure property and its address are pre-selected
                const currentPropertyId = propertyId || (projectId && allProjs.find(p => p.id === parseInt(projectId))?.property);

                if (currentPropertyId) {
                    const prop = allProps.find(p => p.id === parseInt(currentPropertyId));
                    if (prop) {
                        setFormData(prev => ({
                            ...prev,
                            property: currentPropertyId.toString(),
                            address: prop.address || '',
                            city: prop.city || '',
                            postal_code: prop.postal_code || ''
                        }));
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [projectId, propertyId]);

    // Auto-link property and location when project is selected
    useEffect(() => {
        if (formData.project) {
            const proj = projects.find(p => p.id === parseInt(formData.project));
            if (proj && proj.property) {
                const prop = properties.find(p => p.id === proj.property);
                if (prop) {
                    setFormData(prev => ({
                        ...prev,
                        property: proj.property.toString(),
                        address: prev.address || prop.address || '',
                        city: prev.city || prop.city || '',
                        postal_code: prev.postal_code || prop.postal_code || ''
                    }));
                }
            }
        }
    }, [formData.project, projects, properties]);

    // Auto-fill location when property is selected manually
    useEffect(() => {
        if (formData.property && !propertyId && !projectId) {
            const prop = properties.find(p => p.id === parseInt(formData.property));
            if (prop) {
                setFormData(prev => ({
                    ...prev,
                    address: prop.address || '',
                    city: prop.city || '',
                    postal_code: prop.postal_code || ''
                }));
            }
        }
    }, [formData.property, properties, propertyId, projectId]);

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
        <div className="max-w-[1000px] mx-auto py-12 px-6 animate-fade-in pb-20">
            <div className="flex items-center gap-6 mb-12">
                <Link to="/dashboard/construction" className="p-3 hover:bg-black hover:text-white dark:hover:bg-primary dark:hover:text-white rounded-2xl transition-all shadow-sm border border-black/5 dark:border-white/5 bg-white dark:bg-white/5 group">
                    <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase leading-none mb-2">
                        Nouveau <span className="text-red-600">Chantier</span>
                    </h1>
                    <p className="text-[11px] font-bold uppercase tracking-wider opacity-60">Initialisation d'un nouveau suivi opérationnel ou intervention.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                <div className="solaris-glass rounded-[2.5rem] p-10 border-none shadow-xl space-y-10 dark:bg-black/60">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1 flex items-center gap-2">
                            <HardHat className="h-3.5 w-3.5" />
                            Désignation du Chantier *
                        </label>
                        <input
                            type="text"
                            name="name"
                            required
                            placeholder="Ex: Rénovation Façade Sud"
                            className="ic w-full p-4 rounded-2xl bg-black/[0.01] border-black/5 focus:bg-white transition-all text-[12px] font-bold"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1 flex items-center gap-2">
                                <Building2 className="h-3.5 w-3.5" />
                                Bien Immobilier Associé *
                            </label>
                            <select
                                name="property"
                                required
                                disabled={!!propertyId || !!projectId}
                                className="ic w-full p-4 rounded-2xl bg-black/[0.01] border-black/5 focus:bg-white transition-all text-[12px] font-bold disabled:opacity-50"
                                value={formData.property}
                                onChange={handleChange}
                            >
                                <option value="" className="dark:bg-[#0d121f] dark:text-white">Sélectionnez un bien...</option>
                                {properties.map(p => (
                                    <option key={p.id} value={p.id} className="dark:bg-[#0d121f] dark:text-white">{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1 flex items-center gap-2">
                                <Briefcase className="h-3.5 w-3.5" />
                                Projet de Référence (Optionnel)
                            </label>
                            <select
                                name="project"
                                disabled={!!projectId}
                                className="ic w-full p-4 rounded-2xl bg-black/[0.01] border-black/5 focus:bg-white transition-all text-[12px] font-bold disabled:opacity-50"
                                value={formData.project}
                                onChange={handleChange}
                            >
                                <option value="" className="dark:bg-[#0d121f] dark:text-white">Aucun projet lié</option>
                                {projects
                                    .filter(p => !formData.property || p.property === parseInt(formData.property))
                                    .map(p => (
                                        <option key={p.id} value={p.id} className="dark:bg-[#0d121f] dark:text-white">{p.name}</option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1 flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5" />
                                Budget Prévisionnel (€)
                            </label>
                            <input
                                type="number"
                                name="budget"
                                placeholder="0.00"
                                className="ic w-full p-4 rounded-2xl bg-black/[0.01] dark:bg-white/5 border border-black/5 dark:border-white/10 focus:bg-white dark:focus:bg-white/10 transition-all text-[12px] font-bold font-mono dark:text-white"
                                value={formData.budget}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-8 pt-6 border-t border-black/5">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Localisation Technique</h3>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Adresse de l'Intervention</label>
                            <input
                                type="text"
                                name="address"
                                placeholder="Numéro et nom de rue"
                                className="ic w-full p-4 rounded-2xl bg-black/[0.01] border-black/5 focus:bg-white transition-all text-[12px] font-bold"
                                value={formData.address}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Ville</label>
                                <input
                                    type="text"
                                    name="city"
                                    placeholder="Ville"
                                    className="ic w-full p-4 rounded-2xl bg-black/[0.01] border-black/5 focus:bg-white transition-all text-[12px] font-bold"
                                    value={formData.city}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Code Postal</label>
                                <input
                                    type="text"
                                    name="postal_code"
                                    placeholder="CP"
                                    className="ic w-full p-4 rounded-2xl bg-black/[0.01] border-black/5 focus:bg-white transition-all text-[12px] font-bold font-mono"
                                    value={formData.postal_code}
                                    onChange={handleChange}
                                />
                            </div>
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
                                className="ic w-full p-4 rounded-2xl bg-black/[0.01] border-black/5 focus:bg-white transition-all text-[12px] font-bold font-mono"
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
                                className="ic w-full p-4 rounded-2xl bg-black/[0.01] border-black/5 focus:bg-white transition-all text-[12px] font-bold font-mono"
                                value={formData.end_date}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1 flex items-center gap-2">
                            <Layout className="h-3.5 w-3.5" />
                            Notes de Chantier & Cahier des Charges
                        </label>
                        <textarea
                            name="description"
                            rows="5"
                            placeholder="Détails techniques, contraintes, objectifs..."
                            className="ic w-full p-4 rounded-2xl bg-black/[0.01] border-black/5 focus:bg-white transition-all text-[12px] font-bold resize-none"
                            value={formData.description}
                            onChange={handleChange}
                        ></textarea>
                    </div>
                </div>

                <div className="flex justify-center gap-4">
                    <Link to="/dashboard/construction" className="inline-flex items-center justify-center rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm hover:bg-black/5 dark:hover:bg-white/10 h-14 px-10">
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-black dark:bg-primary text-white hover:bg-black/90 dark:hover:bg-primary/90 h-14 px-12 disabled:opacity-50 shadow-xl shadow-black/10 dark:shadow-primary/20 group whitespace-nowrap"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Save className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />}
                        Déployer le Chantier
                    </button>
                </div>
            </form>
        </div>
    );
}
