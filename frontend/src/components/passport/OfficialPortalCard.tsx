import { ExternalLink, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OfficialPortalCardProps {
  href: string;
}

export function OfficialPortalCard({ href }: OfficialPortalCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-slate-800">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        <h3 className="text-sm font-semibold">Official Passport Portal</h3>
      </div>
      <p className="text-sm text-slate-600">Proceed only after your readiness is complete to reduce rejections and delays.</p>
      <Button className="mt-3 w-full rounded-xl" onClick={() => window.open(href, '_blank')}>
        <ExternalLink className="mr-2 h-4 w-4" />
        Open official portal
      </Button>
    </div>
  );
}
