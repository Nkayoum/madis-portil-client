import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import {
    CheckCircle2, Plus, Trash2, Calendar, User,
    ArrowLeft, Loader2, Save, GripVertical, AlertCircle, Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../../lib/utils';

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
        <div className="max-w-[1600px] mx-auto space-y-10 animate-fade-in pb-20 px-4 md:px-10">
            <Link to={`/dashboard/construction/${id}`} className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-black dark:hover:text-white transition-all group w-fit">
                <ArrowLeft className="mr-3 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Retour au chantier
            </Link>

            <div className="solaris-glass rounded-[2rem] p-6 border-none shadow-xl relative overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="p-3 bg-black text-white rounded-2xl shadow-xl relative group">
                            <CheckCircle2 className="h-6 w-6 group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute -inset-1 bg-black/5 rounded-[1.2rem] -z-10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter uppercase leading-none mb-1.5">Gestion des Jalons</h1>
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Planification et suivi des étapes de {site?.name}</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end lg:border-l lg:pl-8 border-black/5">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30 mb-2">
                            Progression Actuelle
                        </span>
                        <div className="flex items-center gap-4">
                            <div className="w-48 h-2 bg-black/[0.03] dark:bg-white/10 rounded-full overflow-hidden p-[1px] border border-black/5 dark:border-white/5 shadow-inner">
                                <div
                                    className="h-full bg-black dark:bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_10px_rgba(255,255,255,0.05)] transition-all duration-1000 ease-out"
                                    style={{ width: `${site?.progress_percentage}%` }}
                                />
                            </div>
                            <span className="font-black text-xl tracking-tighter leading-none">{site?.progress_percentage}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form to add new milestone Solaris Style */}
                <div className="lg:col-span-1">
                    <div className="solaris-glass rounded-[1.5rem] p-6 border-none shadow-xl sticky top-24">
                        <h3 className="text-[8px] font-black uppercase tracking-[0.2em] opacity-30 mb-6 flex items-center gap-2.5">
                            <Plus className="h-3.5 w-3.5" />
                            Nouveau Jalon
                        </h3>
                        <form onSubmit={handleAdd} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[8px] font-black uppercase tracking-widest opacity-40 ml-1">Désignation *</label>
                                <input
                                    type="text"
                                    className="ic w-full p-3 rounded-xl bg-black/[0.01] dark:bg-white/5 border border-black/5 dark:border-white/10 focus:bg-white dark:focus:bg-white/10 transition-all text-[11px] font-bold dark:text-white dark:placeholder:text-white/30"
                                    placeholder="Ex: Fondation terminée"
                                    value={newM.description}
                                    onChange={e => setNewM({ ...newM, description: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[8px] font-black uppercase tracking-widest opacity-40 ml-1">Responsable *</label>
                                <input
                                    type="text"
                                    className="ic w-full p-3 rounded-xl bg-black/[0.01] border-black/5 focus:bg-white transition-all text-[11px] font-bold"
                                    placeholder="Ex: Entreprise Martin"
                                    value={newM.responsible}
                                    onChange={e => setNewM({ ...newM, responsible: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black uppercase tracking-widest opacity-40 ml-1">Début *</label>
                                    <input
                                        type="date"
                                        className="ic w-full p-3 rounded-xl bg-black/[0.01] dark:bg-white/5 border border-black/5 dark:border-white/10 focus:bg-white dark:focus:bg-white/10 transition-all text-[11px] font-bold font-mono dark:text-white dark:[color-scheme:dark]"
                                        value={newM.start_date}
                                        onChange={e => setNewM({ ...newM, start_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black uppercase tracking-widest opacity-40 ml-1">Fin Estimée *</label>
                                    <input
                                        type="date"
                                        className="ic w-full p-3 rounded-xl bg-black/[0.01] border-black/5 focus:bg-white transition-all text-[11px] font-bold font-mono"
                                        value={newM.end_date}
                                        onChange={e => setNewM({ ...newM, end_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full inline-flex items-center justify-center rounded-xl text-[9px] font-black uppercase tracking-widest transition-all bg-primary text-white hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] h-10 px-6 mt-2 shadow shadow-primary/20 group"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />}
                                Ajouter au Planning
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
                                    <div key={m.id} className="solaris-glass rounded-[2rem] p-8 border-2 border-black/10 dark:border-white/10 shadow-2xl animate-in fade-in zoom-in duration-200">
                                        <form onSubmit={handleUpdate} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Description</label>
                                                    <input
                                                        type="text"
                                                        className="ic w-full p-4 rounded-2xl bg-black/[0.01] dark:bg-white/5 border border-black/5 dark:border-white/10 focus:bg-white dark:focus:bg-white/10 transition-all text-[12px] font-bold dark:text-white dark:placeholder:text-white/30"
                                                        value={editFormData.description}
                                                        onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Responsable</label>
                                                    <input
                                                        type="text"
                                                        className="ic w-full p-4 rounded-2xl bg-black/[0.01] dark:bg-white/5 border border-black/5 dark:border-white/10 focus:bg-white dark:focus:bg-white/10 transition-all text-[12px] font-bold dark:text-white dark:placeholder:text-white/30"
                                                        value={editFormData.responsible}
                                                        onChange={e => setEditFormData({ ...editFormData, responsible: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Début</label>
                                                    <input
                                                        type="date"
                                                        className="ic w-full p-4 rounded-2xl bg-black/[0.01] dark:bg-white/5 border border-black/5 dark:border-white/10 focus:bg-white dark:focus:bg-white/10 transition-all text-[12px] font-bold font-mono dark:text-white dark:[color-scheme:dark]"
                                                        value={editFormData.start_date}
                                                        onChange={e => setEditFormData({ ...editFormData, start_date: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Fin</label>
                                                    <input
                                                        type="date"
                                                        className="ic w-full p-4 rounded-2xl bg-black/[0.01] dark:bg-white/5 border border-black/5 dark:border-white/10 focus:bg-white dark:focus:bg-white/10 transition-all text-[12px] font-bold font-mono dark:text-white dark:[color-scheme:dark]"
                                                        value={editFormData.end_date}
                                                        onChange={e => setEditFormData({ ...editFormData, end_date: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-3 pt-6 border-t border-black/5 dark:border-white/[0.06]">
                                                <button
                                                    type="button"
                                                    onClick={cancelEdit}
                                                    className="inline-flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 shadow-sm hover:bg-black/5 dark:hover:bg-white/20 h-11 px-6 dark:text-white"
                                                >
                                                    Annuler
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={saving}
                                                    className="inline-flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-primary text-white hover:shadow-xl h-11 px-6 shadow-lg shadow-primary/20 dark:shadow-[0_0_20px_rgba(236,72,153,0.3)]"
                                                >
                                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                                    Mettre à jour
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
                                        "solaris-glass rounded-[1.5rem] overflow-hidden shadow-lg transition-all duration-500 hover:shadow-xl hover:scale-[1.005] border-none group",
                                        m.completed ? "opacity-60 grayscale-[0.5]" : "relative"
                                    )}
                                >
                                    {!m.completed && <div className="absolute inset-y-0 left-0 w-1.5 bg-black" />}

                                    <div className="p-4 md:p-5 flex items-center gap-6">
                                        <div className="relative">
                                            <button
                                                onClick={() => toggleComplete(m)}
                                                className={cn(
                                                    "h-8 w-8 rounded-xl border-2 flex items-center justify-center transition-all duration-500",
                                                    m.completed
                                                        ? "bg-black border-black text-white shadow-md font-bold"
                                                        : "border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 bg-white dark:bg-white/10"
                                                )}
                                            >
                                                {m.completed && <CheckCircle2 className="h-4 w-4" />}
                                                {!m.completed && <div className="h-1.5 w-1.5 rounded-full bg-black/10 group-hover:bg-black group-hover:scale-125 transition-all" />}
                                            </button>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={cn("text-[13px] font-black tracking-tight uppercase leading-tight mb-1.5", m.completed && "text-muted-foreground/60 line-through")}>
                                                        {m.description}
                                                    </h4>
                                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 mt-0.5">
                                                        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest opacity-40">
                                                            <Calendar className="h-3 w-3" />
                                                            <span className="font-mono text-[9px] font-bold text-black dark:text-white opacity-100">
                                                                {m.start_date ? format(new Date(m.start_date), 'dd MMM', { locale: fr }) : '-'} — {m.end_date ? format(new Date(m.end_date), 'dd MMM yyyy', { locale: fr }) : 'Non déterm.'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest opacity-40">
                                                            <User className="h-3 w-3" />
                                                            <span className="text-black dark:text-white opacity-100 text-[9px]">{m.responsible || 'Non renseigné'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                                                    <button
                                                        onClick={() => startEdit(m)}
                                                        className="p-2 text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white/20 bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 rounded-xl shadow-sm transition-all"
                                                        title="Modifier"
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(m.id)}
                                                        className="p-2 text-red-500 hover:bg-red-600 hover:text-white bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 rounded-xl shadow-sm transition-all"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {isOverdue && !m.completed && (
                                                <div className="mt-3 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-primary">
                                                    <AlertCircle className="h-3 w-3" />
                                                    Dépassement de délais
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="solaris-glass rounded-[2.5rem] p-24 text-center border-none shadow-xl">
                            <div className="mx-auto h-20 w-20 rounded-full bg-black/[0.03] flex items-center justify-center mb-8">
                                <Plus className="h-10 w-10 text-black/10" />
                            </div>
                            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] mb-3">Planning Vierge</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-30 max-w-xs mx-auto">Définissez les phases critiques du chantier pour une gestion optimale.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
