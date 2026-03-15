import { useState } from 'react';
import { FileX, Grid2X2, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ProcessType } from '@/types';
import { useDocuments } from '@/hooks/useDocuments';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/common/EmptyState';
import { UploadZone } from '@/components/document/UploadZone';
import { DocumentCard } from '@/components/document/DocumentCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DocumentsPage() {
  const { t } = useTranslation();
  const { documents, deleteDocument, uploadDocument } = useDocuments();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all' ? documents : documents.filter((document) => document.process_type === filter);

  const handleUpload = async (file: File, processType?: ProcessType, onProgress?: (progress: number) => void) => {
    await uploadDocument(file, processType, undefined, onProgress);
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold">{t('nav.documents')}</h1>

        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="COMPANY_REGISTRATION">{t('process.COMPANY_REGISTRATION')}</TabsTrigger>
              <TabsTrigger value="PAN_REGISTRATION">{t('process.PAN_REGISTRATION')}</TabsTrigger>
              <TabsTrigger value="PASSPORT_APPLICATION">{t('process.PASSPORT_APPLICATION')}</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button variant="ghost" size="icon" onClick={() => setView((current) => (current === 'grid' ? 'list' : 'grid'))}>
            {view === 'grid' ? <List className="h-4 w-4" /> : <Grid2X2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <UploadZone className="mb-6" onUpload={handleUpload} />

      {!documents.length ? (
        <EmptyState icon={<FileX className="h-6 w-6 text-slate-400" />} message={t('document.no_documents')} />
      ) : (
        <div className={cn(view === 'grid' ? 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4' : 'space-y-3')}>
          {filtered.map((document) => (
            <DocumentCard key={document.id} document={document} view={view} onDelete={deleteDocument} />
          ))}
        </div>
      )}
    </div>
  );
}
