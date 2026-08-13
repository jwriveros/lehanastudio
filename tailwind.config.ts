
import type { Config } from "tailwindcss";

const config: Config = {
  // OBLIGATORIO: Le indica a Tailwind que active los estilos 'dark:' mediante la clase .dark
  darkMode: "class", 
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;