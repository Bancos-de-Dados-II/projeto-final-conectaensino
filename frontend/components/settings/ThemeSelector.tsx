import { Laptop, Moon, Sun } from "lucide-react";

import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeMode } from "../../types/preferences";

const options: Array<{
  value: ThemeMode;
  title: string;
  description: string;
  icon: typeof Sun;
}> = [
  {
    value: "light",
    title: "Claro",
    description: "Interface clara para ambientes iluminados",
    icon: Sun,
  },
  {
    value: "dark",
    title: "Escuro",
    description: "Interface confortável com baixa luminosidade",
    icon: Moon,
  },
  {
    value: "system",
    title: "Sistema",
    description: "Acompanha a preferência do seu dispositivo",
    icon: Laptop,
  },
];

export default function ThemeSelector() {
  const { preferences, setTheme } = useTheme();

  return (
    <div className="theme-options">
      {options.map((option) => {
        const Icon = option.icon;
        const selected = preferences.theme === option.value;

        return (
          <button
            className={`theme-option ${
              selected ? "theme-option--selected" : ""
            }`}
            type="button"
            key={option.value}
            onClick={() => setTheme(option.value)}
          >
            <span>
              <Icon size={21} />
            </span>

            <div>
              <strong>{option.title}</strong>
              <small>{option.description}</small>
            </div>
          </button>
        );
      })}
    </div>
  );
}
