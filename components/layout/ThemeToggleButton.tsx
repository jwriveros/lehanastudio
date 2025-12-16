"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";

export const ThemeToggleButton = () => {
	const [mounted, setMounted] = useState(false);
	const { theme, setTheme } = useTheme();

	useEffect(() => setMounted(true), []);

	if (!mounted) {
		return (
			<div className="w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-700" />
		);
	}

	const handleThemeChange = () => {
		if (theme === "light") {
			setTheme("dark");
		} else if (theme === "dark") {
			setTheme("system");
		} else {
			setTheme("light");
		}
	};

	return (
		<button
			onClick={handleThemeChange}
			className="flex items-center justify-center w-9 h-9 rounded-full border bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 transition-all duration-300"
			aria-label="Cambiar tema"
		>
			<div className="relative w-5 h-5 flex items-center justify-center">
				<Sun
					size={18}
					className={`absolute transition-all duration-300 transform ${
						theme === "light" ? "scale-100 opacity-100" : "scale-0 opacity-0"
					}`}
				/>
				<Moon
					size={18}
					className={`absolute transition-all duration-300 transform ${
						theme === "dark" ? "scale-100 opacity-100" : "scale-0 opacity-0"
					}`}
				/>
				<Monitor
					size={18}
					className={`absolute transition-all duration-300 transform ${
						theme === "system" ? "scale-100 opacity-100" : "scale-0 opacity-0"
					}`}
				/>
			</div>
		</button>
	);
};
