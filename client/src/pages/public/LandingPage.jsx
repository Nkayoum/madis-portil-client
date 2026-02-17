import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    CheckCircle,
    Home,
    Building,
    Banknote,
    HardHat,
    TrendingUp,
    Globe,
    ShieldCheck,
    BarChart3,
    PieChart,
    Key,
    MapPin,
    LayoutDashboard,
    Zap,
    Users
} from 'lucide-react';
import logo from '@/assets/logo.png';

export default function LandingPage() {
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const floatingIcons = [
        { Icon: Home, top: '15%', left: '10%', delay: 0 },
        { Icon: Key, top: '25%', right: '15%', delay: 1 },
        { Icon: MapPin, bottom: '20%', left: '15%', delay: 2 },
        { Icon: TrendingUp, bottom: '25%', right: '12%', delay: 3 },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Navbar handled by PublicLayout */}

            {/* Hero Section */}
            <section className="relative pt-24 pb-32 overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-accent/10 rounded-full blur-[100px]" />
                </div>

                {/* Floating Icons for Tech/Premium look */}
                {floatingIcons.map(({ Icon, top, left, right, bottom, delay }, i) => (
                    <motion.div
                        key={i}
                        className="absolute hidden lg:block p-4 rounded-2xl bg-card border shadow-xl z-10"
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

                <div className="container px-4 mx-auto text-center relative z-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-xs font-semibold text-primary mb-8 border border-primary/20"
                    >
                        <Zap className="h-3 w-3 fill-primary" />
                        L'IMMOBILIER 3.0 PROPULSÉ PAR MADIS
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]"
                    >
                        Votre Patrimoine,<br />
                        Maximisé par <span className="text-primary italic">MaDis.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg md:text-xl text-muted-foreground/80 mb-12 max-w-2xl mx-auto leading-relaxed"
                    >
                        Nos outils digitaux et nos experts métiers vous donnent le pouvoir <br className="hidden md:block" />
                        de piloter vos actifs avec une précision absolue.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        <Link
                            to="/contact"
                            className="w-full sm:w-auto inline-flex items-center justify-center rounded-full text-base font-bold bg-primary text-primary-foreground shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:-translate-y-1 h-14 px-10"
                        >
                            Démarrer maintenant
                        </Link>
                        <button className="w-full sm:w-auto text-base font-semibold hover:text-primary transition-colors underline-offset-4 hover:underline">
                            Voir la démo
                        </button>
                    </motion.div>

                    {/* Mock Dashboard Preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="mt-20 relative max-w-5xl mx-auto"
                    >
                        <div className="relative rounded-3xl overflow-hidden border bg-card shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(255,0,72,0.05)]">
                            <div className="bg-muted/30 p-4 border-b flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                <div className="w-3 h-3 rounded-full bg-green-400" />
                            </div>
                            <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Dashboard Card 1 */}
                                <div className="bg-background rounded-2xl p-6 border shadow-sm space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Banknote className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="h-8 w-20 rounded-lg bg-muted animate-pulse" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Solde Total</div>
                                        <div className="text-2xl font-black">€1,452,037</div>
                                    </div>
                                    <div className="h-12 w-full bg-primary/5 rounded-lg border-b-2 border-primary/20" />
                                </div>

                                {/* Dashboard Card 2 - Center (Focus) */}
                                <div className="md:col-span-1 bg-background rounded-2xl p-6 border-2 border-primary/20 shadow-xl space-y-6 scale-105 z-10">
                                    <div className="flex items-center gap-3">
                                        <LayoutDashboard className="h-5 w-5 text-primary" />
                                        <div className="font-bold">Vue d'ensemble</div>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { label: "Projets", val: "12", color: "bg-primary" },
                                            { label: "Alertes", val: "02", color: "bg-yellow-500" },
                                            { label: "Revenu", val: "+€4.2k", color: "bg-green-500" }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                                    <span className="text-sm font-medium">{item.label}</span>
                                                </div>
                                                <span className="font-bold">{item.val}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
                                        Gérer mes projets
                                    </button>
                                </div>

                                {/* Dashboard Card 3 */}
                                <div className="bg-background rounded-2xl p-6 border shadow-sm space-y-4 text-left">
                                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                                        <PieChart className="h-5 w-5 text-accent-foreground" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-muted-foreground font-bold">RETOUR SUR INVESTISSEMENT</div>
                                        <div className="text-2xl font-black text-accent-foreground">+12.4%</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-8 flex-1 rounded-lg bg-muted/50" />
                                        <div className="h-8 flex-1 rounded-lg bg-muted/50" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats / Digital Economy Section */}
            <section id="about" className="py-24 bg-background">
                <div className="container px-4 mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2 space-y-8">
                            <div className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-xs font-bold text-accent-foreground border border-accent/20">
                                ANALYSTES
                            </div>
                            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
                                Déverrouillez la<br />
                                Nouvelle Économie Immobilière.
                            </h2>
                            <p className="text-lg text-muted-foreground/80 leading-relaxed">
                                Nous avons conçu MaDis pour rendre la gestion complexe accessible à tous. Plus qu'un simple gestionnaire, nous sommes votre partenaire technologique dans l'univers de l'Immobilier 3.0.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-6">
                                {[
                                    { val: "1.5M+", label: "Actifs gérés" },
                                    { val: "€18B+", label: "Volume de projet" },
                                    { val: "99.9%", label: "Taux de succès" }
                                ].map((stat, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="text-3xl font-black text-primary">{stat.val}</div>
                                        <div className="text-xs font-bold text-muted-foreground uppercase">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:w-1/2 relative">
                            {/* Card mock from mockup */}
                            <div className="relative w-full max-w-md mx-auto aspect-[1.6/1] bg-gradient-to-br from-primary to-primary/80 rounded-[2.5rem] p-8 text-primary-foreground shadow-2xl rotate-[-5deg] hover:rotate-0 transition-transform duration-500">
                                <div className="flex justify-between items-start mb-12">
                                    <ShieldCheck className="h-10 w-10 opacity-80" />
                                    <div className="font-black text-2xl tracking-widest italic opacity-60">MaDis</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-xs uppercase opacity-60 font-medium">Statut du Portefeuille</div>
                                    <div className="text-4xl font-black tracking-tight">€2,328.50</div>
                                </div>
                                <div className="absolute bottom-8 right-8 flex gap-1">
                                    <div className="w-12 h-12 rounded-full border-2 border-white/20" />
                                    <div className="w-12 h-12 rounded-full border-2 border-white/20 -ml-6 bg-white/10" />
                                </div>
                            </div>
                            {/* Smaller overlapping card */}
                            <div className="absolute -bottom-10 -right-10 w-64 aspect-[1.6/1] bg-card border shadow-2xl rounded-2xl p-6 hidden md:block">
                                <div className="h-2 w-12 bg-primary rounded-full mb-4" />
                                <div className="space-y-2">
                                    <div className="h-4 w-full bg-muted rounded" />
                                    <div className="h-4 w-2/3 bg-muted rounded" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* Investment Opportunities Section */}
            <section id="investment" className="py-32 bg-slate-950 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
                    <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-primary rounded-full blur-[120px]" />
                </div>

                <div className="container px-4 mx-auto text-center relative z-10">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-xs font-bold text-primary mb-8 border border-white/10">
                        OPPORTUNITÉS
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black mb-16">Investissement Immobilier 3.0</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Tokenisation d'Actifs",
                                desc: "Accédez à l'investissement fractionné et diversifiez votre portefeuille sur des actifs de prestige dès 1000€.",
                                icon: Globe,
                                color: "border-primary/30"
                            },
                            {
                                title: "Optimisation de Rendement",
                                desc: "Nos algorithmes identifient les zones à fort potentiel pour maximiser vos revenus locatifs nets.",
                                icon: TrendingUp,
                                color: "border-accent/30"
                            },
                            {
                                title: "Gestion de Patrimoine",
                                desc: "Un accompagnement sur-mesure pour structurer vos actifs et optimiser votre fiscalité immobilière.",
                                icon: Banknote,
                                color: "border-white/10"
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`p-10 rounded-[2.5rem] bg-white/5 border ${item.color} text-left hover:scale-[1.02] transition-all`}
                            >
                                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-8">
                                    <item.icon className="h-7 w-7 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                                <p className="text-white/60 leading-relaxed font-medium">
                                    {item.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Community Section */}
            <section id="community" className="py-32 bg-background relative overflow-hidden">
                <div className="container px-4 mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-20">
                        <div className="lg:w-1/2 relative">
                            {/* Decorative network grid */}
                            <div className="grid grid-cols-3 gap-4 rotate-3 opacity-80">
                                {[...Array(9)].map((_, i) => (
                                    <div key={i} className="aspect-square rounded-2xl bg-muted/30 border border-muted flex items-center justify-center p-4">
                                        <div className={`w-full h-full rounded-full ${i % 2 === 0 ? 'bg-primary/20' : 'bg-accent/20'} flex items-center justify-center`}>
                                            <Users className={`h-1/2 w-1/2 ${i % 2 === 0 ? 'text-primary' : 'text-accent-foreground'}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                        </div>

                        <div className="lg:w-1/2 space-y-8">
                            <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-xs font-bold text-primary border border-primary/20">
                                RÉSEAU EXCLUSIF
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black leading-tight">
                                Rejoignez plus de 1,500 <br />
                                Membres Passionnés.
                            </h2>
                            <p className="text-lg text-muted-foreground/80 leading-relaxed">
                                Devenez membre d'un écosystème dynamique où experts, propriétaires et investisseurs partagent leurs retours d'expérience et collaborent sur des projets d'envergure. MaDis n'est pas qu'une plateforme, c'est un club d'excellence.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                {[
                                    "Workshops hebdomadaires",
                                    "Network d'experts",
                                    "Avant-premières"
                                ].map((tag) => (
                                    <div key={tag} className="flex items-center gap-2 px-4 py-2 rounded-full border bg-muted/20 text-sm font-bold">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        {tag}
                                    </div>
                                ))}
                            </div>
                            <button className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-black hover:shadow-lg transition-all">
                                Rejoindre le Hub
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 bg-slate-50 dark:bg-slate-900 overflow-hidden">
                <div className="container px-4 mx-auto text-center">
                    <div className="text-primary font-bold text-sm mb-4">TÉMOIGNAGES</div>
                    <h2 className="text-4xl md:text-5xl font-black mb-16">Ils nous font confiance.</h2>

                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="bg-card border rounded-[3rem] p-10 md:p-16 shadow-xl relative"
                        >
                            <div className="text-primary text-6xl font-black leading-none mb-8 opacity-20">“</div>
                            <p className="text-xl md:text-2xl font-bold leading-relaxed mb-12">
                                "MaDis a totalement changé ma vision de l'investissement. <br />
                                La plateforme est d'une intuitivité rare et le suivi technique <br />
                                est irréprochable. Un must-have pour tout propriétaire."
                            </p>
                            <div className="flex items-center justify-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-muted overflow-hidden">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                                </div>
                                <div className="text-left">
                                    <div className="font-black text-lg">Marc D.</div>
                                    <div className="text-sm text-muted-foreground font-bold">Investisseur Privé</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24">
                <div className="container px-4 mx-auto">
                    <div className="relative rounded-[3rem] bg-primary overflow-hidden p-12 md:p-24 text-center text-primary-foreground group">
                        {/* Interactive BG elements */}
                        <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[80%] bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[80%] bg-black/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />

                        <div className="relative z-10 max-w-3xl mx-auto space-y-10">
                            <h2 className="text-4xl md:text-6xl font-black leading-tight">Prêt à commencer <br /> l'aventure ?</h2>
                            <p className="text-lg md:text-xl font-medium text-white/80">
                                Rejoignez plus de 1,500 propriétaires qui pilotent déjà <br /> leur patrimoine sur MaDis. Inscription gratuite.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                                <Link to="/contact" className="w-full sm:w-auto px-10 py-5 rounded-full bg-white text-primary font-black text-lg hover:scale-105 transition-transform shadow-xl">
                                    Prendre rendez-vous
                                </Link>
                                <Link to="/login" className="w-full sm:w-auto px-10 py-5 rounded-full bg-white/20 text-white font-black text-lg border border-white/20 backdrop-blur-md hover:bg-white/30 transition-all">
                                    Espace Client
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div >
    );
}

