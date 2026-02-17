import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';

export default function PublicLayout() {
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();

    const location = useLocation();
    const isHome = location.pathname === '/';

    const navLinks = [
        { label: 'Marché', href: '/marketplace' },
        { label: 'Services', href: isHome ? '#services' : '/#services' },
        { label: 'À propos', href: isHome ? '#about' : '/#about' },
        { label: 'Investissement', href: '/#investment' },
        { label: 'Contact', href: '/contact' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <img src={logo} alt="MaDis Logo" className="h-10 w-auto group-hover:scale-105 transition-transform" />
                    </Link>

                    <div className="flex items-center gap-8">
                        <div className="hidden lg:flex gap-8 items-center">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    to={link.href}
                                    className="relative text-sm font-medium hover:text-primary transition-colors group py-2"
                                >
                                    {link.label}
                                    <motion.span
                                        className="absolute bottom-0 left-0 w-full h-0.5 bg-primary origin-left"
                                        initial={{ scaleX: 0 }}
                                        whileHover={{ scaleX: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </Link>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 border-l border-white/10 pl-8">
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                                title="Changer de thème"
                            >
                                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </button>

                            {user ? (
                                <Link to="/dashboard" className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all text-sm font-bold">
                                    Mon Espace
                                </Link>
                            ) : (
                                <Link to="/login" className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all text-sm font-bold">
                                    Connexion
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="pt-24 pb-12 bg-slate-950 text-white overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 pb-16 border-b border-white/5">
                        <div className="col-span-2 lg:col-span-2 space-y-8">
                            <div className="flex items-center gap-2">
                                <img src={logo} alt="MaDis Logo" className="h-10 w-auto brightness-0 invert" />
                            </div>
                            <p className="max-w-xs text-white/50 font-medium leading-relaxed">
                                Votre passerelle vers le futur de l'immobilier, <br />
                                propulsée par l'innovation technologique.
                            </p>
                            <div className="flex gap-4">
                                {['tw', 'in', 'fb'].map((social) => (
                                    <div key={social} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black uppercase text-white/20 hover:text-primary hover:border-primary transition-all cursor-pointer">
                                        {social}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {[
                            { title: "Société", links: ["Outils", "Fonctions", "Marché", "Portfolio"] },
                            { title: "Marché", links: ["Vendre", "Acheter", "Louer", "Investir"] },
                            { title: "Ressources", links: ["Guide débutant", "Plateforme", "Sécurité", "Blockchain"] }
                        ].map((col, i) => (
                            <div key={i} className="space-y-6">
                                <h4 className="text-sm font-black uppercase tracking-widest text-white/40">{col.title}</h4>
                                <ul className="space-y-4">
                                    {col.links.map((link) => (
                                        <li key={link}>
                                            <Link to="#" className="text-white/60 hover:text-primary transition-colors font-medium">{link}</Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-white/30 tracking-widest uppercase">
                        <div className="flex gap-8">
                            <Link to="#" className="hover:text-white transition-colors">POLITIQUE DE CONFIDENTIALITÉ</Link>
                            <Link to="#" className="hover:text-white transition-colors">CONDITIONS GÉNÉRALES</Link>
                        </div>
                        <p>&copy; {new Date().getFullYear()} MADIS PORTAL. TOUS DROITS RÉSERVÉS.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
