import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import { Users, Search, MoreHorizontal, Shield, UserCheck, Loader2, Plus, UserX, HardHat, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';


export default function UsersList() {
    const { showToast } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);



    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/auth/users/');
            setUsers(response.data.results || []);
        } catch (err) {
            setError('Impossible de charger les clients. Vérifiez vos droits d\'accès.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.')) {
            return;
        }

        try {
            await api.delete(`/auth/users/${id}/`);
            setUsers(users.filter(u => u.id !== id));
            showToast({ message: 'Client supprimé avec succès.', type: 'success' });
        } catch (err) {
            console.error(err);
            showToast({ message: 'Erreur lors de la suppression.', type: 'error' });
        }
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.first_name.toLowerCase().includes(search.toLowerCase()) ||
        user.last_name.toLowerCase().includes(search.toLowerCase())
    );

    const getRoleBadge = (role) => {
        switch (role) {
            case 'ADMIN_MADIS':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"><Shield className="w-3 h-3 mr-1" /> Admin</span>;
            case 'CHEF_CHANTIER':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"><HardHat className="w-3 h-3 mr-1" /> Chef Chantier</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"><UserCheck className="w-3 h-3 mr-1" /> Client</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center p-4 bg-destructive/10 rounded-full mb-4">
                    <UserX className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-xl font-bold mb-2">Accès Refusé</h2>
                <p className="text-muted-foreground">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">Clients</h1>
                    <p className="text-muted-foreground">Gérez les accès et les comptes clients.</p>
                </div>
                <Link
                    to="/dashboard/users/new"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un client
                </Link>
            </div>

            <div className="bg-card border rounded-xl p-4 shadow-sm">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou email..."
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-xl border bg-card shadow-sm">
                <div className="overflow-x-auto pb-24">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium border-b text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Rôle</th>
                                <th className="px-6 py-4">Statut</th>
                                <th className="px-6 py-4">Date création</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                {user.first_name?.[0]}{user.last_name?.[0]}
                                            </div>
                                            <div>
                                                <div className="font-medium group-hover:text-primary transition-colors">{user.first_name} {user.last_name}</div>
                                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getRoleBadge(user.role)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.is_active ? (
                                            <span className="inline-flex items-center gap-1.5 text-green-700 dark:text-green-400 font-medium text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/20">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                Actif
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-red-700 dark:text-red-400 font-medium text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/20">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                Inactif
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {format(new Date(user.date_joined || user.created_at || new Date()), 'd MMM yyyy', { locale: fr })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="relative inline-block text-left">
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                                                className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>

                                            {openMenuId === user.id && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-10"
                                                        onClick={() => setOpenMenuId(null)}
                                                    ></div>
                                                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card border border-border z-20 animate-in fade-in zoom-in duration-200">
                                                        <div className="py-1">
                                                            <Link
                                                                to={`/dashboard/users/${user.id}/edit`}
                                                                className="flex items-center w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                                                            >
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Modifier
                                                            </Link>
                                                            <button
                                                                onClick={() => {
                                                                    setOpenMenuId(null);
                                                                    handleDelete(user.id);
                                                                }}
                                                                className="flex items-center w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Supprimer
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && (
                        <div className="text-center py-16">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-semibold mb-1">Aucun client trouvé</h3>
                            <p className="text-muted-foreground text-sm">Essayez une autre recherche.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
