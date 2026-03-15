import { Link } from 'react-router-dom';
import { CheckCircle2, FileScan, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReadinessGauge } from '@/components/passport/ReadinessGauge';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">S</div>
            <div>
              <p className="text-sm font-semibold">Saarthi</p>
              <p className="text-xs text-slate-500">Nepal Passport Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="rounded-xl">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild className="rounded-xl bg-slate-900 hover:bg-slate-800">
              <Link to="/signup">Start Passport Check</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">Trusted civic-tech preparation workflow</span>
            <h1 className="mt-4 text-4xl font-bold leading-tight lg:text-5xl">Prepare your Nepal passport application with AI</h1>
            <p className="mt-4 text-lg text-slate-600">
              Saarthi helps you understand requirements, validate documents, and know exactly what to do before applying.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-xl bg-slate-900 hover:bg-slate-800">
                <Link to="/signup">Start Passport Check</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl">
                <Link to="/assistant">See How It Works</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Passport readiness</p>
                <div className="mt-3 flex justify-center">
                  <ReadinessGauge score={82} size={140} />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Upload validation</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li>Citizenship: Valid</li>
                  <li>Photo: Needs review</li>
                  <li>Missing: Issue date</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium">AI assistant guidance</p>
              <p className="mt-1 text-sm text-slate-600">You are almost ready. Replace low-quality photo and confirm district spelling before proceeding.</p>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            { icon: ListChecks, title: 'Check required documents', desc: 'Understand exact passport requirements before you begin.' },
            { icon: FileScan, title: 'Validate uploaded files', desc: 'AI checks quality, completeness, and format issues.' },
            { icon: CheckCircle2, title: 'Get exact next steps', desc: 'Follow clear actions before submitting on official portal.' },
          ].map((card) => (
            <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <card.icon className="h-5 w-5 text-slate-700" />
              <h3 className="mt-3 text-lg font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{card.desc}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">How Saarthi works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {['Understand passport requirements', 'Upload your documents', 'Let AI validate readiness', 'Confirm extracted information', 'Proceed with confidence'].map((step, index) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">Step {index + 1}</p>
                <p className="mt-1 text-sm text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold">Built for Nepal passport applicants</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Uses official government requirements</li>
              <li>Designed to reduce mistakes and confusion</li>
              <li>Secure document processing</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
            <p className="text-sm">Start Passport Check</p>
            <h3 className="mt-1 text-2xl font-semibold">Let Saarthi guide you</h3>
            <Button asChild className="mt-4 rounded-xl bg-white text-slate-900 hover:bg-slate-100">
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
