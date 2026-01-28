import { ExternalLink } from 'lucide-react';
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
    return null;
  }

  const badge = (
    <span 
      className={cn(
        "inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors",
        reportUrl && "cursor-pointer"
      )}
    >
      <span className="font-medium">{score}%</span>
      {reportUrl && <ExternalLink className="h-2.5 w-2.5" />}
    </span>
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
