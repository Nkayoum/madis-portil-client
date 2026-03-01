import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
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
    const { t, i18n } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const navigation = [
        { name: 'Tableau de bord', key: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Biens', key: 'nav.properties', href: '/dashboard/properties', icon: Home, roles: ['ADMIN_MADIS', 'CLIENT'] },
        { name: 'Projets', key: 'nav.projects', href: '/dashboard/projects', icon: Building2, roles: ['ADMIN_MADIS', 'CLIENT'] },
        { name: 'Finance', key: 'nav.finance', href: '/dashboard/finance', icon: Wallet, roles: ['ADMIN_MADIS', 'CLIENT'] },
        { name: 'Documents', key: 'nav.documents', href: '/dashboard/documents', icon: FileText, roles: ['ADMIN_MADIS', 'CLIENT', 'CHEF_CHANTIER'] },
        { name: 'Messagerie', key: 'nav.messaging', href: '/dashboard/tickets', icon: MessageSquare, roles: ['ADMIN_MADIS', 'CLIENT', 'CHEF_CHANTIER'] },
        { name: 'Chantiers', key: 'nav.construction', href: '/dashboard/construction', icon: HardHat, roles: ['ADMIN_MADIS', 'CLIENT', 'CHEF_CHANTIER'] },
        { name: 'Marketplace', key: 'nav.marketplace', href: '/dashboard/marketplace', icon: ShoppingBag, roles: ['ADMIN_MADIS', 'CLIENT'] },
        { name: 'Clients', key: 'nav.clients', href: '/dashboard/users', icon: Users, roles: ['ADMIN_MADIS'] },
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
                    "fixed top-0 left-0 z-50 h-screen w-56 solaris-sidebar transition-transform duration-300 lg:translate-x-0 lg:static flex flex-col shadow-xl lg:shadow-none",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-16 flex items-center px-5 mb-2">
                    <img src={logo} alt="MaDis Logo" className="h-8 w-auto" />
                    <button className="ml-auto lg:hidden" onClick={toggleSidebar}>
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="p-3 space-y-1 flex-1 overflow-y-auto no-scrollbar">
                    {filteredNavigation.map((item) => {
                        const isActive = item.href === '/dashboard'
                            ? location.pathname === '/dashboard'
                            : location.pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "flex items-center px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all duration-300",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02] dark:solaris-neon-blue dark:bg-white/5 dark:text-white"
                                        : "text-muted-foreground hover:bg-white/40 hover:text-foreground dark:hover:bg-white/5"
                                )}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon className={cn("h-4 w-4 mr-2.5", isActive ? "animate-pulse" : "")} />
                                {t(item.key)}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-primary/5">
                    <div className="flex items-center gap-2.5 mb-4 px-2">
                        <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {user?.first_name?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold truncate text-foreground">{user?.first_name} {user?.last_name}</p>
                            <p className="text-[9px] text-muted-foreground uppercase font-medium tracking-widest truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                    >
                        <LogOut className="h-3.5 w-3.5 mr-2.5" />
                        {t('nav.logout')}
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
                        {/* Language Switcher */}
                        <div className="flex bg-white/40 dark:bg-white/5 p-1 rounded-2xl border border-white/50 dark:border-white/10 shadow-sm">
                            <button
                                onClick={() => i18n.changeLanguage('fr')}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-[10px] font-black transition-all",
                                    i18n.language === 'fr' ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                FR
                            </button>
                            <button
                                onClick={() => i18n.changeLanguage('en')}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-[10px] font-black transition-all",
                                    i18n.language === 'en' ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                EN
                            </button>
                        </div>

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
                <main className="flex-1 overflow-auto p-4 md:p-8 lg:p-12 bg-transparent dark:bg-black min-h-0 no-scrollbar [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="max-w-[1600px] mx-auto animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div >
    );
}
