import { useRef, useState, type DragEvent } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { ProcessType } from '@/types';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { validateFiles } from '@/utils/validators';
import { ConsentModal } from './ConsentModal';

interface UploadZoneProps {
  processType?: ProcessType;
  className?: string;
  onUpload: (file: File, processType?: ProcessType, onProgress?: (progress: number) => void) => Promise<void>;
}

export function UploadZone({ processType, className, onUpload }: UploadZoneProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showConsent, setShowConsent] = useState(false);
  const pendingFilesRef = useRef<File[]>([]);

  const hasConsent = localStorage.getItem('saarthi_upload_consent') === 'true';

  const processFiles = async (files: File[]) => {
    const { valid, errors } = validateFiles(files);
    errors.forEach((error) => toast.error(error));

    if (!valid.length) return;

    if (!hasConsent) {
      pendingFilesRef.current = valid;
      setShowConsent(true);
      return;
    }

    setUploading(true);
    try {
      for (const file of valid) {
        setProgress(0);
        await onUpload(file, processType, (value) => setProgress(value));
      }
      toast.success('Document upload complete.');
    } catch (error) {
      toast.error((error as Error).message || 'Upload failed.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files);
    await processFiles(files);
  };

  return (
    <>
      <Card
        className={cn(
          'cursor-pointer border-2 border-dashed p-8 text-center transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-slate-400',
          className,
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => void onDrop(event)}
      >
        <label className="block cursor-pointer">
          <Upload className="mx-auto mb-3 h-10 w-10 text-slate-400" />
          <p className="text-sm text-slate-600">{t('document.drag_drop')}</p>
          <p className="mt-1 text-xs text-slate-400">JPG, PNG, PDF - Max 10MB</p>
          <input type="file" hidden accept=".jpg,.jpeg,.png,.pdf" multiple onChange={(event) => void processFiles(Array.from(event.target.files || []))} />
        </label>

        {uploading ? <Progress value={progress} className="mt-4" /> : null}
      </Card>

      <ConsentModal
        open={showConsent}
        onDecline={() => {
          setShowConsent(false);
          pendingFilesRef.current = [];
        }}
        onAccept={() => {
          setShowConsent(false);
          localStorage.setItem('saarthi_upload_consent', 'true');
          void processFiles(pendingFilesRef.current);
          pendingFilesRef.current = [];
        }}
      />
    </>
  );
}
