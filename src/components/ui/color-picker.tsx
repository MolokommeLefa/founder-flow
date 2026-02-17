import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

const PREDEFINED_COLORS = [
  { name: "Blue", value: "#2563eb" },
  { name: "Red", value: "#dc2626" },
  { name: "Orange", value: "#ea580c" },
  { name: "Yellow", value: "#ca8a04" },
  { name: "Green", value: "#16a34a" },
  { name: "Purple", value: "#9333ea" },
  { name: "Pink", value: "#db2777" },
  { name: "Gray", value: "#6b7280" },
];

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2">
        {PREDEFINED_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            onClick={() => onChange(color.value)}
            className={cn(
              "w-8 h-8 rounded-md border-2 transition-all hover:scale-110",
              value === color.value ? "border-foreground ring-2 ring-offset-2 ring-foreground" : "border-border"
            )}
            style={{ backgroundColor: color.value }}
            title={color.name}
            aria-label={`Select ${color.name} color`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-8 rounded border border-border cursor-pointer"
          aria-label="Custom color picker"
        />
        <span className="text-sm text-muted-foreground" aria-live="polite">
          <span className="sr-only">Currently selected color: </span>
          {PREDEFINED_COLORS.find(c => c.value === value)?.name || 'Custom'} ({value.toUpperCase()})
        </span>
      </div>
    </div>
  );
}
