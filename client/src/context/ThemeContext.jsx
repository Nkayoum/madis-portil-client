import { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext({
    theme: "system",
    setThemeVal: () => null,
})

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "vite-ui-theme",
    ...props
}) {
    const [theme, setTheme] = useState(
        () => localStorage.getItem(storageKey) || defaultTheme
    )

    useEffect(() => {
        const root = window.document.documentElement

        root.classList.remove("light", "dark")
        root.removeAttribute("data-theme")

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
            root.classList.add(systemTheme)
            if (systemTheme === "light") {
                root.setAttribute("data-theme", "pastel")
            } else {
                root.setAttribute("data-theme", "madisThemeDark")
            }
            return
        }

        root.classList.add(theme)
        if (theme === "light") {
            root.setAttribute("data-theme", "pastel")
        } else {
            root.setAttribute("data-theme", "madisThemeDark")
        }
    }, [theme])

    const value = {
        theme,
        setTheme: (theme) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
    }

    return (
        <ThemeContext.Provider {...props} value={value}>
            {children}
        </ThemeContext.Provider>
    )
}

/* eslint-disable react-refresh/only-export-components */
export const useTheme = () => {
    const context = useContext(ThemeContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}
