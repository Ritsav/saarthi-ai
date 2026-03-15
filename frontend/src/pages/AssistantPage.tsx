import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { ASSISTANT_PROMPTS, COMMON_ERRORS, NEXT_STEP_TIMELINE, PASSPORT_STEPS, PORTAL_LINK } from '../data/passportDemo';
import { useProcess } from '@/hooks/useProcess';
import { AssistantResponseCard } from '@/components/passport/AssistantResponseCard';
import { ProgressStepper } from '@/components/passport/ProgressStepper';
import { OfficialPortalCard } from '@/components/passport/OfficialPortalCard';
import { NextStepTimeline } from '@/components/passport/NextStepTimeline';
import { Button } from '@/components/ui/button';

function buildStructuredAnswer(prompt: string) {
  const normalized = prompt.toLowerCase();

  if (normalized.includes('photo')) {
    return {
      title: 'Passport photo acceptance check',
      summary: 'Your photo should meet official standards before you submit.',
      bullets: [
        'Use plain light background with clear face visibility',
        'Avoid shadows, glare, and head tilt',
        'Upload high-resolution recent photo',
      ],
    };
  }

  if (normalized.includes('citizenship')) {
    return {
      title: 'Citizenship document guidance',
      summary: 'Citizenship copy is mandatory and should be clearly readable.',
      bullets: [
        'Upload front side with full corners visible',
        'Ensure number and district text are not blurred',
        'Check name consistency with other fields',
      ],
    };
  }

  return {
    title: 'Nepal passport preparation checklist',
    summary: 'Here is what you should complete before going to official portal.',
    bullets: [
      'Upload citizenship and passport-size photo',
      'Review extracted data and correct missing values',
      'Check readiness score and follow next-step timeline',
    ],
  };
}

export default function AssistantPage() {
  const [activePrompt, setActivePrompt] = useState(ASSISTANT_PROMPTS[0]);
  const { requirements } = useProcess('PASSPORT_APPLICATION');

  const answer = useMemo(() => buildStructuredAnswer(activePrompt), [activePrompt]);

  return (
    <div className="space-y-6">
      <ProgressStepper steps={PASSPORT_STEPS} current={1} />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">AI Passport Assistant</h1>
            <p className="mt-2 text-sm text-slate-600">Structured guidance to prepare your application correctly before submission.</p>
          </div>

          <AssistantResponseCard
            title={answer.title}
            summary={answer.summary}
            bullets={answer.bullets}
            actions={
              <div className="flex gap-2">
                <Button asChild size="sm" className="rounded-xl bg-slate-900 hover:bg-slate-800">
                  <Link to="/documents">Upload documents</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <Link to="/ocr-review">Review OCR data</Link>
                </Button>
              </div>
            }
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Suggested prompts</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ASSISTANT_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setActivePrompt(prompt)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    prompt === activePrompt ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Passport process summary</h2>
            <p className="mt-2 text-sm text-slate-600">Focus only on individual Nepal passport preparation before official submission.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Required document checklist</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {requirements.map((item) => (
                <li key={item.requirement} className="flex items-center justify-between">
                  <span>{item.requirement}</span>
                  <span className="text-xs text-slate-500">{item.status === 'completed' ? 'Done' : 'Pending'}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Common errors</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {COMMON_ERRORS.map((error) => (
                <li key={error} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>

          <OfficialPortalCard href={PORTAL_LINK} />

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Next action</p>
              <Button asChild variant="ghost" size="sm" className="rounded-xl">
                <Link to="/readiness">
                  Review
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <p className="mt-2 text-sm text-slate-600">Validate documents and confirm extracted values before final submission.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Quick portal access</p>
            <Button variant="outline" className="mt-3 w-full rounded-xl" onClick={() => window.open(PORTAL_LINK, '_blank')}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Official portal
            </Button>
          </div>
        </aside>
      </div>

      <NextStepTimeline items={NEXT_STEP_TIMELINE} />
    </div>
  );
}

