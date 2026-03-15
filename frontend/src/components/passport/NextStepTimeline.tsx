interface NextStepTimelineProps {
  items: Array<{ title: string; detail: string }>;
}

export function NextStepTimeline({ items }: NextStepTimelineProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">Next actions timeline</h3>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.title} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">{index + 1}</span>
              {index < items.length - 1 ? <span className="mt-1 h-full w-px bg-slate-200" /> : null}
            </div>
            <div className="pb-2">
              <p className="text-sm font-medium text-slate-800">{item.title}</p>
              <p className="text-sm text-slate-600">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
