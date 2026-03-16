import { useMemo, useState } from 'react';
import { FileUp, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';

type UploadDocumentType = 'CITIZENSHIP' | 'PASSPORT_PHOTO';

interface UploadBoxProps {
  onFileSelect: (files: File[], documentType: UploadDocumentType) => void;
}

export function UploadBox({ onFileSelect }: UploadBoxProps) {
  const inputId = 'upload-passport-documents-input';
  const [selectedType, setSelectedType] = useState<UploadDocumentType>('CITIZENSHIP');
  const [isDragActive, setIsDragActive] = useState(false);

  const accept = useMemo(
    () =>
      selectedType === 'PASSPORT_PHOTO'
        ? '.jpg,.jpeg,.png'
        : '.jpg,.jpeg,.png,.pdf',
    [selectedType]
  );

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    onFileSelect(Array.from(files), selectedType);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          className={`rounded-full ${selectedType === 'CITIZENSHIP' ? 'bg-slate-900 hover:bg-slate-800' : ''}`}
          variant={selectedType === 'CITIZENSHIP' ? 'default' : 'outline'}
          onClick={() => setSelectedType('CITIZENSHIP')}
        >
          Citizenship
        </Button>
        <Button
          type="button"
          size="sm"
          className={`rounded-full ${selectedType === 'PASSPORT_PHOTO' ? 'bg-slate-900 hover:bg-slate-800' : ''}`}
          variant={selectedType === 'PASSPORT_PHOTO' ? 'default' : 'outline'}
          onClick={() => setSelectedType('PASSPORT_PHOTO')}
        >
          Passport Photo
        </Button>
      </div>

      <div
        className={`rounded-3xl border-2 border-dashed p-10 text-center transition ${
          isDragActive
            ? 'border-slate-500 bg-slate-100'
            : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragActive(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <input
          id={inputId}
          type="file"
          className="hidden"
          multiple
          accept={accept}
          onChange={(event) => handleFiles(event.target.files)}
        />

        <div className="mx-auto flex max-w-lg flex-col items-center justify-center">
          <UploadCloud className="mb-4 h-12 w-12 text-slate-400" />
          <p className="text-base font-semibold text-slate-800">Drag and drop files to upload</p>
          <p className="mt-1 text-sm text-slate-500">
            Selected type: {selectedType === 'CITIZENSHIP' ? 'Citizenship' : 'Passport Photo'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {selectedType === 'PASSPORT_PHOTO'
              ? 'Accepted: JPG, JPEG, PNG'
              : 'Accepted: JPG, JPEG, PNG, PDF'}
          </p>

          <Button
            type="button"
            className="mt-5 rounded-xl bg-slate-900 hover:bg-slate-800"
            onClick={() => document.getElementById(inputId)?.click()}
          >
            <FileUp className="mr-2 h-4 w-4" />
            Browse Files
          </Button>
        </div>
      </div>
    </div>
  );
}
