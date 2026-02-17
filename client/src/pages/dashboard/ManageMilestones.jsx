import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import {
    CheckCircle2, Plus, Trash2, Calendar, User,
    ArrowLeft, Loader2, Save, GripVertical, AlertCircle, Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function ManageMilestones() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [site, setSite] = useState(null);
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState(null);

    // New milestone form state
    const [newM, setNewM] = useState({
        description: '',
        responsible: '',
        start_date: '',
        end_date: '',
    });

    const fetchData = async () => {
        try {
            const [siteRes, milestonesRes] = await Promise.all([
                api.get(`/construction/sites/${id}/`),
                api.get(`/construction/milestones/?site=${id}`)
            ]);
            setSite(siteRes.data);
            setMilestones(milestonesRes.data.results || milestonesRes.data || []);
        } catch (err) {
            console.error(err);
            showToast({ message: 'Erreur lors du chargement des données.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newM.description || !newM.responsible || !newM.start_date || !newM.end_date) {
            showToast({ message: 'Veuillez remplir tous les champs obligatoires.', type: 'warning' });
            return;
        }

        setSaving(true);
        try {
            await api.post('/construction/milestones/', {
                ...newM,
                site: id,
                order: milestones.length
            });
            setNewM({ description: '', responsible: '', start_date: '', end_date: '' });
            fetchData();
            showToast({ message: 'Jalon ajouté avec succès.', type: 'success' });
        } catch (err) {
            showToast({ message: 'Erreur lors de l\'ajout.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (mId) => {
        if (!window.confirm('Supprimer ce jalon ?')) return;
        try {
            await api.delete(`/construction/milestones/${mId}/`);
            fetchData();
            showToast({ message: 'Jalon supprimé.', type: 'success' });
        } catch (err) {
            showToast({ message: 'Erreur lors de la suppression.', type: 'error' });
        }
    };

    const toggleComplete = async (m) => {
        try {
            await api.patch(`/construction/milestones/${m.id}/`, {
                completed: !m.completed
            });
            fetchData();
        } catch (err) {
            showToast({ message: 'Erreur lors de la mise à jour.', type: 'error' });
        }
    };

    const startEdit = (m) => {
        setEditingId(m.id);
        setEditFormData({
            description: m.description,
            responsible: m.responsible,
            start_date: m.start_date || '',
            end_date: m.end_date || '',
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditFormData(null);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.patch(`/construction/milestones/${editingId}/`, editFormData);
            setEditingId(null);
            setEditFormData(null);
            fetchData();
            showToast({ message: 'Jalon mis à jour.', type: 'success' });
        } catch (err) {
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

    const inputClasses = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50";

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-20">
            <Link to={`/dashboard/construction/${id}`} className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Retour au chantier
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">Gestion des Jalons</h1>
                    <p className="text-muted-foreground">Planification et suivi des étapes de {site?.name}.</p>
                </div>
                <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg border border-primary/20 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold text-lg">{site?.progress_percentage}%</span>
                    <span className="text-sm opacity-80">Progression</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form to add new milestone */}
                <div className="lg:col-span-1">
                    <div className="bg-card border rounded-xl p-6 shadow-sm sticky top-24">
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            <Plus className="h-5 w-5 text-primary" />
                            Nouveau Jalon
                        </h3>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description *</label>
                                <input
                                    type="text"
                                    className={inputClasses}
                                    placeholder="Ex: Fondation terminée"
                                    value={newM.description}
                                    onChange={e => setNewM({ ...newM, description: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Responsable *</label>
                                <input
                                    type="text"
                                    className={inputClasses}
                                    placeholder="Ex: Entreprise Martin ou Nom"
                                    value={newM.responsible}
                                    onChange={e => setNewM({ ...newM, responsible: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Début *</label>
                                    <input
                                        type="date"
                                        className={inputClasses}
                                        value={newM.start_date}
                                        onChange={e => setNewM({ ...newM, start_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Fin *</label>
                                    <input
                                        type="date"
                                        className={inputClasses}
                                        value={newM.end_date}
                                        onChange={e => setNewM({ ...newM, end_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2 mt-2"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                Ajouter le jalon
                            </button>
                        </form>
                    </div>
                </div>

                {/* List of milestones */}
                <div className="lg:col-span-2 space-y-4">
                    {milestones.length > 0 ? (
                        milestones.map((m, index) => {
                            const isOverdue = !m.completed && new Date(m.end_date) < new Date().setHours(0, 0, 0, 0);
                            const isEditing = editingId === m.id;

                            if (isEditing) {
                                return (
                                    <div key={m.id} className="bg-card border-2 border-primary rounded-xl p-4 shadow-lg animate-in fade-in zoom-in duration-200">
                                        <form onSubmit={handleUpdate} className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</label>
                                                    <input
                                                        type="text"
                                                        className={inputClasses}
                                                        value={editFormData.description}
                                                        onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Responsable</label>
                                                    <input
                                                        type="text"
                                                        className={inputClasses}
                                                        value={editFormData.responsible}
                                                        onChange={e => setEditFormData({ ...editFormData, responsible: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Début</label>
                                                    <input
                                                        type="date"
                                                        className={inputClasses}
                                                        value={editFormData.start_date}
                                                        onChange={e => setEditFormData({ ...editFormData, start_date: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fin</label>
                                                    <input
                                                        type="date"
                                                        className={inputClasses}
                                                        value={editFormData.end_date}
                                                        onChange={e => setEditFormData({ ...editFormData, end_date: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 pt-2 border-t">
                                                <button
                                                    type="button"
                                                    onClick={cancelEdit}
                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3 py-1"
                                                >
                                                    Annuler
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={saving}
                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-3 py-1"
                                                >
                                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                                    Enregistrer
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={m.id}
                                    className={cn(
                                        "bg-card border rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md",
                                        m.completed ? "opacity-75" : "border-l-4 border-l-primary",
                                        isOverdue && !m.completed && "border-l-red-500 bg-red-50/5"
                                    )}
                                >
                                    <div className="p-4 flex items-start gap-4">
                                        <div className="pt-1">
                                            <button
                                                onClick={() => toggleComplete(m)}
                                                className={cn(
                                                    "h-6 w-6 rounded-md border-2 flex items-center justify-center transition-colors",
                                                    m.completed
                                                        ? "bg-primary border-primary text-white"
                                                        : "border-muted-foreground/30 hover:border-primary"
                                                )}
                                            >
                                                {m.completed && <CheckCircle2 className="h-4 w-4" />}
                                            </button>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={cn("font-semibold text-lg truncate", m.completed && "text-muted-foreground line-through")}>
                                                        {m.description}
                                                    </h4>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {m.start_date ? format(new Date(m.start_date), 'dd MMM', { locale: fr }) : '-'} - {m.end_date ? format(new Date(m.end_date), 'dd MMM yyyy', { locale: fr }) : 'Non déterm.'}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <User className="h-3.5 w-3.5" />
                                                            {m.responsible || 'Non renseigné'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={() => startEdit(m)}
                                                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                                        title="Modifier"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(m.id)}
                                                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {isOverdue && !m.completed && (
                                                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-red-600 bg-red-600/10 px-2 py-1 rounded-md w-fit">
                                                    <AlertCircle className="h-3 w-3" />
                                                    En retard
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="bg-card border border-dashed rounded-xl p-12 text-center text-muted-foreground">
                            <Plus className="h-12 w-12 mx-auto mb-4 opacity-10" />
                            <p className="text-lg font-medium">Aucun jalon défini</p>
                            <p className="text-sm">Commencez par ajouter une étape pour ce chantier.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
