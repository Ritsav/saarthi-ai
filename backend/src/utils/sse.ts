import { Response } from 'express';

export function setupSSE(res: Response): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
}

export function sendSSEEvent(res: Response, eventType: string, data: unknown): void {
  res.write(`event: ${eventType}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function startHeartbeat(res: Response, intervalMs = 30000): NodeJS.Timeout {
  return setInterval(() => {
    res.write(': heartbeat\n\n');
  }, intervalMs);
}
