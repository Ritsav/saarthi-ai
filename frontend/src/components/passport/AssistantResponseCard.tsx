import type { ReactNode } from 'react';

interface AssistantResponseCardProps {
  title: string;
  summary: string;
  bullets: string[];
  actions?: ReactNode;
}

export function AssistantResponseCard({ title, summary, bullets, actions }: AssistantResponseCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{summary}</p>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {bullets.map((point) => (
          <li key={point} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      {actions ? <div className="mt-3">{actions}</div> : null}
    </article>
  );
}
