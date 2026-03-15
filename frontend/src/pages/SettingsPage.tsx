import { Shield, Bell, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-2 text-sm text-slate-600">Manage preferences for your passport preparation workspace.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-slate-800">
            <Shield className="h-4 w-4" />
            <h2 className="text-sm font-semibold">Privacy</h2>
          </div>
          <p className="text-sm text-slate-600">Your files are used only for preparation and validation.</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-slate-800">
            <Bell className="h-4 w-4" />
            <h2 className="text-sm font-semibold">Notifications</h2>
          </div>
          <p className="text-sm text-slate-600">Get reminders for missing fields and readiness updates.</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-slate-800">
            <Globe className="h-4 w-4" />
            <h2 className="text-sm font-semibold">Language</h2>
          </div>
          <p className="text-sm text-slate-600">English active. Nepali localization can be enabled later.</p>
        </article>
      </section>

      <Button className="rounded-xl bg-slate-900 hover:bg-slate-800">Save preferences</Button>
    </div>
  );
}
