import { Request, Response } from 'express';
import { env } from '../config/env';
import { getHealthReport } from '../services/health';
import { sendSuccess } from '../utils/response';

const bootTime = Date.now();

export function getHealth(_req: Request, res: Response): void {
  const report = getHealthReport();

  sendSuccess(res, {
    status: report.status,
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
    checks: report.checks,
    version: process.env.npm_package_version ?? '1.0.0',
    environment: env.NODE_ENV,
    booted_at: new Date(bootTime).toISOString(),
  });
}
