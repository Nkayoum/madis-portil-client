import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/utils';
import {
    Wallet, ArrowLeft, Loader2, Save,
    Building2, Euro, Calendar, FileText,
    TrendingUp, TrendingDown, HardHat, ClipboardList
} from 'lucide-react';

export default function AddTransaction() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [properties, setProperties] = useState([]);

    const [formData, setFormData] = useState({
        property: '',
        type: 'INFLOW',
        category: 'RENT',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        period_month: new Date().getMonth() + 1,
        period_year: new Date().getFullYear(),
        description: '',
        site: '',
        project: '',
        invoice: null
    });
    const [sites, setSites] = useState([]);
    const [projects, setProjects] = useState([]);

    const urlParams = new URLSearchParams(window.location.search);
    const siteIdFromUrl = urlParams.get('site');
    const projectIdFromUrl = urlParams.get('projectId');
    const propertyIdFromUrl = urlParams.get('propertyId');
    const returnToProperty = urlParams.get('returnToProperty') === 'true';

    const returnPath = siteIdFromUrl
        ? `/dashboard/construction/${siteIdFromUrl}?tab=finance`
        : projectIdFromUrl
            ? `/dashboard/projects/${projectIdFromUrl}`
            : (propertyIdFromUrl || returnToProperty)
                ? `/dashboard/properties/${propertyIdFromUrl || formData.property}?tab=performance`
                : '/dashboard/finance/transactions';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [propsRes, sitesRes, projectsRes] = await Promise.all([
                    api.get('/properties/'),
                    api.get('/construction/sites/'),
                    api.get('/projects/')
                ]);
                const allProps = propsRes.data.results || [];
                setProperties(allProps);
                setSites(sitesRes.data.results || sitesRes.data || []);
                setProjects(projectsRes.data.results || projectsRes.data || []);

                // 1. If propertyId in URL, pre-select it
                if (propertyIdFromUrl) {
                    setFormData(prev => ({ ...prev, property: propertyIdFromUrl }));
                }

                // 2. If there's a site in URL, pre-select it and its property/project
                if (siteIdFromUrl) {
                    console.log("DEBUG: siteIdFromUrl found:", siteIdFromUrl);
                    console.log("DEBUG: Available sites:", sitesRes.data.results || sitesRes.data);
                    const site = (sitesRes.data.results || sitesRes.data || []).find(s => s.id === parseInt(siteIdFromUrl));
                    if (site) {
                        console.log("DEBUG: Found site object:", site);
                        setFormData(prev => ({
                            ...prev,
                            site: siteIdFromUrl.toString(),
                            project: (site.project || site.project_id)?.toString() || '',
                            property: (site.property || site.property_id || site.project_property)?.toString() || '',
                            type: 'OUTFLOW',
                            category: 'MATERIAUX'
                        }));
                    } else {
                        console.log("DEBUG: Site NOT found in list");
                    }
                }

                // 3. If there's a project in URL, pre-select it and its property
                if (projectIdFromUrl && !siteIdFromUrl) {
                    const proj = (projectsRes.data.results || projectsRes.data || []).find(p => p.id === parseInt(projectIdFromUrl));
                    if (proj) {
                        setFormData(prev => ({
                            ...prev,
                            project: projectIdFromUrl,
                            property: proj.property?.toString() || '',
                            type: 'OUTFLOW'
                        }));
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [siteIdFromUrl, projectIdFromUrl, propertyIdFromUrl]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-update property when site changes
            if (name === 'site' && value) {
                const site = sites.find(s => s.id === parseInt(value));
                if (site) {
                    if (site.property_id) newData.property = site.property_id.toString();
                    if (site.project) newData.project = site.project.toString();
                }
            }

            // Auto-update property when project changes
            if (name === 'project' && value) {
                const proj = projects.find(p => p.id === parseInt(value));
                if (proj && proj.property) {
                    newData.property = proj.property.toString();
                }
            }

            return newData;
        });
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, invoice: e.target.files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Client-side validation
        if (!formData.property) {
            showToast({ message: 'Veuillez sélectionner un bien immobilier.', type: 'error' });
            return;
        }
        if (!formData.amount) {
            showToast({ message: 'Veuillez saisir un montant.', type: 'error' });
            return;
        }
        if (!formData.date) {
            showToast({ message: 'Veuillez sélectionner une date de paiement.', type: 'error' });
            return;
        }
        if (!formData.invoice) {
            showToast({ message: 'Un justificatif est obligatoire pour enregistrer une transaction.', type: 'error' });
            return;
        }

        setLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null) {
                data.append(key, formData[key]);
            }
        });

        try {
            await api.post('/finance/transactions/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast({ message: 'Transaction enregistrée avec succès.', type: 'success' });
            navigate(returnPath);
        } catch (err) {
            console.error(err);
            let errorMessage = 'Erreur lors de l\'enregistrement.';
            if (err.response?.data) {
                const errorData = err.response.data;
                errorMessage = Object.values(errorData).flat().join('\n');
            }
            showToast({ message: errorMessage, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto py-12 px-6 animate-fade-in">
            <div className="flex items-center gap-8 mb-12">
                <Link to={returnPath} className="h-12 w-12 flex items-center justify-center rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 shadow-sm hover:shadow-md transition-all group dark:text-white">
                    <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <div>
                    <h1 className="text-5xl font-black tracking-tighter uppercase leading-none mb-2">Enregistrer une <span className="text-primary">Transaction</span></h1>
                    <p className="text-[11px] font-black uppercase tracking-widest opacity-40">Protocole de saisie financière • Mouvement manuel</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                <div className="solaris-glass rounded-[2.5rem] p-10 shadow-2xl space-y-10 border-none">
                    {/* Property Selection */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3 opacity-60">
                            <Building2 className="h-4 w-4" />
                            Bien immobilier concerné
                        </label>
                        <select
                            name="property"
                            required
                            disabled={!!propertyIdFromUrl || !!siteIdFromUrl || !!projectIdFromUrl}
                            className="flex h-14 w-full rounded-2xl bg-black/[0.02] dark:bg-white/5 border-black/5 dark:border-white/5 px-6 py-2 text-[14px] font-bold focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 outline-none transition-all disabled:opacity-50 dark:text-white"
                            value={formData.property}
                            onChange={handleChange}
                        >
                            <option value="">Sélectionnez un actif...</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Type */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3 opacity-60">
                                <TrendingUp className="h-4 w-4" />
                                Nature du flux
                            </label>
                            <select
                                name="type"
                                className="flex h-14 w-full rounded-2xl bg-black/[0.02] dark:bg-white/5 border-black/5 dark:border-white/5 px-6 py-2 text-[14px] font-bold focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 outline-none transition-all dark:text-white"
                                value={formData.type}
                                onChange={handleChange}
                            >
                                <option value="INFLOW">Entrée (Revenu)</option>
                                <option value="OUTFLOW">Sortie (Dépense)</option>
                            </select>
                        </div>

                        {/* Category */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3 opacity-60">
                                <FileText className="h-4 w-4" />
                                Nomenclature comptable
                            </label>
                            <select
                                name="category"
                                className="flex h-14 w-full rounded-2xl bg-black/[0.02] dark:bg-white/5 border-black/5 dark:border-white/5 px-6 py-2 text-[14px] font-bold focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 outline-none transition-all dark:text-white"
                                value={formData.category}
                                onChange={handleChange}
                            >
                                <option value="RENT">Loyer perçu</option>
                                <option value="COMMISSION">Commission MaDis</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="MATERIAUX">Chantier: Matériaux</option>
                                <option value="MAIN_D_OEUVRE">Chantier: Main d'œuvre</option>
                                <option value="SERVICES">Chantier: Services</option>
                                <option value="TAX">Taxe / Impôt</option>
                                <option value="INSURANCE">Assurance</option>
                                <option value="OTHER">Autre</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Amount */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3 opacity-60">
                                <Euro className="h-4 w-4" />
                                Valeur nominale (€)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    name="amount"
                                    required
                                    placeholder="0.00"
                                    className="flex h-14 w-full rounded-2xl bg-black/[0.02] dark:bg-white/5 border-black/5 dark:border-white/5 px-6 py-2 text-[18px] font-black focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 outline-none transition-all dark:text-white dark:placeholder:text-white/30"
                                    value={formData.amount}
                                    onChange={handleChange}
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black opacity-20 uppercase tracking-widest">EUR</div>
                            </div>
                        </div>

                        {/* Date de Transaction */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3 opacity-60">
                                <Calendar className="h-4 w-4" />
                                Date d'exécution
                            </label>
                            <input
                                type="date"
                                name="date"
                                required
                                className="flex h-14 w-full rounded-2xl bg-black/[0.02] dark:bg-white/5 border-black/5 dark:border-white/5 px-6 py-2 text-[14px] font-bold focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 outline-none transition-all dark:text-white dark:[color-scheme:dark]"
                                value={formData.date}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Performance Period */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Affection temporelle : Mois</label>
                            <select
                                name="period_month"
                                className="flex h-14 w-full rounded-2xl bg-black/[0.02] dark:bg-white/5 border-black/5 dark:border-white/5 px-6 py-2 text-[14px] font-bold focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 outline-none transition-all dark:text-white"
                                value={formData.period_month}
                                onChange={handleChange}
                            >
                                {[...Array(12)].map((_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {new Date(2000, i).toLocaleString('fr-FR', { month: 'long' }).toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Affection temporelle : Année</label>
                            <select
                                name="period_year"
                                className="flex h-14 w-full rounded-2xl bg-black/[0.02] dark:bg-white/5 border-black/5 dark:border-white/5 px-6 py-2 text-[14px] font-bold focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 outline-none transition-all dark:text-white"
                                value={formData.period_year}
                                onChange={handleChange}
                            >
                                {[...Array(5)].map((_, i) => {
                                    const y = new Date().getFullYear() - 2 + i;
                                    return <option key={y} value={y}>{y}</option>;
                                })}
                            </select>
                        </div>
                    </div>

                    {/* Project & Site (Conditional) */}
                    {formData.property && (
                        <div className="space-y-8 p-8 bg-black/[0.02] dark:bg-white/[0.03] rounded-3xl border border-black/5 dark:border-white/5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3 opacity-60">
                                        <ClipboardList className="h-4 w-4" />
                                        Indexation Projet (Optionnel)
                                    </label>
                                    <select
                                        name="project"
                                        disabled={!!siteIdFromUrl || !!projectIdFromUrl}
                                        className="flex h-14 w-full rounded-2xl bg-white dark:bg-white/10 border-black/5 dark:border-white/5 px-6 py-2 text-[13px] font-bold shadow-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all disabled:opacity-50 dark:text-white"
                                        value={formData.project}
                                        onChange={handleChange}
                                    >
                                        <option value="">Aucune liaison projet...</option>
                                        {projects
                                            .filter(p => p.property === parseInt(formData.property))
                                            .map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3 opacity-60">
                                        <HardHat className="h-4 w-4" />
                                        Indexation Chantier (Optionnel)
                                    </label>
                                    <select
                                        name="site"
                                        disabled={!!siteIdFromUrl}
                                        className="flex h-14 w-full rounded-2xl bg-white dark:bg-white/10 border-black/5 dark:border-white/5 px-6 py-2 text-[13px] font-bold shadow-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all disabled:opacity-50 dark:text-white"
                                        value={formData.site}
                                        onChange={handleChange}
                                    >
                                        <option value="">Aucune liaison chantier...</option>
                                        {sites
                                            .filter(s => {
                                                if (siteIdFromUrl && s.id === parseInt(siteIdFromUrl)) return true;
                                                const propMatch = s.property === parseInt(formData.property) || s.project_property === parseInt(formData.property);
                                                const projectMatch = !formData.project || s.project === parseInt(formData.project);
                                                return propMatch && projectMatch;
                                            })
                                            .map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-30 text-center">Lier cette transaction à un programme spécifique pour l'intégration budgétaire analytique.</p>
                        </div>
                    )}

                    {/* Description */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-60 text-sm font-medium">Note documentaire (Optionnel)</label>
                        <textarea
                            name="description"
                            rows="4"
                            placeholder="Détails techniques du flux..."
                            className="flex w-full rounded-3xl bg-black/[0.02] dark:bg-white/5 border-black/5 dark:border-white/5 px-6 py-4 text-[14px] font-medium focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none shadow-inner dark:text-white dark:placeholder:text-white/30"
                            value={formData.description}
                            onChange={handleChange}
                        ></textarea>
                    </div>

                    {/* Invoice Upload Solaris style */}
                    <div className="space-y-6">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Justificatif de transfert (Audit)</label>
                        <div className="relative group cursor-pointer">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="flex items-center justify-between p-6 rounded-2xl bg-black/[0.03] dark:bg-white/5 border-2 border-dashed border-black/10 dark:border-white/10 group-hover:border-primary group-hover:bg-primary/5 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-black text-white flex items-center justify-center">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[12px] font-black uppercase tracking-tight">
                                            {formData.invoice ? formData.invoice.name : "Sélectionner un fichier justificatif"}
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-30">
                                            PDF, JPG, PNG • Max 10MB
                                        </div>
                                    </div>
                                </div>
                                <div className="h-10 px-6 rounded-full bg-white dark:bg-white/10 text-black dark:text-white text-[10px] font-black uppercase tracking-widest flex items-center shadow-sm">
                                    Parcourir
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end items-center gap-6 pt-4">
                    <Link
                        to={returnPath}
                        className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 hover:text-black dark:hover:text-white transition-all"
                    >
                        Abandonner la saisie
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="h-16 px-12 rounded-[1.5rem] bg-primary text-white text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-4"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        Valider l'enregistrement
                    </button>
                </div>
            </form>
        </div>
    );
}
