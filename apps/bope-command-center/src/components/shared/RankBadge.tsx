import { cn } from "@/lib/utils";
import { RANK_META } from "@/lib/utils";
import type { AgentRank } from "@/types";

interface RankRibbonProps {
  rank: AgentRank;
  height?: number;
  width?: number;
}

export function RankRibbon({ rank, height = 8, width = 36 }: RankRibbonProps) {
  const meta = RANK_META[rank];
  return (
    <div
      className="flex overflow-hidden rounded-sm flex-shrink-0"
      style={{ height, width }}
      title={`${meta.abbreviation} — ${meta.titleEs}`}
    >
      {meta.ribbonStripes.map((stripe, i) => (
        <div key={i} style={{ flex: stripe.flex, backgroundColor: stripe.color }} />
      ))}
    </div>
  );
}

interface RankBadgeProps {
  rank: AgentRank;
  size?: "xs" | "sm" | "md";
  showTitle?: boolean;
}

export function RankBadge({ rank, size = "sm", showTitle = false }: RankBadgeProps) {
  const meta = RANK_META[rank];

  const ribbonHeight = size === "xs" ? 6 : size === "sm" ? 8 : 10;
  const ribbonWidth = size === "xs" ? 28 : size === "sm" ? 36 : 48;
  const textSize = size === "xs" ? "text-[8px]" : size === "sm" ? "text-[9px]" : "text-[10px]";

  return (
    <div className="inline-flex items-center gap-1.5" title={meta.titleEs}>
      <RankRibbon rank={rank} height={ribbonHeight} width={ribbonWidth} />
      <span className={cn("font-mono uppercase tracking-wider text-muted-foreground", textSize)}>
        {meta.abbreviation}
      </span>
      {showTitle && (
        <span className={cn("font-mono text-muted-foreground/70", textSize)}>
          {meta.titleEs}
        </span>
      )}
    </div>
  );
}

interface RankRowProps {
  rank: AgentRank;
}

export function RankRow({ rank }: RankRowProps) {
  const meta = RANK_META[rank];
  return (
    <div className="flex items-center gap-2">
      <RankRibbon rank={rank} height={10} width={48} />
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-amber">
          {meta.abbreviation}
        </div>
        <div className="font-mono text-[9px] text-muted-foreground">
          {meta.titleEs}
        </div>
      </div>
    </div>
  );
}
