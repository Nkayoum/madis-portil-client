import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import { Upload, Loader2, ArrowLeft, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UploadDocument() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const propertyId = searchParams.get('propertyId');
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [propertyName, setPropertyName] = useState('');
    const [formData, setFormData] = useState({ title: '', category: 'AUTRE', property: propertyId || '' });
    const [file, setFile] = useState(null);

    useEffect(() => {
        if (propertyId) {
            setFormData(prev => ({ ...prev, property: propertyId }));
            // Fetch property name for display
            api.get(`/properties/${propertyId}/`)
                .then(res => setPropertyName(res.data.name))
                .catch(err => console.error('Failed to fetch property name', err));
        }
    }, [propertyId]);

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
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <Link to={propertyId ? `/dashboard/properties/${propertyId}` : "/dashboard/documents"} className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                {propertyId ? 'Retour au bien' : 'Retour aux documents'}
            </Link>
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-1">Ajouter un Document</h1>
                <p className="text-muted-foreground">
                    {propertyName ? `Importation pour : ${propertyName}` : 'Importez un fichier dans votre espace documentaire.'}
                </p>
            </div>
            <div className="bg-card border rounded-xl p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {propertyName && (
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Bien immobilier</label>
                            <input type="text" readOnly className={cn(ic, "bg-muted cursor-not-allowed")} value={propertyName} />
                        </div>
                    )}
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Titre du document *</label>
                        <input type="text" name="title" required className={ic} placeholder="Ex: Contrat de vente Lot 3" value={formData.title} onChange={handleChange} />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Catégorie</label>
                        <select name="category" className={ic} value={formData.category} onChange={handleChange}>
                            <option value="CONTRAT">Contrat</option>
                            <option value="FACTURE">Facture</option>
                            <option value="PLAN">Plan</option>
                            <option value="PHOTO">Photo</option>
                            <option value="VERIF_FONCIERE">Vérification Foncière</option>
                            <option value="ADMINISTRATIF">Administratif</option>
                            <option value="AUTRE">Autre</option>
                        </select>
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Fichier *</label>
                        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={() => document.getElementById('file-input').click()}>
                            <input id="file-input" type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                <Upload className="h-6 w-6 text-muted-foreground" />
                            </div>
                            {file ? (
                                <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                                    <FileText className="h-4 w-4" />
                                    {file.name}
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm font-medium mb-1">Cliquez pour sélectionner un fichier</p>
                                    <p className="text-xs text-muted-foreground">PDF, DOC, JPG, PNG — Max 10 Mo</p>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Link to="/dashboard/documents" className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">Annuler</Link>
                        <button type="submit" disabled={loading} className="inline-flex items-center justify-center rounded-md text-sm font-medium disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2">
                            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi...</> : <><Upload className="mr-2 h-4 w-4" /> Envoyer</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
