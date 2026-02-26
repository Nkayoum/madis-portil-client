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

    const inputClasses = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <Link to="/dashboard/tickets" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Retour aux messages
            </Link>

            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-1">Nouveau Ticket</h1>
                <p className="text-muted-foreground">Envoyez un message à l'équipe MaDis.</p>
            </div>

            <div className="bg-card border rounded-xl p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium leading-none">Sujet *</label>
                        <input type="text" name="subject" required className={inputClasses} placeholder="Décrivez brièvement votre demande" value={formData.subject} onChange={handleChange} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none">Priorité</label>
                            <select name="priority" className={inputClasses} value={formData.priority} onChange={handleChange}>
                                <option value="LOW">Basse</option>
                                <option value="MEDIUM">Moyenne</option>
                                <option value="HIGH">Haute</option>
                                <option value="URGENT">Urgente</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none">Catégorie</label>
                            <select name="category" className={inputClasses} value={formData.category} onChange={handleChange}>
                                <option value="GENERAL">Général</option>
                                <option value="TECHNIQUE">Technique</option>
                                <option value="ADMINISTRATIF">Administratif</option>
                                <option value="FINANCIER">Financier</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium leading-none">Description *</label>
                        <textarea name="description" required rows="6" className={`${inputClasses} min-h-[120px] resize-y`} placeholder="Expliquez votre demande en détail..." value={formData.description} onChange={handleChange} />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium leading-none">Pièce jointe</label>
                        <input type="file" name="attachment" className={inputClasses} onChange={handleChange} />
                        <p className="text-xs text-muted-foreground">Formats acceptés : Images, PDF, Word (max 10 Mo)</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Link to="/dashboard/tickets" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2"
                        >
                            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi...</> : <><MessageSquare className="mr-2 h-4 w-4" /> Envoyer</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
