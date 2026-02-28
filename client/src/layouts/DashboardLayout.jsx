import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    Users,
    Home,
    Building2,
    FileText,
    MessageSquare,
    HardHat,
    LogOut,
    Menu,
    X,
    Sun,
    Moon,
    LayoutDashboard,
    ShoppingBag,
    Wallet
} from 'lucide-react';
import { cn } from '../lib/utils';
import NotificationCenter from '../components/dashboard/NotificationCenter';

import logo from '../assets/logo.png';

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const navigation = [
        { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Biens', href: '/dashboard/properties', icon: Home, roles: ['ADMIN_MADIS', 'CLIENT'] },
        { name: 'Projets', href: '/dashboard/projects', icon: Building2, roles: ['ADMIN_MADIS', 'CLIENT'] },
        { name: 'Finance', href: '/dashboard/finance', icon: Wallet, roles: ['ADMIN_MADIS', 'CLIENT'] },
        { name: 'Documents', href: '/dashboard/documents', icon: FileText, roles: ['ADMIN_MADIS', 'CLIENT', 'CHEF_CHANTIER'] },
        { name: 'Messagerie', href: '/dashboard/tickets', icon: MessageSquare, roles: ['ADMIN_MADIS', 'CLIENT', 'CHEF_CHANTIER'] },
        { name: 'Chantiers', href: '/dashboard/construction', icon: HardHat, roles: ['ADMIN_MADIS', 'CLIENT', 'CHEF_CHANTIER'] },
        { name: 'Marketplace', href: '/dashboard/marketplace', icon: ShoppingBag, roles: ['ADMIN_MADIS', 'CLIENT'] },
        { name: 'Clients', href: '/dashboard/users', icon: Users, roles: ['ADMIN_MADIS'] },
    ];

    const filteredNavigation = navigation.filter(item => !item.roles || item.roles.includes(user?.role));

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="min-h-screen bg-transparent flex">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-background/60 backdrop-blur-md z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-screen w-64 solaris-sidebar transition-transform duration-300 lg:translate-x-0 lg:static flex flex-col shadow-xl lg:shadow-none",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-20 flex items-center px-6 mb-4">
                    <img src={logo} alt="MaDis Logo" className="h-10 w-auto" />
                    <button className="ml-auto lg:hidden" onClick={toggleSidebar}>
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="p-4 space-y-2 flex-1 overflow-y-auto no-scrollbar">
                    {filteredNavigation.map((item) => {
                        const isActive = item.href === '/dashboard'
                            ? location.pathname === '/dashboard'
                            : location.pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "flex items-center px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02] dark:solaris-neon-blue dark:bg-white/5 dark:text-white"
                                        : "text-muted-foreground hover:bg-white/40 hover:text-foreground dark:hover:bg-white/5"
                                )}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon className={cn("h-5 w-5 mr-3", isActive ? "animate-pulse" : "")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-primary/5">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center text-primary font-black text-lg">
                            {user?.first_name?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-black truncate text-foreground">{user?.first_name} {user?.last_name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center px-4 py-3 text-xs font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 rounded-2xl transition-all"
                    >
                        <LogOut className="h-4 w-4 mr-3" />
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Header */}
                <header className="h-16 md:h-20 bg-white/20 dark:bg-black/20 backdrop-blur-md border-b border-primary/5 dark:border-white/5 flex items-center justify-between px-4 md:px-8 sticky top-0 z-[100]">
                    <button className="lg:hidden p-2 -ml-2" onClick={toggleSidebar}>
                        <Menu className="h-6 w-6" />
                    </button>

                    <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">MaDis Solaris Interface</p>
                    </div>

                    <div className="ml-auto flex items-center space-x-2 md:space-x-4">
                        <NotificationCenter />

                        {/* Theme Toggle */}
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2 md:p-2.5 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/10 text-muted-foreground hover:text-primary hover:bg-white dark:hover:bg-white/10 transition-all shadow-sm"
                            title="Changer le thème"
                        >
                            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-4 md:p-8 lg:p-12 bg-transparent dark:bg-black min-h-0">
                    <div className="max-w-[1600px] mx-auto animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div >
    );
}
