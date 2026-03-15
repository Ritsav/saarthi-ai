const VALID_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_MB = 10;

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

export function validateFile(file: File): string | null {
  if (!VALID_TYPES.includes(file.type)) {
    return 'Unsupported file type. Please upload JPG, PNG, or PDF.';
  }

  if (file.size > MAX_MB * 1024 * 1024) {
    return 'File too large. Maximum size is 10MB.';
  }

  return null;
}

export function validateFiles(files: File[]): { valid: File[]; errors: string[] } {
  const errors: string[] = [];
  const valid: File[] = [];

  files.forEach((file) => {
    const error = validateFile(file);
    if (error) {
      errors.push(`${file.name}: ${error}`);
    } else {
      valid.push(file);
    }
  });

  return { valid, errors };
}
