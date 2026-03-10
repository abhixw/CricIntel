/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    blue: "#3b82f6",
                    green: "#10b981",
                    orange: "#f97316",
                    white: "#ffffff",
                    soft: "#f8fafc",
                },
                cricket: {
                    primary: "#3b82f6",
                    secondary: "#10b981",
                    accent: "#f97316",
                    base: "#ffffff",
                    muted: "#64748b",
                }
            },
            boxShadow: {
                'soft': '0 8px 30px rgba(0, 0, 0, 0.04)',
                'premium': '0 10px 40px rgba(59, 130, 246, 0.05)',
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
            }
        },
    },
    plugins: [],
}
