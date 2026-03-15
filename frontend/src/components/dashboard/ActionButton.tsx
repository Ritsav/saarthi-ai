import type { ButtonHTMLAttributes } from 'react';
import { Button } from '@/components/ui/button';

export function ActionButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <Button {...props} className={`bg-primary hover:bg-primary-800 ${props.className || ''}`} />;
}
