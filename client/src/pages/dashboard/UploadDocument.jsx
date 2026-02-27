import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { Upload, Loader2, ArrowLeft, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function UploadDocument() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const propertyId = searchParams.get('propertyId');
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [propertyName, setPropertyName] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        category: 'AUTRE',
        property: propertyId || '',
        project: '',
        site: ''
    });
    const [file, setFile] = useState(null);
    const [properties, setProperties] = useState([]);
    const [projects, setProjects] = useState([]);
    const [sites, setSites] = useState([]);

    useEffect(() => {
        // Fetch all properties for the dropdown if not pre-filled
        api.get('/properties/')
            .then(res => setProperties(res.data.results || []))
            .catch(err => console.error('Failed to fetch properties', err));

        if (propertyId) {
            setFormData(prev => ({ ...prev, property: propertyId }));
            api.get(`/properties/${propertyId}/`)
                .then(res => setPropertyName(res.data.name))
                .catch(err => console.error('Failed to fetch property name', err));

            fetchContexts(propertyId);
        }
    }, [propertyId]);

    const fetchContexts = async (id) => {
        try {
            const [projRes, siteRes] = await Promise.all([
                api.get(`/finance/projects/?property=${id}`),
                api.get(`/construction/sites/?property=${id}`)
            ]);
            setProjects(projRes.data.results || []);
            setSites(siteRes.data.results || []);
        } catch (err) {
            console.error('Failed to fetch context info', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) { showToast({ message: 'Veuillez sélectionner un fichier.', type: 'error' }); return; }
        if (!formData.property) { showToast({ message: 'Veuillez sélectionner un bien.', type: 'error' }); return; }
        setLoading(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('category', formData.category);
            data.append('file', file);
            data.append('property', formData.property);
            if (formData.project) data.append('project', formData.project);
            if (formData.site) data.append('site', formData.site);

            await api.post('/documents/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            showToast({ message: 'Document envoyé avec succès !', type: 'success' });
            navigate(propertyId ? `/dashboard/properties/${propertyId}` : '/dashboard/documents');
        } catch (err) {
            console.error(err);
            showToast({ message: 'Erreur lors de l\'envoi du document.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const ic = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

    return (
        <div className="container mx-auto py-8 md:py-12 px-4 max-w-4xl animate-fade-in pb-12 md:pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 mb-10 md:mb-16 pb-6 md:pb-8 border-b border-black/5 dark:border-white/5">
                <div className="space-y-4">
                    <Link
                        to={propertyId ? `/dashboard/properties/${propertyId}` : "/dashboard/documents"}
                        className="group flex items-center gap-3 text-[10px] font-black text-black/40 dark:text-white/40 hover:text-primary transition-all uppercase tracking-[0.2em]"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        {propertyId ? 'Retour au protocole du bien' : 'Retour aux archives'}
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter leading-none mb-3">Enregistrement Documentaire</h1>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">
                            {propertyName ? `Allocation pour l'actif : ${propertyName.toUpperCase()}` : 'Protocole d\'importation de données certifiées'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="solaris-glass rounded-[2.5rem] p-10 shadow-[0_30px_100px_rgba(0,0,0,0.08)] border-none relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Context Section */}
                        <div className="space-y-8">
                            <h3 className="text-[12px] font-black uppercase tracking-[0.25em] flex items-center gap-3 mb-6">
                                <div className="h-2 w-2 rounded-full bg-black dark:bg-white" />
                                Contexte de l'Actif
                            </h3>

                            {propertyName ? (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Bien immobilier affecté</label>
                                    <div className="w-full h-16 px-6 flex items-center bg-black/5 dark:bg-white/5 rounded-2xl text-[12px] font-bold text-black dark:text-white border border-black/5 dark:border-white/5 opacity-60">
                                        {propertyName.toUpperCase()}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Bien immobilier *</label>
                                    <select
                                        name="property"
                                        required
                                        className="w-full h-16 px-6 bg-black/[0.03] dark:bg-white/5 border-none rounded-2xl text-[12px] font-black uppercase tracking-widest focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none dark:text-white"
                                        value={formData.property}
                                        onChange={(e) => {
                                            handleChange(e);
                                            if (e.target.value) fetchContexts(e.target.value);
                                            else { setProjects([]); setSites([]); }
                                        }}
                                    >
                                        <option value="">SÉLECTIONNER UN BIEN</option>
                                        {properties.map(p => (
                                            <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {(projects.length > 0 || sites.length > 0) && (
                                <div className="space-y-6 pt-6 border-t border-black/5 dark:border-white/5 animate-fade-in">
                                    {projects.length > 0 && (
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Projet analytique (Optionnel)</label>
                                            <select name="project" className="w-full h-16 px-6 bg-black/[0.03] dark:bg-white/5 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 transition-all outline-none dark:text-white" value={formData.project} onChange={handleChange}>
                                                <option value="">AUCUN PROJET</option>
                                                {projects.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    {sites.length > 0 && (
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Unité de Chantier (Optionnel)</label>
                                            <select name="site" className="w-full h-16 px-6 bg-black/[0.03] dark:bg-white/5 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 transition-all outline-none dark:text-white" value={formData.site} onChange={handleChange}>
                                                <option value="">AUCUNE UNITÉ</option>
                                                {sites.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Metadata Section */}
                        <div className="space-y-8">
                            <h3 className="text-[12px] font-black uppercase tracking-[0.25em] flex items-center gap-3 mb-6">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                                Spécifications du Fichier
                            </h3>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Titre du document *</label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    className="w-full h-16 px-6 bg-black/[0.03] dark:bg-white/5 border-none rounded-2xl text-[14px] font-bold focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 transition-all outline-none dark:text-white dark:placeholder:text-white/30"
                                    placeholder="Libellé analytique..."
                                    value={formData.title}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Classification</label>
                                <select name="category" className="w-full h-16 px-6 bg-black/[0.03] dark:bg-white/5 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 transition-all outline-none dark:text-white" value={formData.category} onChange={handleChange}>
                                    <option value="CONTRAT">CONTRAT / PROTOCOLE</option>
                                    <option value="FACTURE">FACTURE / REÇU</option>
                                    <option value="PLAN">PLAN ARCHITECTURAL</option>
                                    <option value="PHOTO">RELEVÉ PHOTOGRAPHIQUE</option>
                                    <option value="VERIF_FONCIERE">CERTIFICAT FONCIER</option>
                                    <option value="ADMINISTRATIF">PIÈCE ADMINISTRATIVE</option>
                                    <option value="AUTRE">CLASSIFICATION DIVERSE</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* File Dropzone */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Fichier de données *</label>
                        <div
                            className="group relative border-2 border-dashed border-black/10 dark:border-white/10 rounded-[2rem] p-16 text-center hover:border-primary/50 hover:bg-primary/[0.02] transition-all cursor-pointer overflow-hidden"
                            onClick={() => document.getElementById('file-input').click()}
                        >
                            <input id="file-input" type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />

                            <div className="relative z-10">
                                <div className="mx-auto h-20 w-20 rounded-2xl bg-black text-white flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 group-hover:bg-primary transition-all duration-500">
                                    <Upload className="h-10 w-10" />
                                </div>
                                {file ? (
                                    <div className="space-y-2 animate-in fade-in scale-in-95">
                                        <div className="flex items-center justify-center gap-3 text-2xl font-black tracking-tighter text-black dark:text-white">
                                            <FileText className="h-6 w-6 text-primary" />
                                            {file.name.toUpperCase()}
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Fichier prêt pour l'archivage • {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                ) : (
                                    <>
                                        <h4 className="text-xl font-black uppercase tracking-tighter mb-2">Engager l'importation</h4>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-30">PDF, DOC, JPG, PNG — Capacité max 10 MO</p>
                                    </>
                                )}
                            </div>

                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-6 pt-10 border-t border-black/5 dark:border-white/5">
                        <Link
                            to="/dashboard/documents"
                            className="h-16 px-12 rounded-2xl border border-black/5 dark:border-white/10 text-[11px] font-black uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-all dark:text-white"
                        >
                            Abandonner
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-14 px-10 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center whitespace-nowrap"
                        >
                            {loading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Audit en cours...</>
                            ) : (
                                <><Upload className="mr-2 h-4 w-4" /> Engager la mise en ligne</>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Security Footer */}
            <div className="mt-8 md:mt-12 flex flex-col items-center gap-4 opacity-30">
                <div className="h-px w-32 bg-black dark:bg-white" />
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-center italic">
                    Cryptage de protocole Solaris 2.0 • Espace documentaire sécurisé MaDis
                </p>
            </div>
        </div>
    );
}
