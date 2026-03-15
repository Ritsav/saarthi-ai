function maskLongNumber(value: string): string {
  const digitsOnly = value.replace(/\D/g, '');
  if (digitsOnly.length < 6) {
    return value;
  }

  let seenDigits = 0;
  return value.replace(/\d/g, (digit) => {
    seenDigits += 1;
    if (seenDigits <= 2 || seenDigits > digitsOnly.length - 2) {
      return digit;
    }
    return '*';
  });
}

function redactString(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [REDACTED_TOKEN]')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[REDACTED_EMAIL]')
    .replace(/\b\d{6,}\b/g, (match) => maskLongNumber(match));
}

export function redactSensitive(input: unknown): unknown {
  if (input == null) {
    return input;
  }

  if (typeof input === 'string') {
    return redactString(input);
  }

  if (Array.isArray(input)) {
    return input.map((value) => redactSensitive(value));
  }

  if (typeof input === 'object') {
    const source = input as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(source)) {
      const lowered = key.toLowerCase();
      if (
        lowered.includes('password') ||
        lowered.includes('token') ||
        lowered.includes('authorization') ||
        lowered.includes('raw_text') ||
        lowered.includes('ocr_result') ||
        lowered.includes('validation_result')
      ) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactSensitive(value);
      }
    }

    return result;
  }

  return input;
}
