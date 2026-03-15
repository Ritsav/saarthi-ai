import { ShieldCheck } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">S</div>
          <h1 className="text-2xl font-semibold text-slate-900">Welcome to Saarthi</h1>
          <p className="mt-1 text-sm text-slate-600">Secure access to your passport assistant</p>
        </div>

        <LoginForm />

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            Trust note
          </div>
          <p className="mt-1">Saarthi helps you prepare documents and verify readiness before official submission.</p>
        </div>
      </div>
    </div>
  );
}
