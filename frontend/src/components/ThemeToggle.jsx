import { Moon, Sun } from "lucide-react";
import { useAppContext } from "../context/AppContext";

// Sun/Moon switch for the huemint light/dark variants. Lives in the
// public navbar and each dashboard navbar.
const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme } = useAppContext();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-black/[0.08] dark:border-[#303631] text-slate-600 dark:text-[#A9AEA7] transition-all hover:border-[#183B35]/40 hover:bg-[#183B35]/10 hover:text-[#183B35] dark:hover:text-[#8FB8A8] dark:border-[#303631] dark:text-[#A9AEA7] dark:hover:border-[#8FB8A8]/40 dark:hover:text-[#8FB8A8] ${className}`}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
};

export default ThemeToggle;
