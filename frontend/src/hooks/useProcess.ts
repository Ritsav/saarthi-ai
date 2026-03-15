import { useCallback, useEffect, useState } from 'react';
import api from '@/config/api';
import { DEMO_MODE, getDemoChecklist, getDemoDocuments, getDemoProcessInfo } from '@/config/demo';
import type { ProcessInfo, Requirement, ReadinessSummary, ProcessType } from '@/types';

interface UseProcessResult {
  processType: ProcessType;
  processInfo: ProcessInfo | null;
  requirements: Requirement[];
  readinessScore: ReadinessSummary;
  fees: string;
  timeline: string;
  portalUrl: string;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useProcess(_inputProcessType?: string): UseProcessResult {
  const processType: ProcessType = 'PASSPORT_APPLICATION';
  const [processInfo, setProcessInfo] = useState<ProcessInfo | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [readinessScore, setReadinessScore] = useState<ReadinessSummary>({ score: 0, complete: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    if (DEMO_MODE) {
      const process = getDemoProcessInfo(processType);
      const documents = getDemoDocuments();
      const { checklist, overallReadiness } = getDemoChecklist(processType, documents);
      const complete = checklist.filter((item) => item.status === 'completed').length;

      setProcessInfo(process);
      setRequirements(checklist);
      setReadinessScore({
        score: overallReadiness,
        complete,
        total: checklist.length,
      });
      setIsLoading(false);
      return;
    }

    try {
      const [processesResponse, checklistResponse] = await Promise.all([
        api.get('/api/process'),
        api.get(`/api/process/${processType}/checklist`),
      ]);

      const processes = (processesResponse.data?.data?.processes || []) as ProcessInfo[];
      const selected = processes.find((item) => item.type === processType) || null;
      setProcessInfo(selected);

      const checklist = (checklistResponse.data?.data?.checklist || []) as Requirement[];
      const complete = checklist.filter((item) => item.status === 'completed').length;

      setRequirements(checklist);
      setReadinessScore({
        score: checklistResponse.data?.data?.overall_readiness || 0,
        complete,
        total: checklist.length,
      });
    } catch {
      setRequirements([]);
      setReadinessScore({ score: 0, complete: 0, total: 0 });
      setProcessInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    if (DEMO_MODE) {
      const onDocumentsChanged = () => {
        void refresh();
      };

      window.addEventListener('saarthi-demo-documents-changed', onDocumentsChanged);
      return () => window.removeEventListener('saarthi-demo-documents-changed', onDocumentsChanged);
    }

    return undefined;
  }, [refresh]);

  return {
    processType,
    processInfo,
    requirements,
    readinessScore,
    fees: processInfo?.government_fee || '',
    timeline: processInfo?.estimated_time || '',
    portalUrl: processInfo?.portal_url || '#',
    isLoading,
    refresh,
  };
}
