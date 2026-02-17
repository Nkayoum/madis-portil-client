import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
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
import { cn } from '@/lib/utils';
import NotificationCenter from '@/components/dashboard/NotificationCenter';

import logo from '@/assets/logo.png';

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const navigation = [
        { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Biens', href: '/dashboard/properties', icon: Home },
        { name: 'Projets', href: '/dashboard/projects', icon: Building2 },
        { name: 'Finance', href: '/dashboard/finance', icon: Wallet },
        { name: 'Documents', href: '/dashboard/documents', icon: FileText },
        { name: 'Messagerie', href: '/dashboard/tickets', icon: MessageSquare },
        { name: 'Chantiers', href: '/dashboard/construction', icon: HardHat },
        { name: 'Marketplace', href: '/dashboard/marketplace', icon: ShoppingBag },
    ];

    if (user?.role === 'ADMIN_MADIS') {
        navigation.push({ name: 'Clients', href: '/dashboard/users', icon: Users });
    }

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="min-h-screen bg-background flex">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border transition-transform duration-300 lg:translate-x-0 lg:static flex flex-col",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-16 flex items-center px-6 border-b border-border">
                    <img src={logo} alt="MaDis Logo" className="h-10 w-auto" />
                    <button className="ml-auto lg:hidden" onClick={toggleSidebar}>
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon className="h-5 w-5 mr-3" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-border bg-card">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold">
                            {user?.first_name?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    >
                        <LogOut className="h-5 w-5 mr-3" />
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
                    <button className="lg:hidden p-2 -ml-2" onClick={toggleSidebar}>
                        <Menu className="h-6 w-6" />
                    </button>

                    <div className="ml-auto flex items-center space-x-2">
                        <NotificationCenter />

                        {/* Theme Toggle */}
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
                            title="Changer le thème"
                        >
                            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6 bg-muted/10 min-h-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
