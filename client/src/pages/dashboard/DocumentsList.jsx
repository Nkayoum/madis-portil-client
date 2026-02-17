import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/axios';
import { FileText, Download, Search, Loader2, File } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DocumentsList() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await api.get('/documents/');
            setDocuments(response.data.results || []);
        } catch (err) {
            setError('Impossible de charger les documents.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredDocuments = documents.filter(doc => {
        const matchesFilter = filter === 'ALL' || doc.category === filter;
        const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const categories = [
        { value: 'ALL', label: 'Tous' },
        { value: 'CONTRAT', label: 'Contrats' },
        { value: 'FACTURE', label: 'Factures' },
        { value: 'PLAN', label: 'Plans' },
        { value: 'PHOTO', label: 'Photos' },
        { value: 'ADMINISTRATIF', label: 'Administratif' },
    ];

    const getCategoryColor = (category) => {
        const colors = {
            CONTRAT: 'bg-primary/10 text-primary',
            FACTURE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
            PLAN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
            PHOTO: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
            ADMINISTRATIF: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
            AUTRE: 'bg-muted text-muted-foreground',
        };
        return colors[category] || colors.AUTRE;
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">Mes Documents</h1>
                    <p className="text-muted-foreground">Consultez et gérez vos fichiers.</p>
                </div>
                <Link
                    to="/dashboard/documents/new"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                >
                    <FileText className="mr-2 h-4 w-4" />
                    Ajouter un document
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="bg-card border rounded-xl p-4 flex flex-col md:flex-row gap-3 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Rechercher un document..."
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                    {categories.map((cat) => (
                        <button
                            key={cat.value}
                            onClick={() => setFilter(cat.value)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors border ${filter === cat.value
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Documents List */}
            <div className="space-y-4">
                {filteredDocuments.length === 0 ? (
                    <div className="text-center py-16 bg-card rounded-xl border border-dashed">
                        <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <File className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Aucun document trouvé</h3>
                        <p className="text-muted-foreground max-w-md mx-auto text-sm">
                            Essayez de modifier vos filtres de recherche ou ajoutez un nouveau document.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredDocuments.map((doc) => (
                            <div key={doc.id} className="group rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`p-2.5 rounded-lg ${getCategoryColor(doc.category)}`}>
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <a
                                        href={doc.file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        title="Télécharger"
                                    >
                                        <Download className="h-4 w-4" />
                                    </a>
                                </div>

                                <h3 className="font-semibold line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                                    {doc.title}
                                </h3>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(doc.category)}`}>
                                        {doc.category_display || doc.category}
                                    </span>
                                    <span>•</span>
                                    <span>
                                        {format(new Date(doc.uploaded_at), 'dd MMM yyyy', { locale: fr })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
