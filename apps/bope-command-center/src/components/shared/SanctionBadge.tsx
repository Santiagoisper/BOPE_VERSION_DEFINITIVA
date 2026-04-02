import { cn, sanctionLabel, sanctionColor } from "@/lib/utils";
import type { Sanction } from "@/types";

interface SanctionBadgeProps {
  sanction: Sanction;
  size?: "sm" | "md";
}

export function SanctionBadge({ sanction, size = "sm" }: SanctionBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono",
        size === "sm" ? "text-[10px]" : "text-xs",
        sanction.resolved ? "opacity-50" : "",
        "border-current/30 bg-current/5"
      )}
      title={sanction.details}
    >
      <span className={cn("flex-shrink-0", sanctionColor(sanction.severity))}>
        {sanction.resolved ? "○" : "●"}
      </span>
      <span className={cn(sanctionColor(sanction.severity))}>
        {sanctionLabel(sanction.severity)}
      </span>
      {sanction.resolved && (
        <span className="text-muted-foreground">· resuelto</span>
      )}
    </div>
  );
}
