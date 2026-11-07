/** @type {import('tailwindcss').Config} */
// Migration du config inline du CDN (index.html) vers un build-time
// (audit propreté 07/11 P1) : le Play CDN n'est pas fait pour la prod —
// ~110 KB de JS runtime par chargement, FOUC, et styles perdus hors-ligne
// (le SW ne cache pas cdn.tailwindcss.com).
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'app-primary': '#E1477E',
        'app-secondary': '#f3f3f3',
        'app-accent': '#0078d4',
      },
    },
  },
  // Conserver le comportement du CDN : pas de reset CSS
  // (les styles de base vivent dans src/styles/global.css)
  corePlugins: {
    preflight: false,
  },
  // Classes construites dynamiquement — invisibles pour le scanner de contenu
  // (TableBody.tsx : `text-${column.align}`).
  safelist: [
    { pattern: /^text-(left|center|right)$/ },
  ],
};
