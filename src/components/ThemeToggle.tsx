"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button 
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
        aria-label="Loading theme toggle"
        disabled
      >
        <Sun size={20} />
      </button>
    );
  }

  const nextTheme = theme === "dark" ? "light" : "dark";
  const Icon = theme === "dark" ? Sun : Moon;
  const label = theme === "dark" ? "Claro" : "Escuro";

  return (
    <button
      onClick={() => setTheme(nextTheme)}
      className="flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 transition-colors shadow-md"
      aria-label={`Mudar para tema ${label}`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}