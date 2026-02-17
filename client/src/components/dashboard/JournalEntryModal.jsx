import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import {
    FileText, Loader2, Save,
    Sun, Cloud, CloudRain, Wind, Snowflake, Zap,
    Camera, X, AlertCircle, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const WEATHER_OPTIONS = [
    { value: 'ENSOLEILLE', label: 'Ensoleillé', icon: Sun },
    { value: 'NUAGEUX', label: 'Nuageux', icon: Cloud },
    { value: 'PLUIE', label: 'Pluie', icon: CloudRain },
    { value: 'VENT', label: 'Vent', icon: Wind },
    { value: 'NEIGE', label: 'Neige', icon: Snowflake },
    { value: 'ORAGE', label: 'Orage', icon: Zap },
];

export default function JournalEntryModal({ isOpen, onClose, site, onSuccess }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [photos, setPhotos] = useState([]);
    const [existingEntry, setExistingEntry] = useState(null);
    const [checkingExisting, setCheckingExisting] = useState(false);
    const [formData, setFormData] = useState({
        site: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        weather: 'ENSOLEILLE',
        content: '',
        workers_count: 1,
    });

    useEffect(() => {
        if (site && isOpen) {
            setFormData(prev => ({
                ...prev,
                site: site.id,
                date: format(new Date(), 'yyyy-MM-dd'),
            }));
            setPhotos([]);
            setExistingEntry(null);
        }
    }, [site, isOpen]);

    useEffect(() => {
        const checkExistingEntry = async () => {
            if (!formData.date || !site?.id || !isOpen) return;
            setCheckingExisting(true);
            try {
                const res = await api.get(`/construction/journal/?site=${site.id}&date=${formData.date}`);
                const results = res.data.results || res.data || [];
                setExistingEntry(results.length > 0 ? results[0] : null);
            } catch (err) {
                console.error('Error checking existing entry:', err);
            } finally {
                setCheckingExisting(false);
            }
        };

        const timeoutId = setTimeout(checkExistingEntry, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.date, site?.id, isOpen]);

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

    const removePhoto = (index) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (existingEntry) return;

        setLoading(true);
        try {
            // 1. Create Journal Entry
            const journalRes = await api.post('/construction/journal/', formData);
            const journalId = journalRes.data.id;

            // 2. Upload Photos if any
            if (photos.length > 0) {
                await Promise.all(photos.map(photo => {
                    const fd = new FormData();
                    fd.append('site', site.id);
                    fd.append('journal_entry', journalId);
                    fd.append('image', photo);
                    fd.append('taken_at', new Date().toISOString());
                    return api.post('/construction/photos/', fd, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                }));
            }

            showToast({ message: 'Rapport enregistré avec succès !', type: 'success' });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            let msg = 'Erreur lors de la création du rapport.';
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
                            <h2 className="text-xl font-bold tracking-tight">Nouveau <span className="text-primary">Rapport de Chantier</span></h2>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-0.5">{site?.name}</p>
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
                    {existingEntry && (
                        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                                    Un rapport existe déjà pour cette date.
                                </p>
                                <p className="text-xs text-amber-700 dark:text-amber-500">
                                    Il est impossible de créer deux rapports pour le même jour.
                                </p>
                                <Link
                                    to={`/dashboard/construction/journal/${existingEntry.id}/edit`}
                                    onClick={onClose}
                                    className="inline-flex items-center text-xs font-bold text-amber-900 dark:text-amber-300 hover:underline mt-1"
                                >
                                    Modifier le rapport existant <ArrowRight className="ml-1 h-3 w-3" />
                                </Link>
                            </div>
                        </div>
                    )}

                    <form id="journal-form" onSubmit={handleSubmit} className="space-y-6">
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
                                placeholder="Détaillez les activités de la journée, les incidents éventuels..."
                                value={formData.content}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Photos (Optionnel)</label>
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                {photos.map((photo, index) => (
                                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-muted group shadow-sm">
                                        <img
                                            src={URL.createObjectURL(photo)}
                                            alt="Aperçu"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(index)}
                                            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
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
                        form="journal-form"
                        type="submit"
                        disabled={loading || !!existingEntry || checkingExisting}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 disabled:opacity-50"
                    >
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</> : (
                            checkingExisting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Vérification...</> : <><Save className="mr-2 h-4 w-4" /> Enregistrer le rapport</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
