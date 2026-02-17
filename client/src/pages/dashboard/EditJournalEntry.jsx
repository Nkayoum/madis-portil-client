import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import {
    FileText, Loader2, ArrowLeft, Save,
    Sun, Cloud, CloudRain, Wind, Snowflake, Zap,
    Camera, X
} from 'lucide-react';
import { format } from 'date-fns';

const WEATHER_OPTIONS = [
    { value: 'ENSOLEILLE', label: 'Ensoleillé', icon: Sun },
    { value: 'NUAGEUX', label: 'Nuageux', icon: Cloud },
    { value: 'PLUIE', label: 'Pluie', icon: CloudRain },
    { value: 'VENT', label: 'Vent', icon: Wind },
    { value: 'NEIGE', label: 'Neige', icon: Snowflake },
    { value: 'ORAGE', label: 'Orage', icon: Zap },
];

export default function EditJournalEntry() {
    const { id: entryId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [siteName, setSiteName] = useState('');
    const [siteId, setSiteId] = useState(null);
    const [photos, setPhotos] = useState([]); // This would handle new photos
    const [existingPhotos, setExistingPhotos] = useState([]);
    const [formData, setFormData] = useState({
        site: '',
        date: '',
        weather: 'ENSOLEILLE',
        content: '',
        workers_count: 1,
    });

    useEffect(() => {
        const fetchData = async () => {
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
                setFetching(false);
            } catch (err) {
                console.error(err);
                showToast({ message: 'Erreur lors du chargement du rapport.', type: 'error' });
                navigate(-1);
            }
        };
        fetchData();
    }, [entryId]);

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
            navigate(`/dashboard/construction/${siteId}?tab=journal`);
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

    const inputClasses = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

    if (fetching) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <Link to={`/dashboard/construction/${siteId}?tab=journal`} className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Retour au journal
            </Link>

            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-1">Modifier le Rapport</h1>
                <p className="text-muted-foreground">Chantier : <span className="text-foreground font-semibold">{siteName}</span></p>
            </div>

            <div className="bg-card border rounded-xl p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none">Date *</label>
                            <input type="date" name="date" required className={inputClasses} value={formData.date} onChange={handleChange} />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none">Météo</label>
                            <select name="weather" className={inputClasses} value={formData.weather} onChange={handleChange}>
                                {WEATHER_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none">Ouvriers présents *</label>
                            <input type="number" name="workers_count" min="0" required className={inputClasses} value={formData.workers_count} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium leading-none">Description des travaux *</label>
                        <textarea
                            name="content"
                            required
                            rows="8"
                            className={`${inputClasses} min-h-[150px] resize-y`}
                            placeholder="Détaillez les activités de la journée..."
                            value={formData.content}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium leading-none mb-2">Photos</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Existing Photos */}
                            {existingPhotos.map((photo) => (
                                <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border bg-muted group">
                                    <img
                                        src={photo.image}
                                        alt="Chantier"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => deleteExistingPhoto(photo.id)}
                                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}

                            {/* New Photos (Aperçu) */}
                            {photos.map((photo, index) => (
                                <div key={`new-${index}`} className="relative aspect-square rounded-lg overflow-hidden border bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                                    <img
                                        src={URL.createObjectURL(photo)}
                                        alt="Nouveau"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeNewPhoto(index)}
                                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                    <div className="absolute bottom-0 inset-x-0 bg-blue-600 text-[8px] text-white text-center py-0.5 font-bold uppercase">Nouveau</div>
                                </div>
                            ))}

                            <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                                <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                                <span className="text-[10px] uppercase font-bold text-muted-foreground text-center px-2">Ajouter photo</span>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoChange} />
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t">
                        <button
                            type="button"
                            onClick={() => navigate(`/dashboard/construction/${siteId}?tab=journal`)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2"
                        >
                            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mise à jour...</> : <><Save className="mr-2 h-4 w-4" /> Enregistrer les modifications</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
