import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(value, short = false) {
    if (value === null || value === undefined || isNaN(Number(value))) return 'N/A';
    const num = Number(value);

    if (short) {
        if (num >= 1000000000) {
            return `${(num / 1000000000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Md €`;
        }
        if (num >= 1000000) {
            return `${(num / 1000000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M €`;
        }
    }

    return `${num.toLocaleString('fr-FR')} €`;
}
