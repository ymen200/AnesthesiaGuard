import { Upload, Mic, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "file" | "micro" | "live";

interface ModeSelectorProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

const modes = [
  { id: "file" as Mode, label: "Upload Audio", icon: Upload, description: "Télécharger un fichier audio" },
  { id: "micro" as Mode, label: "Enregistrement", icon: Mic, description: "Enregistrer avec le micro" },
  { id: "live" as Mode, label: "Discussion Live", icon: Phone, description: "Appel patient-docteur" },
];

export function ModeSelector({ mode, setMode }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200",
            mode === m.id
              ? "border-primary bg-accent text-accent-foreground shadow-lg"
              : "border-border bg-card hover:border-primary/50 hover:shadow-md"
          )}
        >
          <div
            className={cn(
              "p-3 rounded-full",
              mode === m.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            <m.icon className="w-6 h-6" />
          </div>
          <div className="text-center">
            <p className="font-semibold">{m.label}</p>
            <p className="text-sm text-muted-foreground">{m.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
