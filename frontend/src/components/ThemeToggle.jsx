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
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-black/[0.08] dark:border-[#1D3842] text-slate-600 dark:text-[#9FB2B8] transition-all hover:border-[#5077B3]/40 hover:bg-[#5077B3]/10 hover:text-[#5077B3] dark:hover:text-[#93B3E0] dark:border-[#1D3842] dark:text-[#9FB2B8] dark:hover:border-[#6E93C9]/40 dark:hover:text-[#93B3E0] ${className}`}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
};

export default ThemeToggle;
