import { Download, ExternalLink, MessageSquare, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useProcess } from '@/hooks/useProcess';
import { useDocuments } from '@/hooks/useDocuments';
import type { ProcessType } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReadinessScore } from '@/components/dashboard/ReadinessScore';
import { RequirementsList } from '@/components/dashboard/RequirementsList';
import { DocumentCard } from '@/components/document/DocumentCard';
import { UploadZone } from '@/components/document/UploadZone';

export default function DashboardPage() {
  const { processType: processTypeParam } = useParams<{ processType: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { processType, requirements, readinessScore, fees, timeline, portalUrl } = useProcess(processTypeParam);
  const { documents, uploadDocument } = useDocuments();

  const processDocuments = documents.filter((document) => document.process_type === processType);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t(`process.${processType}`)}</h1>
        <p className="text-slate-500">{t(`process.${processType}_desc`)}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="py-8">
            <ReadinessScore score={readinessScore.score} complete={readinessScore.complete} total={readinessScore.total} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <h3 className="font-semibold">{t('readiness.required_documents')}</h3>
          </CardHeader>
          <CardContent>
            <RequirementsList requirements={requirements} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="font-semibold">{t('document.uploaded')}</h3>
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            {t('document.upload')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <UploadZone
            processType={processType as ProcessType}
            onUpload={async (file, selectedProcessType, onProgress) => {
              await uploadDocument(file, selectedProcessType, undefined, onProgress);
            }}
          />

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {processDocuments.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button className="bg-primary hover:bg-primary-800" onClick={() => window.open(portalUrl, '_blank')}>
          <ExternalLink className="mr-2 h-4 w-4" />
          {t('readiness.get_portal_link')}
        </Button>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          {t('readiness.download_form')}
        </Button>
        <Button variant="secondary" onClick={() => navigate('/chat')}>
          <MessageSquare className="mr-2 h-4 w-4" />
          {t('chat.start_about_process')}
        </Button>
      </div>

      {fees || timeline ? (
        <Card>
          <CardContent className="flex flex-wrap gap-8 py-4">
            {fees ? (
              <div>
                <span className="text-sm text-slate-500">Fees:</span>
                <span className="ml-2 font-medium">{fees}</span>
              </div>
            ) : null}
            {timeline ? (
              <div>
                <span className="text-sm text-slate-500">Est. Time:</span>
                <span className="ml-2 font-medium">{timeline}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
