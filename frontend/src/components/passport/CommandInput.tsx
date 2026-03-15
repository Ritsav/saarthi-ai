import { Search } from 'lucide-react';

interface CommandInputProps {
  placeholder?: string;
}

export function CommandInput({ placeholder = 'What do you need help with?' }: CommandInputProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <Search className="h-4 w-4 text-slate-400" />
      <input className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none" placeholder={placeholder} />
    </div>
  );
}
