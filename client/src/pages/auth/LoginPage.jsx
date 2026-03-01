import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

export default function LoginPage() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const fillDemo = (demoEmail) => {
        setEmail(demoEmail);
        setPassword('password123'); // Assuming standard demo password
    };

    const from = location.state?.from?.pathname || '/dashboard';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (result.success) {
            navigate(from, { replace: true });
        } else {
            setError(result.error || t('auth.login_error'));
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="text-center mb-10 md:mb-12">
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-3 md:mb-4 uppercase">{t('auth.title')}</h2>
                <p className="text-muted-foreground font-medium text-[12px] md:text-sm tracking-tight opacity-70 uppercase">
                    {t('auth.subtitle')}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                    <div className="p-5 rounded-2xl bg-rose-500/10 text-rose-600 text-[11px] font-black uppercase tracking-wider border border-rose-200/20 flex items-center gap-4 animate-shake">
                        <div className="h-2 w-2 rounded-full bg-rose-500 shrink-0 shadow-sm shadow-rose-500/50" />
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                            {t('auth.email_label')}
                        </label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <input
                                type="email"
                                required
                                className="w-full h-14 bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/5 rounded-2xl pl-12 pr-4 text-sm font-bold tracking-tight transition-all focus:bg-foreground/10 dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none placeholder:text-muted-foreground/40 placeholder:uppercase placeholder:text-[9px] placeholder:font-black placeholder:tracking-widest"
                                placeholder={t('auth.email_placeholder')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                            {t('auth.pwd_label')}
                        </label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <input
                                type="password"
                                required
                                className="w-full h-14 bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/5 rounded-2xl pl-12 pr-4 text-sm font-bold tracking-tight transition-all focus:bg-foreground/10 dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none placeholder:text-muted-foreground/40 placeholder:uppercase"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl flex items-center justify-center gap-3 active:scale-95"
                >
                    {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <>
                            {t('auth.btn_login')}
                            <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-12 pt-8 border-t border-foreground/5 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-8">
                    {t('auth.new_partner')} <a href="/contact" className="text-primary hover:underline transition-all">{t('auth.contact_us')}</a>
                </p>

                <div className="bg-foreground/5 rounded-3xl p-6 border border-foreground/5 flex flex-col gap-4">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-1">{t('auth.demo_title')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button
                            type="button"
                            onClick={() => fillDemo('admin@madis.com')}
                            className="text-left p-4 rounded-xl bg-background/50 border border-foreground/10 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                        >
                            <p className="text-[9px] font-black text-primary uppercase tracking-tighter mb-1 transition-transform group-hover:translate-x-1">{t('auth.demo_admin')}</p>
                            <p className="text-[10px] font-bold text-muted-foreground truncate">admin@madis.com</p>
                        </button>
                        <button
                            type="button"
                            onClick={() => fillDemo('ivanmpondo9@gmail.com')}
                            className="text-left p-4 rounded-xl bg-background/50 border border-foreground/10 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                        >
                            <p className="text-[9px] font-black text-primary uppercase tracking-tighter mb-1 transition-transform group-hover:translate-x-1">{t('auth.demo_client')}</p>
                            <p className="text-[10px] font-bold text-muted-foreground truncate">ivanmpondo9@gmail.com</p>
                        </button>
                        <button
                            type="button"
                            onClick={() => fillDemo('osg@test.fr')}
                            className="text-left p-4 rounded-xl bg-background/50 border border-foreground/10 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                        >
                            <p className="text-[9px] font-black text-primary uppercase tracking-tighter mb-1 transition-transform group-hover:translate-x-1">{t('auth.demo_chef')}</p>
                            <p className="text-[10px] font-bold text-muted-foreground truncate">osg@test.fr</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
