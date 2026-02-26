import { Outlet } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function AuthLayout() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-6 transition-colors duration-500">
            {/* Solaris Background Accents */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 dark:bg-primary/10 blur-[120px] rounded-full pointer-events-none transition-all" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 dark:bg-primary/10 blur-[120px] rounded-full pointer-events-none transition-all" />

            <div className="relative z-10 w-full max-w-lg">
                <div className="solaris-glass rounded-[2.5rem] md:rounded-[3rem] border border-white/40 dark:border-white/5 shadow-2xl p-8 md:p-16 animate-in fade-in zoom-in-95 duration-700">
                    <div className="flex flex-col items-center mb-8 md:mb-12">
                        <div className="h-16 md:h-20 w-auto mb-6 md:mb-8 transition-transform hover:scale-105 duration-500">
                            <img src={logo} alt="MaDis Logo" className="h-full w-auto object-contain" />
                        </div>
                        <div className="h-px w-10 md:w-12 bg-black/10 dark:bg-white/10" />
                    </div>
                    <Outlet />
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-40">
                        &copy; {new Date().getFullYear()} MaDis Gestion Immobilière &bull; Solaris Horizon 2.0
                    </p>
                </div>
            </div>
        </div>
    );
}
