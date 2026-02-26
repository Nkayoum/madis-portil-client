import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    CheckCircle,
    Home,
    Banknote,
    TrendingUp,
    Globe,
    ShieldCheck,
    PieChart,
    Key,
    MapPin,
    LayoutDashboard,
    Zap,
    Users
} from 'lucide-react';

export default function LandingPage() {
    const floatingIcons = [
        { Icon: Home, top: '15%', left: '10%', delay: 0 },
        { Icon: Key, top: '25%', right: '15%', delay: 1 },
        { Icon: MapPin, bottom: '20%', left: '15%', delay: 2 },
        { Icon: TrendingUp, bottom: '25%', right: '12%', delay: 3 },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden transition-colors duration-500">
            {/* Hero Section */}
            <section className="relative pt-32 pb-40 overflow-hidden">
                {/* Solaris Background Accents */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 dark:bg-primary/10 blur-[120px] rounded-full pointer-events-none transition-all" />
                <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-primary/5 dark:bg-primary/10 blur-[100px] rounded-full pointer-events-none transition-all" />

                {/* Floating Icons - Solaris Glass */}
                {floatingIcons.map(({ Icon, top, left, right, bottom, delay }, i) => (
                    <motion.div
                        key={i}
                        className="absolute hidden lg:block p-5 rounded-[1.5rem] solaris-glass border border-white/40 dark:border-white/5 shadow-2xl z-10"
                        style={{ top, left, right, bottom }}
                        animate={{
                            y: [0, -20, 0],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            delay,
                            ease: "easeInOut"
                        }}
                    >
                        <Icon className="h-6 w-6 text-primary" />
                    </motion.div>
                ))}

                <div className="container px-6 mx-auto text-center relative z-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-foreground/5 backdrop-blur-md border border-foreground/10 text-[10px] font-black tracking-[0.2em] text-primary mb-12 uppercase"
                    >
                        <Zap className="h-3 w-3 fill-primary" />
                        L'IMMOBILIER 3.0 PROPULSÉ PAR MADIS
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl md:text-6xl font-black tracking-tighter mb-10 leading-[0.9] uppercase"
                    >
                        Votre Patrimoine,<br />
                        Maximisé par <span className="text-primary">MaDis.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-tight mb-16 font-medium tracking-tight"
                    >
                        Nos outils digitaux et nos experts métiers vous donnent le pouvoir <br className="hidden md:block" />
                        de piloter vos actifs avec une précision absolue.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                    >
                        <Link
                            to="/contact"
                            className="w-full sm:w-auto h-16 px-12 rounded-2xl bg-black text-white dark:bg-white dark:text-black text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:opacity-90 shadow-2xl flex items-center justify-center gap-3 active:scale-95"
                        >
                            Démarrer maintenant
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <button className="w-full sm:w-auto h-16 px-12 rounded-2xl bg-white/10 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black/5 dark:hover:bg-white/10 transition-all flex items-center justify-center">
                            Voir la démo
                        </button>
                    </motion.div>

                    {/* Mock Dashboard Preview - Solaris Glass */}
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="mt-32 relative max-w-6xl mx-auto"
                    >
                        <div className="relative rounded-[3rem] overflow-hidden solaris-glass border border-white/60 dark:border-white/5 shadow-2xl">
                            <div className="bg-foreground/5 p-5 border-b border-foreground/5 flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                <div className="w-3 h-3 rounded-full bg-green-400" />
                            </div>
                            <div className="p-10 md:p-16 grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
                                {/* Dashboard Card 1 */}
                                <div className="solaris-glass rounded-[2rem] p-8 border border-white/40 dark:border-white/5 shadow-xl space-y-6 text-left">
                                    <div className="flex justify-between items-center">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                            <Banknote className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="h-8 w-24 rounded-xl bg-black/5 animate-pulse" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Solde Total</div>
                                        <div className="text-3xl font-black tracking-tighter">€1,452,037</div>
                                    </div>
                                    <div className="h-14 w-full bg-white/40 rounded-xl border-b-4 border-primary/20" />
                                </div>

                                {/* Dashboard Card 2 - Center (Focus) */}
                                <div className="md:col-span-1 solaris-glass rounded-[2.5rem] p-10 border border-primary/20 dark:border-primary/40 shadow-2xl space-y-8 md:scale-110 z-10 text-left bg-background/60">
                                    <div className="flex items-center gap-4">
                                        <LayoutDashboard className="h-6 w-6 text-primary" />
                                        <div className="text-[11px] font-black uppercase tracking-[0.2em]">Vue d'ensemble</div>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { label: "Projets", val: "12", color: "bg-primary" },
                                            { label: "Alertes", val: "02", color: "bg-yellow-500" },
                                            { label: "Revenu", val: "+€4.2k", color: "bg-green-500" }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-foreground/5 border border-foreground/5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                                                </div>
                                                <span className="text-sm font-bold">{item.val}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="w-full h-14 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:opacity-90 transition-opacity">
                                        Gérer mes projets
                                    </button>
                                </div>

                                {/* Dashboard Card 3 */}
                                <div className="solaris-glass rounded-[2rem] p-8 border border-white/40 dark:border-white/5 shadow-xl space-y-6 text-left">
                                    <div className="h-12 w-12 rounded-2xl bg-zinc-100 flex items-center justify-center uppercase font-black text-[10px]">
                                        ROI
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">ANALYSE RENDEMENT</div>
                                        <div className="text-3xl font-black tracking-tighter text-black">+12.4%</div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="h-10 flex-1 rounded-xl bg-black/5" />
                                        <div className="h-10 flex-1 rounded-xl bg-black/5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats / Digital Economy Section */}
            <section id="about" className="py-40 bg-background relative transition-colors">
                <div className="container px-6 mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-24">
                        <div className="lg:w-1/2 space-y-10">
                            <span className="text-primary font-black tracking-[0.3em] text-[10px] uppercase block">Analystes Privés</span>
                            <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-[0.95] uppercase">
                                Déverrouillez la<br />
                                <span className="text-primary">Nouvelle Économie</span><br />
                                Immobilière.
                            </h2>
                            <p className="text-xl text-muted-foreground leading-tight tracking-tight font-medium">
                                Nous avons conçu MaDis pour rendre la gestion complexe accessible à tous. Plus qu'un simple gestionnaire, nous sommes votre partenaire technologique dans l'univers de l'Immobilier 3.0.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 pt-10">
                                {[
                                    { val: "1.5M+", label: "Actifs gérés" },
                                    { val: "€18B+", label: "Volume de projet" },
                                    { val: "99.9%", label: "Taux de succès" }
                                ].map((stat, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="text-4xl font-black tracking-tighter">{stat.val}</div>
                                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:w-1/2 relative">
                            {/* Premium Card Layout */}
                            <div className="relative w-full max-w-md mx-auto aspect-[1.6/1] bg-foreground rounded-[3rem] p-10 text-background shadow-2xl rotate-[-5deg] hover:rotate-0 transition-transform duration-700">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-transparent opacity-50 rounded-[3rem]" />
                                <div className="relative z-10 flex justify-between items-start mb-16">
                                    <ShieldCheck className="h-12 w-12 text-primary" />
                                    <div className="font-black text-2xl tracking-[0.2em] uppercase opacity-40">MaDis</div>
                                </div>
                                <div className="relative z-10 space-y-3">
                                    <div className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-black">Statut du Portefeuille</div>
                                    <div className="text-5xl font-black tracking-tighter">€2,328.50</div>
                                </div>
                                <div className="absolute bottom-10 right-10 flex gap-2">
                                    <div className="w-14 h-14 rounded-full border-2 border-background/10" />
                                    <div className="w-14 h-14 rounded-full border-2 border-background/10 -ml-8 bg-background/5 backdrop-blur-md" />
                                </div>
                            </div>
                            {/* Floating Overlay Card */}
                            <div className="absolute -bottom-10 -right-4 w-72 solaris-glass rounded-[2rem] border border-white/40 dark:border-white/5 shadow-2xl p-8 hidden md:block">
                                <div className="h-3 w-16 bg-primary rounded-full mb-6" />
                                <div className="space-y-3">
                                    <div className="h-5 w-full bg-black/5 rounded-lg" />
                                    <div className="h-5 w-2/3 bg-black/5 rounded-lg" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div >
            </section >

            {/* Investment Opportunities Section */}
            < section id="investment" className="py-40 bg-[#020817] text-white relative overflow-hidden" >
                <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary rounded-full blur-[150px]" />
                </div>

                <div className="container px-6 mx-auto text-center relative z-10">
                    <span className="text-primary font-black tracking-[0.3em] text-[10px] uppercase block mb-8">Opportunités 3.0</span>
                    <h2 className="text-5xl md:text-7xl font-black mb-24 tracking-tighter uppercase leading-[0.9]">Investissement <br /> Immobilier <span className="text-primary italic">3.0</span> </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            {
                                title: "Tokenisation d'Actifs",
                                desc: "Accédez à l'investissement fractionné et diversifiez votre portefeuille sur des actifs de prestige dès 1000€.",
                                icon: Globe,
                                bg: "bg-white/[0.03]"
                            },
                            {
                                title: "Optimisation de Rendement",
                                desc: "Nos algorithmes identifient les zones à fort potentiel pour maximiser vos revenus locatifs nets.",
                                icon: TrendingUp,
                                bg: "bg-primary/5"
                            },
                            {
                                title: "Gestion de Patrimoine",
                                desc: "Un accompagnement sur-mesure pour structurer vos actifs et optimiser votre fiscalité immobilière.",
                                icon: Banknote,
                                bg: "bg-white/[0.03]"
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`p-12 rounded-[3rem] ${item.bg} border border-white/5 text-left hover:scale-[1.02] transition-all group`}
                            >
                                <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center mb-10 group-hover:border-primary/50 transition-colors">
                                    <item.icon className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-2xl font-black tracking-tighter mb-6 uppercase">{item.title}</h3>
                                <p className="text-white/40 leading-relaxed font-medium tracking-tight text-lg">
                                    {item.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section >

            {/* Community Section */}
            < section id="community" className="py-40 bg-background relative overflow-hidden transition-colors" >
                <div className="container px-6 mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-24">
                        <div className="lg:w-1/2 relative">
                            {/* Decorative Network Grid */}
                            <div className="grid grid-cols-3 gap-6 rotate-3">
                                {[...Array(9)].map((_, i) => (
                                    <div key={i} className="aspect-square rounded-[2rem] solaris-glass border border-white/40 dark:border-white/5 shadow-xl flex items-center justify-center p-6 grayscale hover:grayscale-0 transition-all cursor-pointer">
                                        <div className={`w-full h-full rounded-full ${i % 2 === 0 ? 'bg-primary/10' : 'bg-black/5'} flex items-center justify-center`}>
                                            <Users className={`h-1/2 w-1/2 ${i % 2 === 0 ? 'text-primary' : 'text-zinc-400'}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
                        </div>

                        <div className="lg:w-1/2 space-y-10">
                            <span className="text-primary font-black tracking-[0.3em] text-[10px] uppercase block">Réseau Exclusif</span>
                            <h2 className="text-5xl md:text-6xl font-black leading-[0.95] tracking-tighter uppercase">
                                Rejoignez plus de <span className="text-primary">1,500</span> <br />
                                Membres Passionnés.
                            </h2>
                            <p className="text-xl text-muted-foreground leading-tight tracking-tight font-medium">
                                Devenez membre d'un écosystème dynamique où experts, propriétaires et investisseurs partagent leurs retours d'expérience et collaborent sur des projets d'envergure.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                {[
                                    "Workshops hebdomadaires",
                                    "Network d'experts",
                                    "Avant-premières"
                                ].map((tag) => (
                                    <div key={tag} className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-foreground/5 bg-foreground/5 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest transition-all">
                                        <CheckCircle className="h-3.5 w-3.5 text-primary" />
                                        {tag}
                                    </div>
                                ))}
                            </div>
                            <button className="h-16 px-12 rounded-2xl bg-black text-white dark:bg-white dark:text-black text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:opacity-90 transition-all active:scale-95">
                                Rejoindre le Hub
                            </button>
                        </div>
                    </div>
                </div>
            </section >

            {/* Testimonials */}
            < section className="py-40 bg-background/50 overflow-hidden transition-colors" >
                <div className="container px-6 mx-auto text-center">
                    <span className="text-primary font-black tracking-[0.3em] text-[10px] uppercase block mb-6">Protocole de Satisfaction</span>
                    <h2 className="text-5xl md:text-6xl font-black mb-24 tracking-tighter uppercase">Ils nous font <span className="text-primary">confiance</span>.</h2>

                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="solaris-glass border border-white/60 dark:border-white/5 rounded-[4rem] p-12 md:p-24 shadow-2xl relative bg-background/80"
                        >
                            <div className="text-primary text-8xl font-black leading-none mb-10 opacity-20 select-none">“</div>
                            <p className="text-xl md:text-2xl font-black tracking-tighter leading-tight mb-16 uppercase">
                                "MaDis a totalement changé ma vision de l'investissement. <br />
                                La plateforme est d'une intuitivité rare et le suivi technique <br />
                                est irréprochable. Un must-have pour tout propriétaire."
                            </p>
                            <div className="flex items-center justify-center gap-6">
                                <div className="w-20 h-20 rounded-full bg-zinc-200 border-4 border-white shadow-xl overflow-hidden">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                                </div>
                                <div className="text-left">
                                    <div className="font-black text-2xl tracking-tighter uppercase">Marc D.</div>
                                    <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Investisseur Privé</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section >

            {/* Final CTA */}
            < section className="py-40" >
                <div className="container px-6 mx-auto">
                    <div className="relative rounded-[4rem] bg-black overflow-hidden p-16 md:p-32 text-center text-white group shadow-2xl">
                        {/* Background Solaris Gradients */}
                        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[100%] bg-primary rounded-full blur-[150px] opacity-20 group-hover:scale-125 transition-transform duration-1000" />
                        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[100%] bg-primary rounded-full blur-[150px] opacity-20 group-hover:scale-125 transition-transform duration-1000" />

                        <div className="relative z-10 max-w-4xl mx-auto space-y-12">
                            <h2 className="text-5xl md:text-8xl font-black leading-[0.9] tracking-tighter uppercase">Prêt à commencer <br /> <span className="text-primary italic">l'aventure</span> ?</h2>
                            <p className="text-xl md:text-2xl font-medium text-white/40 leading-tight tracking-tight">
                                Rejoignez plus de 1,500 propriétaires qui pilotent déjà <br /> leur patrimoine sur MaDis. Inscription gratuite.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center pt-8">
                                <Link to="/contact" className="w-full sm:w-auto h-20 px-14 rounded-3xl bg-white text-black font-black text-[12px] uppercase tracking-[0.2em] hover:scale-105 transition-transform shadow-2xl flex items-center justify-center">
                                    Prendre rendez-vous
                                </Link>
                                <Link to="/login" className="w-full sm:w-auto h-20 px-14 rounded-3xl bg-white/10 text-white font-black text-[12px] uppercase tracking-[0.2em] border border-white/20 backdrop-blur-md hover:bg-white/20 transition-all flex items-center justify-center">
                                    Espace Client
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section >
        </div >
    );
}

