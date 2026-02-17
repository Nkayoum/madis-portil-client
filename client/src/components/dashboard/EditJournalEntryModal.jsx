import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import {
    FileText, Loader2, Save,
    Sun, Cloud, CloudRain, Wind, Snowflake, Zap,
    Camera, X
} from 'lucide-react';

const WEATHER_OPTIONS = [
    { value: 'ENSOLEILLE', label: 'Ensoleillé', icon: Sun },
    { value: 'NUAGEUX', label: 'Nuageux', icon: Cloud },
    { value: 'PLUIE', label: 'Pluie', icon: CloudRain },
    { value: 'VENT', label: 'Vent', icon: Wind },
    { value: 'NEIGE', label: 'Neige', icon: Snowflake },
    { value: 'ORAGE', label: 'Orage', icon: Zap },
];

export default function EditJournalEntryModal({ isOpen, onClose, entryId, onSuccess }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [siteName, setSiteName] = useState('');
    const [siteId, setSiteId] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [existingPhotos, setExistingPhotos] = useState([]);
    const [formData, setFormData] = useState({
        site: '',
        date: '',
        weather: 'ENSOLEILLE',
        content: '',
        workers_count: 1,
    });

    useEffect(() => {
        if (isOpen && entryId) {
            fetchData();
        }
    }, [isOpen, entryId]);

    const fetchData = async () => {
        setFetching(true);
        try {
            const res = await api.get(`/construction/journal/${entryId}/`);
            const entry = res.data;
            setFormData({
                site: entry.site,
                date: entry.date,
                weather: entry.weather,
                content: entry.content,
                workers_count: entry.workers_count,
            });
            setSiteId(entry.site);
            setSiteName(entry.site_name || entry.site);
            setExistingPhotos(entry.photos || []);
            setPhotos([]); // Reset new photos
            setFetching(false);
        } catch (err) {
            console.error(err);
            showToast({ message: 'Erreur lors du chargement du rapport.', type: 'error' });
            onClose();
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e) => {
        if (e.target.files) {
            const newPhotos = Array.from(e.target.files);
            setPhotos(prev => [...prev, ...newPhotos]);
        }
    };

    const removeNewPhoto = (index) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const deleteExistingPhoto = async (photoId) => {
        if (!window.confirm('Voulez-vous vraiment supprimer cette photo ?')) return;
        try {
            await api.delete(`/construction/photos/${photoId}/`);
            setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
            showToast({ message: 'Photo supprimée.', type: 'success' });
        } catch (err) {
            console.error(err);
            showToast({ message: 'Erreur lors de la suppression de la photo.', type: 'error' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Update Journal Entry
            await api.patch(`/construction/journal/${entryId}/`, formData);

            // 2. Upload New Photos if any
            if (photos.length > 0) {
                await Promise.all(photos.map(photo => {
                    const fd = new FormData();
                    fd.append('site', siteId);
                    fd.append('journal_entry', entryId);
                    fd.append('image', photo);
                    fd.append('taken_at', new Date().toISOString());
                    return api.post('/construction/photos/', fd, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                }));
            }

            showToast({ message: 'Rapport mis à jour avec succès !', type: 'success' });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            let msg = 'Erreur lors de la mise à jour du rapport.';
            if (err.response?.data) {
                const data = err.response.data;
                if (data.non_field_errors) {
                    msg = data.non_field_errors[0];
                } else if (typeof data === 'object') {
                    const firstError = Object.values(data)[0];
                    msg = Array.isArray(firstError) ? firstError[0] : firstError;
                }
            }
            showToast({ message: msg, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputClasses = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-muted/30 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Modifier le <span className="text-primary">Rapport de Chantier</span></h2>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-0.5">{siteName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    {fetching ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <form id="edit-journal-form" onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date *</label>
                                    <input type="date" name="date" required className={inputClasses} value={formData.date} onChange={handleChange} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Météo</label>
                                    <select name="weather" className={inputClasses} value={formData.weather} onChange={handleChange}>
                                        {WEATHER_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ouvriers présents *</label>
                                    <input type="number" name="workers_count" min="0" required className={inputClasses} value={formData.workers_count} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description des travaux *</label>
                                <textarea
                                    name="content"
                                    required
                                    rows="6"
                                    className={`${inputClasses} h-auto min-h-[120px] resize-none py-3`}
                                    placeholder="Détaillez les activités de la journée..."
                                    value={formData.content}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Photos</label>
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                    {/* Existing Photos */}
                                    {existingPhotos.map((photo) => (
                                        <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border bg-muted group shadow-sm">
                                            <img
                                                src={photo.image}
                                                alt="Chantier"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => deleteExistingPhoto(photo.id)}
                                                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}

                                    {/* New Photos (Aperçu) */}
                                    {photos.map((photo, index) => (
                                        <div key={`new-${index}`} className="relative aspect-square rounded-lg overflow-hidden border bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 group shadow-sm">
                                            <img
                                                src={URL.createObjectURL(photo)}
                                                alt="Nouveau"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeNewPhoto(index)}
                                                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                            <div className="absolute bottom-0 inset-x-0 bg-blue-600 text-[8px] text-white text-center py-0.5 font-bold uppercase">Nouveau</div>
                                        </div>
                                    ))}

                                    <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                                        <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                                        <span className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Photo</span>
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                    </label>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-muted/30 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-6"
                    >
                        Annuler
                    </button>
                    <button
                        form="edit-journal-form"
                        type="submit"
                        disabled={loading || fetching}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 disabled:opacity-50"
                    >
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mise à jour...</> : <><Save className="mr-2 h-4 w-4" /> Enregistrer les modifications</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
