import { ExternalLink, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SafetyScoreBadgeProps {
  score?: number;
  provider?: string;
  reportUrl?: string;
  compact?: boolean;
}

export function SafetyScoreBadge({ 
  score, 
  provider = 'DeFiSafety', 
  reportUrl,
  compact = false 
}: SafetyScoreBadgeProps) {
  if (score === undefined) {
    return (
      <div className="text-muted-foreground text-sm">—</div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-success/20 text-success border-success/30';
    if (score >= 60) return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 border-yellow-500/30';
    return 'bg-destructive/20 text-destructive border-destructive/30';
  };

  const badge = (
    <div 
      className={cn(
        "inline-flex flex-col items-center gap-0.5 rounded-lg border px-2 py-1 transition-colors",
        getScoreColor(score),
        reportUrl && "cursor-pointer hover:opacity-80"
      )}
    >
      <div className="flex items-center gap-1">
        <ShieldCheck className="h-3 w-3" />
        <span className={cn("font-semibold", compact ? "text-xs" : "text-sm")}>
          {score}%
        </span>
        {reportUrl && <ExternalLink className="h-2.5 w-2.5 opacity-60" />}
      </div>
      {!compact && (
        <span className="text-[10px] opacity-70">{provider}</span>
      )}
    </div>
  );

  const content = reportUrl ? (
    <a
      href={reportUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="no-underline"
    >
      {badge}
    </a>
  ) : (
    badge
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{provider} Safety Score: {score}%</p>
            <p className="text-xs text-muted-foreground">
              Independent assessment of code quality, audits, documentation, and team transparency.
            </p>
            {reportUrl && (
              <p className="text-xs text-primary">Click to verify on {provider}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
