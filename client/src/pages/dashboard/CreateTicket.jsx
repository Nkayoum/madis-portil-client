import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/axios';
import { useToast } from '../../context/ToastContext';
import { MessageSquare, Loader2, ArrowLeft } from 'lucide-react';

export default function CreateTicket() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        priority: 'MEDIUM',
        category: 'GENERAL',
    });
    const [selectedFile, setSelectedFile] = useState(null);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'attachment') {
            setSelectedFile(files[0]);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key]);
            });
            if (selectedFile) {
                data.append('attachment', selectedFile);
            }

            await api.post('/tickets/', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            showToast({ message: 'Ticket créé avec succès !', type: 'success' });
            navigate('/dashboard/tickets');
        } catch (err) {
            console.error(err);
            showToast({ message: 'Erreur lors de la création du ticket.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "flex w-full rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] px-4 py-3 text-[11px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-transparent placeholder:text-muted-foreground/30";

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-12">
            <Link to="/dashboard/tickets" className="flex items-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-all group w-fit">
                <ArrowLeft className="mr-2 h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                Retour aux messages
            </Link>

            <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">Nouveau Ticket</h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Envoyez un message à l'équipe MaDis.</p>
            </div>

            <div className="solaris-glass rounded-[2.5rem] p-8 md:p-10 shadow-xl border-none relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 pointer-events-none">
                    <MessageSquare size={120} />
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    <div className="space-y-3">
                        <label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2 px-1">
                            Sujet du message *
                        </label>
                        <input
                            type="text"
                            name="subject"
                            required
                            className={inputClasses}
                            placeholder="Décrivez brièvement votre demande"
                            value={formData.subject}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-30 px-1">Priorité</label>
                            <select name="priority" className={inputClasses} value={formData.priority} onChange={handleChange}>
                                <option value="LOW">Basse</option>
                                <option value="MEDIUM">Moyenne</option>
                                <option value="HIGH">Haute</option>
                                <option value="URGENT">Urgente</option>
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-30 px-1">Catégorie</label>
                            <select name="category" className={inputClasses} value={formData.category} onChange={handleChange}>
                                <option value="GENERAL">Général</option>
                                <option value="TECHNIQUE">Technique</option>
                                <option value="ADMINISTRATIF">Administratif</option>
                                <option value="FINANCIER">Financier</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-30 px-1">Description détaillée *</label>
                        <textarea
                            name="description"
                            required
                            rows="6"
                            className={`${inputClasses} min-h-[160px] resize-none py-4`}
                            placeholder="Expliquez votre demande en détail..."
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-30 px-1">Pièce jointe</label>
                        <div className="relative group">
                            <input
                                type="file"
                                name="attachment"
                                className={`${inputClasses} cursor-pointer file:hidden`}
                                onChange={handleChange}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] font-black uppercase tracking-widest opacity-20 group-hover:opacity-40 transition-opacity">
                                Parcourir
                            </div>
                        </div>
                        <p className="text-[8px] font-bold uppercase tracking-widest opacity-20 px-1">Formats acceptés : Images, PDF, Word (max 10 Mo)</p>
                    </div>

                    <div className="flex flex-col md:flex-row justify-end gap-4 pt-6 border-t border-black/5 dark:border-white/5">
                        <Link
                            to="/dashboard/tickets"
                            className="inline-flex items-center justify-center rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 h-14 px-8"
                        >
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center rounded-full text-[10px] font-black uppercase tracking-widest transition-all bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none h-14 px-10"
                        >
                            {loading ? (
                                <><Loader2 className="mr-3 h-4 w-4 animate-spin" /> Envoi en cours</>
                            ) : (
                                <><MessageSquare className="mr-3 h-4 w-4" /> Envoyer le message</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
