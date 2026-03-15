import { UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';

type UploadDocumentType = 'CITIZENSHIP' | 'PASSPORT_PHOTO';

interface UploadBoxProps {
  onFileSelect: (files: File[], documentType: UploadDocumentType) => void;
}

export function UploadBox({ onFileSelect }: UploadBoxProps) {
  const citizenshipInputId = 'upload-citizenship-input';
  const photoInputId = 'upload-passport-photo-input';

  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center transition hover:border-slate-400">
      <UploadCloud className="mx-auto mb-3 h-10 w-10 text-slate-400" />
      <p className="text-sm font-medium text-slate-700">Upload passport documents</p>
      <p className="mt-1 text-xs text-slate-500">Select document type so OCR can map the correct fields.</p>

      <input
        id={citizenshipInputId}
        type="file"
        className="hidden"
        multiple
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={(event) => onFileSelect(Array.from(event.target.files || []), 'CITIZENSHIP')}
      />

      <input
        id={photoInputId}
        type="file"
        className="hidden"
        multiple
        accept=".jpg,.jpeg,.png"
        onChange={(event) => onFileSelect(Array.from(event.target.files || []), 'PASSPORT_PHOTO')}
      />

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => document.getElementById(citizenshipInputId)?.click()}>
          Upload Citizenship
        </Button>
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => document.getElementById(photoInputId)?.click()}>
          Upload Passport Photo
        </Button>
      </div>
    </div>
  );
}
