import type { ReactNode } from 'react';
import { BarChart3, Check, Cog, ExternalLink, FileSearch, FileText, Loader2, Search } from 'lucide-react';

const TOOL_LABELS: Record<string, { label: string; icon: ReactNode }> = {
  retrieve_requirements: { label: 'Retrieving official requirements...', icon: <Search className="h-4 w-4" /> },
  analyze_document: { label: 'Analyzing your document...', icon: <FileSearch className="h-4 w-4" /> },
  generate_prefill: { label: 'Generating pre-filled form...', icon: <FileText className="h-4 w-4" /> },
  get_portal_link: { label: 'Finding portal link...', icon: <ExternalLink className="h-4 w-4" /> },
  calculate_readiness: { label: 'Calculating readiness score...', icon: <BarChart3 className="h-4 w-4" /> },
};

interface ToolCallCardProps {
  tool: string;
  status?: 'running' | 'done';
}

export function ToolCallCard({ tool, status }: ToolCallCardProps) {
  const info = TOOL_LABELS[tool] || { label: tool, icon: <Cog className="h-4 w-4" /> };

  return (
    <div className="my-2 flex items-center gap-2 rounded-md bg-slate-50 p-2 text-sm text-slate-500">
      {status === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> : info.icon}
      <span>{info.label}</span>
      {status === 'done' ? <Check className="h-4 w-4 text-green-500" /> : null}
    </div>
  );
}
