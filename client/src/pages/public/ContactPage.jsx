import { Mail, MapPin, Phone, Send, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden transition-colors duration-500">
            {/* Solaris Background Accents */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 dark:bg-primary/10 blur-[120px] rounded-full pointer-events-none transition-all" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 dark:bg-primary/10 blur-[120px] rounded-full pointer-events-none transition-all" />

            <div className="container mx-auto px-4 py-12 relative z-10 flex-1 flex flex-col justify-center">
                <Link to="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all mb-12 group">
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Retour à l'accueil
                </Link>

                <div className="max-w-6xl mx-auto w-full">
                    <div className="text-center mb-20 animate-in fade-in slide-in-from-top-4 duration-700">
                        <span className="text-primary font-black tracking-[0.3em] text-[10px] uppercase mb-4 block">Protocole de Contact</span>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-6 uppercase leading-none">
                            Parlons de votre <span className="text-primary">Avenir</span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium tracking-tight">
                            Une question ? Un projet d'envergure ? L'équipe MaDis est à votre disposition pour orchestrer votre succès immobilier.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-5 gap-12 items-start animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        {/* Contact Info - Solaris Glass */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="solaris-glass p-10 rounded-[2.5rem] border border-white/40 dark:border-white/5 shadow-2xl">
                                <h2 className="text-2xl font-black tracking-tighter mb-10 uppercase">Nos Coordonnées</h2>

                                <div className="space-y-10">
                                    <div className="flex items-start gap-6 group">
                                        <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                                            <MapPin className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-[10px] uppercase tracking-widest mb-1.5 opacity-40">Siège Parisien</h3>
                                            <p className="text-sm font-bold leading-relaxed tracking-tight">123 Avenue de l'Immobilier<br />75000 Paris, France</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-6 group">
                                        <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                                            <Mail className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-[10px] uppercase tracking-widest mb-1.5 opacity-40">Communication Digitale</h3>
                                            <p className="text-sm font-bold tracking-tight">contact@madis-portal.com</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-6 group">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-black flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                                            <Phone className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-[10px] uppercase tracking-widest mb-1.5 opacity-40">Ligne Directe</h3>
                                            <p className="text-sm font-bold tracking-tight">+33 1 23 45 67 89</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form - Solaris Glass */}
                        <div className="lg:col-span-3 solaris-glass p-10 md:p-12 rounded-[2.5rem] border border-white/40 dark:border-white/5 shadow-2xl">
                            <h2 className="text-2xl font-black tracking-tighter mb-8 uppercase">Envoyez-nous un message</h2>
                            <form className="space-y-8">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Nom complet</label>
                                        <input
                                            type="text"
                                            className="w-full h-14 bg-foreground/5 border border-foreground/10 dark:border-white/5 rounded-2xl px-6 text-sm font-bold tracking-tight transition-all focus:bg-foreground/10 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none placeholder:text-muted-foreground/30 placeholder:uppercase"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Email Corporation</label>
                                        <input
                                            type="email"
                                            className="w-full h-14 bg-foreground/5 border border-foreground/10 dark:border-white/5 rounded-2xl px-6 text-sm font-bold tracking-tight transition-all focus:bg-foreground/10 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none placeholder:text-muted-foreground/30 placeholder:uppercase"
                                            placeholder="doe@company.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Votre Message</label>
                                    <textarea
                                        className="w-full min-h-[160px] bg-foreground/5 border border-foreground/10 dark:border-white/5 rounded-[1.5rem] p-6 text-sm font-bold tracking-tight transition-all focus:bg-foreground/10 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none placeholder:text-muted-foreground/30 placeholder:uppercase resize-none"
                                        placeholder="Décrivez votre projet ou votre demande..."
                                    ></textarea>
                                </div>
                                <button className="w-full h-14 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-zinc-800 shadow-2xl flex items-center justify-center gap-3 active:scale-95">
                                    <Send className="h-4 w-4" />
                                    Expédier le Message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <div className="py-12 text-center relative z-10 border-t border-foreground/5 bg-background/50 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-40">
                    &copy; {new Date().getFullYear()} MaDis Gestion Immobilière &bull; Solaris Horizon 2.0
                </p>
            </div>
        </div>
    );
}
