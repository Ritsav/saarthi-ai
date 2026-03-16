import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SendHorizonal } from 'lucide-react';
import { ASSISTANT_PROMPTS } from '../data/passportContent';
import { useProcess } from '@/hooks/useProcess';
import { useDocuments } from '@/hooks/useDocuments';
import { usePassportFormData } from '@/hooks/usePassportFormData';
import { Button } from '@/components/ui/button';

type ChatRole = 'assistant' | 'user';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

function nowId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function AssistantPage() {
  const { requirements, readinessScore, processInfo } = useProcess('PASSPORT_APPLICATION');
  const { documents } = useDocuments();
  const { missingFields } = usePassportFormData();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const passportDocs = documents.filter(
    (doc) =>
      doc.process_type === 'PASSPORT_APPLICATION' &&
      (doc.document_type === 'CITIZENSHIP' || doc.document_type === 'PASSPORT_PHOTO')
  );

  const context = useMemo(() => {
    const missingRequirements = requirements.filter((item) => item.status === 'missing');
    const invalidRequirements = requirements.filter((item) => item.status === 'invalid');
    const citizenship = passportDocs.find((doc) => doc.document_type === 'CITIZENSHIP');
    const photo = passportDocs.find((doc) => doc.document_type === 'PASSPORT_PHOTO');

    return {
      missingRequirements,
      invalidRequirements,
      citizenship,
      photo,
      readiness: readinessScore.score,
      missingFieldsCount: missingFields.length,
    };
  }, [requirements, passportDocs, readinessScore.score, missingFields.length]);

  const buildReply = (input: string): string => {
    const q = input.toLowerCase();

    if (q.includes('what documents do i need')) {
      const checklist = requirements
        .map((item) => `- ${item.requirement}: ${item.status === 'completed' ? 'done' : item.status}`)
        .join('\n');
      return `For this passport process, your current required checklist is:\n${checklist || '- Citizenship document\n- Passport photo'}\n\nUpload both and run OCR analysis before final submission.`;
    }

    if (q.includes('can i apply with these documents')) {
      if (context.missingRequirements.length === 0 && context.invalidRequirements.length === 0) {
        return `You are close. Required documents look complete.\nCurrent readiness score: ${context.readiness}%.\nPlease still review OCR fields before final apply.`;
      }

      return `Not yet. You still have pending document issues:\n${context.missingRequirements.map((item) => `- Missing: ${item.requirement}`).join('\n') || ''}\n${context.invalidRequirements.map((item) => `- Needs correction: ${item.requirement}`).join('\n') || ''}`.trim();
    }

    if (q.includes('what should i do next')) {
      if (context.missingRequirements.length > 0) {
        return `Next step: upload/replace missing required documents first.\nAfter that, re-run OCR and then review the form fields.`;
      }

      if (context.missingFieldsCount > 0) {
        return `Next step: review OCR output and fill ${context.missingFieldsCount} missing form fields in Form Preview.`;
      }

      return `Next step: export to extension and run autofill on the passport portal form.`;
    }

    if (q.includes('citizenship document enough')) {
      if (!context.citizenship) {
        return 'Citizenship document is required, but I cannot find one uploaded yet. Please upload citizenship first.';
      }

      if (context.citizenship.status === 'error') {
        return 'Citizenship is uploaded but OCR/validation failed. Retry OCR from Documents page and ensure the text is readable.';
      }

      if (!context.photo) {
        return 'Citizenship is required, but not enough alone. You still need a valid passport photo.';
      }

      return 'Citizenship looks present. You also need the passport photo and complete mapped fields before final submission.';
    }

    if (q.includes('photo') && q.includes('accepted')) {
      if (!context.photo) {
        return 'I cannot see a passport photo uploaded yet. Please upload one first for validation.';
      }

      if (context.photo.status === 'error') {
        return 'The photo validation failed. Re-upload with plain background, centered face, and clearer lighting.';
      }

      return 'Photo is uploaded. For best acceptance, ensure plain light background, centered face, no glare/shadows, and recent image.';
    }

    return `I can help with passport preparation, required documents, OCR review, readiness, and extension autofill.\nTry one of the suggested questions for a quick action plan.`;
  };

  const sendQuestion = async (value: string) => {
    const text = value.trim();
    if (!text || isTyping) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: nowId(),
        role: 'user',
        content: text,
      },
    ]);
    setQuestion('');
    setIsTyping(true);

    window.setTimeout(() => {
      const reply = buildReply(text);
      setMessages((prev) => [
        ...prev,
        {
          id: nowId(),
          role: 'assistant',
          content: reply,
        },
      ]);
      setIsTyping(false);
    }, 350);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendQuestion(question);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Passport Assistant</h1>
        <p className="mt-2 text-sm text-slate-600">
          Ask anything about your passport process. I will guide you using your uploaded documents,
          OCR status, and checklist progress.
        </p>

        <div className="mt-4 h-[420px] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
              <div>
                <p className="font-medium text-slate-700">Chat placeholder</p>
                <p className="mt-1">Ask a passport process question to get a guided answer.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${
                    message.role === 'assistant'
                      ? 'border border-slate-200 bg-white text-slate-700'
                      : 'ml-auto bg-slate-900 text-white'
                  }`}
                >
                  {message.content}
                </div>
              ))}
              {isTyping ? (
                <div className="max-w-[85%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                  Assistant is typing...
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Suggested questions</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ASSISTANT_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void sendQuestion(prompt)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-3 flex gap-2">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about passport requirements, documents, OCR, or next steps..."
            className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500"
          />
          <Button type="submit" className="h-11 rounded-xl bg-slate-900 px-4 hover:bg-slate-800" disabled={isTyping}>
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </form>
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">{processInfo?.name || 'Passport process'}</h2>
          <p className="mt-2 text-sm text-slate-600">{processInfo?.description || 'Passport process status from backend.'}</p>
          <p className="mt-3 text-sm text-slate-700">Readiness score: {readinessScore.score}%</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Current checklist</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {requirements.map((item) => (
              <li key={item.requirement} className="flex items-center justify-between">
                <span>{item.requirement}</span>
                <span className="text-xs text-slate-500">{item.status === 'completed' ? 'Done' : item.status}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Quick actions</h3>
          <div className="mt-3 grid gap-2">
            <Button asChild variant="outline" className="justify-start rounded-xl">
              <Link to="/documents">Go to Documents</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start rounded-xl">
              <Link to="/ocr-review">Go to OCR Review</Link>
            </Button>
            <Button asChild className="justify-start rounded-xl bg-slate-900 hover:bg-slate-800">
              <Link to="/form-preview">Go to Form Preview</Link>
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

