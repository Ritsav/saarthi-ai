import { UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadBoxProps {
  onFileSelect: (files: File[]) => void;
}

export function UploadBox({ onFileSelect }: UploadBoxProps) {
  return (
    <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center transition hover:border-slate-400">
      <UploadCloud className="mx-auto mb-3 h-10 w-10 text-slate-400" />
      <p className="text-sm font-medium text-slate-700">Drag and drop passport documents</p>
      <p className="mt-1 text-xs text-slate-500">Citizenship, passport photo, supporting docs. JPG, PNG, PDF.</p>
      <input type="file" className="hidden" multiple accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => onFileSelect(Array.from(e.target.files || []))} />
      <Button type="button" variant="outline" className="mt-4 rounded-xl">
        Choose files
      </Button>
    </label>
  );
}
