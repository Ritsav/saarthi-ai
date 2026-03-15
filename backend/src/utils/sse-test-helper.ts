import { Response } from 'express';

export function createMockSSECollector() {
  const events: string[] = [];

  const response = {
    write(chunk: string) {
      events.push(chunk);
      return true;
    },
    writeHead(_statusCode: number, _headers?: Record<string, string>) {
      return response;
    },
    flushHeaders() {},
    end() {},
  } as unknown as Response;

  return {
    response,
    events,
  };
}
