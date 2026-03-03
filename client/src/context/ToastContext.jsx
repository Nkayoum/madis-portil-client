import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
/* eslint-disable no-unused-vars */
import { AnimatePresence, motion } from 'framer-motion';
/* eslint-enable no-unused-vars */

const ToastContext = createContext(null);

/* eslint-disable react-refresh/only-export-components */
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(({ message, type = 'info', duration = 3000 }) => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type }]);

        if (duration) {
            setTimeout(() => {
                dismissToast(id);
            }, duration);
        }
    }, [dismissToast]);

    return (
        <ToastContext.Provider value={{ showToast, dismissToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <Toast key={toast.id} {...toast} onClose={() => dismissToast(toast.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

const Toast = ({ message, type, onClose }) => {
    const icons = {
        success: <CheckCircle className="h-5 w-5 text-green-500" />,
        error: <AlertCircle className="h-5 w-5 text-red-500" />,
        warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
        info: <Info className="h-5 w-5 text-primary" />
    };

    const bgColors = {
        success: 'bg-card border-green-500/20',
        error: 'bg-card border-red-500/20',
        warning: 'bg-card border-yellow-500/20',
        info: 'bg-card border-primary/20'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            layout
            className={`pointer-events-auto flex items-center w-full max-w-sm p-4 rounded-lg shadow-lg border ${bgColors[type]} bg-opacity-95 backdrop-blur-sm`}
        >
            <div className="flex-shrink-0 mr-3">
                {icons[type]}
            </div>
            <div className="flex-1 text-sm font-medium text-foreground">
                {message}
            </div>
            <button onClick={onClose} className="ml-3 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
            </button>
        </motion.div>
    );
};
