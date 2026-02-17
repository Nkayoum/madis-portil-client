import { Outlet } from 'react-router-dom';
import logo from '@/assets/logo.png';

export default function AuthLayout() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40 relative overflow-hidden">
            {/* Subtle background accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/80 via-primary to-primary/80" />

            <div className="relative z-10 w-full max-w-md p-6">
                <div className="bg-card border rounded-2xl shadow-lg p-8">
                    <div className="flex flex-col items-center mb-6">
                        <img src={logo} alt="MaDis Logo" className="h-16 w-auto mb-4" />
                    </div>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
