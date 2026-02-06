/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // Adicionado src/ para garantir que classes dinâmicas sejam detectadas
  ],
  darkMode: 'class', // Habilitando dark mode via classe
  theme: {
    extend: {},
  },
  plugins: [],
}