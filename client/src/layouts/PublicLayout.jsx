import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Menu as MenuIcon, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';

export default function PublicLayout() {
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const location = useLocation();
    const isHome = location.pathname === '/';

    const navLinks = [
        { label: 'Marché', href: '/marketplace' },
        { label: 'Services', href: isHome ? '#services' : '/#services' },
        { label: 'À propos', href: isHome ? '#about' : '/#about' },
        { label: 'Investissement', href: '/#investment' },
        { label: 'Contact', href: '/contact' },
    ];

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <div className="min-h-[100dvh] flex flex-col bg-background text-foreground transition-colors duration-500">
            {/* Navbar - Solaris Glass - Fixed for stability */}
            <nav className="fixed top-0 left-0 z-50 w-full px-6 py-4">
                <div className="container mx-auto">
                    <div className="solaris-glass rounded-[2rem] border border-white/40 dark:border-white/5 h-16 md:h-20 px-6 md:px-10 flex items-center justify-between shadow-2xl relative">
                        <Link to="/" className="flex items-center gap-2 group">
                            <img src={logo} alt="MaDis Logo" className="h-8 md:h-10 w-auto group-hover:scale-105 transition-transform duration-500" />
                        </Link>

                        <div className="flex items-center gap-6 md:gap-10">
                            {/* Desktop Nav */}
                            <div className="hidden lg:flex gap-8 items-center">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.label}
                                        to={link.href}
                                        className="relative text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors group py-2"
                                    >
                                        {link.label}
                                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-full" />
                                    </Link>
                                ))}
                            </div>

                            <div className="flex items-center gap-4 lg:border-l lg:border-black/5 lg:pl-10 dark:lg:border-white/10">
                                {/* Theme Toggle - Desktop preferred, but kept for mobile too */}
                                <button
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                    className="p-2.5 rounded-xl hover:bg-foreground/5 transition-all text-muted-foreground hover:text-foreground group"
                                    title="Changer de thème"
                                >
                                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                </button>

                                {/* Desktop Auth Button */}
                                <div className="hidden sm:flex">
                                    {user ? (
                                        <Link to="/dashboard" className="h-10 md:h-12 px-6 md:px-8 rounded-2xl bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center shadow-lg active:scale-95">
                                            Mon Espace
                                        </Link>
                                    ) : (
                                        <Link to="/login" className="h-10 md:h-12 px-6 md:px-8 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95">
                                            Connexion
                                        </Link>
                                    )}
                                </div>

                                {/* Mobile Menu Trigger */}
                                <button
                                    onClick={toggleMenu}
                                    className="lg:hidden p-2.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition-all text-foreground"
                                >
                                    {isMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Mobile Menu Overlay */}
                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                    className="absolute top-24 left-0 w-full p-4 lg:hidden"
                                >
                                    <div className="solaris-glass rounded-[2.5rem] border border-white/40 dark:border-white/10 p-8 shadow-2xl flex flex-col gap-6">
                                        {navLinks.map((link, i) => (
                                            <motion.div
                                                key={link.label}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                            >
                                                <Link
                                                    to={link.href}
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className="text-xl font-black uppercase tracking-tighter hover:text-primary transition-colors block"
                                                >
                                                    {link.label}
                                                </Link>
                                            </motion.div>
                                        ))}
                                        <div className="h-px bg-foreground/5 my-2" />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 }}
                                        >
                                            {user ? (
                                                <Link
                                                    to="/dashboard"
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className="w-full h-16 rounded-[1.5rem] bg-black text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center shadow-xl active:scale-95 transition-all"
                                                >
                                                    Mon Espace Personnel
                                                </Link>
                                            ) : (
                                                <Link
                                                    to="/login"
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className="w-full h-16 rounded-[1.5rem] bg-primary text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center shadow-xl shadow-primary/20 active:scale-95 transition-all"
                                                >
                                                    Accéder à mon compte
                                                </Link>
                                            )}
                                        </motion.div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </nav>

            {/* Content - Extra padding top for fixed nav */}
            <main className="flex-1 pt-24 md:pt-32">
                <Outlet />
            </main>

            {/* Footer - Industrial Dark */}
            <footer className="pt-24 pb-12 bg-[#020817] text-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-16 pb-20 border-b border-white/5">
                        <div className="col-span-2 lg:col-span-2 space-y-10">
                            <div className="flex items-center gap-2">
                                <img src={logo} alt="MaDis Logo" className="h-10 w-auto brightness-0 invert opacity-80" />
                            </div>
                            <p className="max-w-xs text-white/40 text-[13px] font-medium leading-relaxed tracking-tight">
                                Votre passerelle vers le futur de l'immobilier, <br />
                                orchestrée par une vision technologique d'excellence.
                            </p>
                            <div className="flex gap-3">
                                {['tw', 'in', 'fb'].map((social) => (
                                    <div key={social} className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-[10px] font-black uppercase text-white/20 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
                                        <span className="group-hover:scale-110 transition-transform">{social}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {[
                            { title: "Société", links: ["Outils", "Fonctions", "Marché", "Portfolio"] },
                            { title: "Marché", links: ["Vendre", "Acheter", "Louer", "Investir"] },
                            { title: "Ressources", links: ["Guide débutant", "Plateforme", "Sécurité", "Blockchain"] }
                        ].map((col, i) => (
                            <div key={i} className="space-y-8">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">{col.title}</h4>
                                <ul className="space-y-5">
                                    {col.links.map((link) => (
                                        <li key={link}>
                                            <Link to="#" className="text-[13px] text-white/60 hover:text-primary transition-all font-bold tracking-tight">{link}</Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex gap-10 text-[9px] font-black text-white/20 tracking-[0.2em]">
                            <Link to="#" className="hover:text-primary transition-colors uppercase">PROPOSITION DE VALEUR</Link>
                            <Link to="#" className="hover:text-primary transition-colors uppercase">POLITIQUE DE CONFIDENTIALITÉ</Link>
                        </div>
                        <p className="text-[9px] font-black text-white/10 tracking-[0.3em] uppercase">
                            &copy; {new Date().getFullYear()} MaDis Gestion Immobilière &bull; Solaris Horizon 2.0
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
