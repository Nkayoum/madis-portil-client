import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import i18n from '../i18n'

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(value, short = false) {
    if (value === null || value === undefined || isNaN(Number(value))) return '0 €'
    const num = Number(value)

    const lng = i18n?.language || 'fr'
    const localeString = lng.startsWith('fr') ? 'fr-FR' : 'en-US'

    if (short) {
        if (num >= 1000000000000) {
            return `${(num / 1000000000000).toLocaleString(localeString, { maximumFractionDigits: 1 }).replace(/[.,]0$/, '')} Tr €`
        }
        if (num >= 1000000000) {
            return `${(num / 1000000000).toLocaleString(localeString, { maximumFractionDigits: 1 }).replace(/[.,]0$/, '')} Md €`
        }
        if (num >= 1000000) {
            return `${(num / 1000000).toLocaleString(localeString, { maximumFractionDigits: 1 }).replace(/[.,]0$/, '')} M €`
        }
        if (num >= 1000) {
            return `${(num / 1000).toLocaleString(localeString, { maximumFractionDigits: 1 }).replace(/[.,]0$/, '')} k €`
        }
    }

    return `${num.toLocaleString(localeString)} €`
}
