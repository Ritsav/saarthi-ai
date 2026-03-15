import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/config/api';
import type { ProcessInfo, Requirement, ReadinessSummary, ProcessType } from '@/types';

function normalizeProcessType(input?: string): ProcessType {
  const value = (input || 'COMPANY_REGISTRATION').toUpperCase();
  if (value === 'PAN_REGISTRATION' || value === 'PASSPORT_APPLICATION' || value === 'COMPANY_REGISTRATION') {
    return value;
  }

  if (value === 'PAN') return 'PAN_REGISTRATION';
  if (value === 'PASSPORT') return 'PASSPORT_APPLICATION';
  return 'COMPANY_REGISTRATION';
}

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

export function useProcess(inputProcessType?: string): UseProcessResult {
  const processType = useMemo(() => normalizeProcessType(inputProcessType), [inputProcessType]);
  const [processInfo, setProcessInfo] = useState<ProcessInfo | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [readinessScore, setReadinessScore] = useState<ReadinessSummary>({ score: 0, complete: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
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
  }, [processType]);

  useEffect(() => {
    void refresh();
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
