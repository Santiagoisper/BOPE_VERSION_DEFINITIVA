import { cn } from "@/lib/utils";
import { MEDAL_META } from "@/lib/utils";
import type { Medal, MedalType } from "@/types";

const MEDAL_SYMBOL: Record<MedalType, string> = {
  medal_of_honor: "✦",
  navy_cross: "✚",
  silver_star: "★",
  bronze_star: "★",
  purple_heart: "♥",
  meritorious_service: "◆",
  commendation: "◉",
  achievement: "◎",
  good_conduct: "○",
};

interface RibbonBarProps {
  type: MedalType;
  height?: number;
}

export function MedalRibbonBar({ type, height = 6 }: RibbonBarProps) {
  const meta = MEDAL_META[type];
  return (
    <div
      className="flex overflow-hidden rounded-sm flex-shrink-0"
      style={{ height, minWidth: 28 }}
      title={meta.label}
    >
      {meta.ribbonColors.map((color, i) => (
        <div key={i} style={{ flex: 1, backgroundColor: color }} />
      ))}
    </div>
  );
}

interface MedalBadgeProps {
  medal: Medal;
  size?: "sm" | "md";
  showLabel?: boolean;
  showRibbon?: boolean;
}

export function MedalBadge({ medal, size = "sm", showLabel = false, showRibbon = false }: MedalBadgeProps) {
  const meta = MEDAL_META[medal.type];
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono",
        size === "sm" ? "text-[10px]" : "text-xs",
        "border-current/30 bg-current/5"
      )}
      title={`${meta.label}\n${medal.description}`}
    >
      {showRibbon ? (
        <MedalRibbonBar type={medal.type} height={size === "sm" ? 8 : 10} />
      ) : (
        <span className={cn("flex-shrink-0", meta.color)}>
          {MEDAL_SYMBOL[medal.type]}
        </span>
      )}
      {showLabel && (
        <span className={cn("truncate max-w-[120px]", meta.color)}>
          {meta.abbreviation}
        </span>
      )}
      {!showLabel && !showRibbon && (
        <span className={cn(meta.color, "sr-only")}>
          {meta.labelEs}
        </span>
      )}
    </div>
  );
}

interface MedalBadgeListProps {
  medals: Medal[];
  max?: number;
  showRibbons?: boolean;
}

export function MedalBadgeList({ medals, max = 4, showRibbons = false }: MedalBadgeListProps) {
  const sorted = [...medals].sort((a, b) =>
    MEDAL_META[a.type].precedence - MEDAL_META[b.type].precedence
  );
  const visible = sorted.slice(0, max);
  const remaining = sorted.length - visible.length;

  if (showRibbons) {
    return (
      <div className="flex flex-col gap-1">
        {visible.map((medal) => (
          <div key={medal.id} className="flex items-center gap-2" title={`${MEDAL_META[medal.type].label}: ${medal.description}`}>
            <MedalRibbonBar type={medal.type} height={10} />
            <span className={cn("font-mono text-[9px] uppercase tracking-wide", MEDAL_META[medal.type].color)}>
              {MEDAL_META[medal.type].abbreviation}
            </span>
          </div>
        ))}
        {remaining > 0 && (
          <span className="font-mono text-[9px] text-muted-foreground">+{remaining}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((medal) => (
        <MedalBadge key={medal.id} medal={medal} size="sm" showLabel />
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-border text-[10px] font-mono text-muted-foreground">
          +{remaining}
        </span>
      )}
    </div>
  );
}
