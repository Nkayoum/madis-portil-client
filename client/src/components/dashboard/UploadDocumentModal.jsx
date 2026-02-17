import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import { Upload, Loader2, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UploadDocumentModal({ isOpen, onClose, propertyId, siteId, onSuccess }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [propertyName, setPropertyName] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        category: 'AUTRE',
        property: propertyId || '',
        site: siteId || ''
    });
    const [file, setFile] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: '',
                category: 'AUTRE',
                property: propertyId || '',
                site: siteId || ''
            });
            setFile(null);

            if (propertyId) {
                api.get(`/properties/${propertyId}/`)
                    .then(res => setPropertyName(res.data.name))
                    .catch(err => console.error('Failed to fetch property name', err));
            }
        }
    }, [isOpen, propertyId, siteId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) { showToast({ message: 'Veuillez sélectionner un fichier.', type: 'error' }); return; }
        if (!formData.property && !formData.site) {
            showToast({ message: 'Le document doit être rattaché à un bien ou un chantier.', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('category', formData.category);
            data.append('file', file);
            if (formData.property) data.append('property', formData.property);
            if (formData.site) data.append('site', formData.site);

            await api.post('/documents/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            showToast({ message: 'Document envoyé avec succès !', type: 'success' });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            showToast({ message: 'Erreur lors de l\'envoi du document.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const ic = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Upload className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Ajouter un <span className="text-primary">Document</span></h2>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
                                {propertyName ? `Pour : ${propertyName}` : 'Importation de fichier'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Titre du document *</label>
                        <input type="text" name="title" required className={ic} placeholder="Ex: Contrat de vente, Facture..." value={formData.title} onChange={handleChange} />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Catégorie</label>
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
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fichier *</label>
                        <div
                            className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                            onClick={() => document.getElementById('modal-file-input').click()}
                        >
                            <input id="modal-file-input" type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                            <div className="mx-auto h-12 w-12 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center mb-3 transition-colors">
                                <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            {file ? (
                                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-primary">
                                    <FileText className="h-4 w-4" />
                                    {file.name}
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm font-bold mb-1">Cliquez pour sélectionner un fichier</p>
                                    <p className="text-xs text-muted-foreground">PDF, DOC, JPG, PNG — Max 10 Mo</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-6">
                            Annuler
                        </button>
                        <button type="submit" disabled={loading} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 disabled:opacity-50">
                            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi...</> : <><Upload className="mr-2 h-4 w-4" /> Envoyer le document</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
