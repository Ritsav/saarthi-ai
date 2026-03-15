import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function ConsentModal({ open, onAccept, onDecline }: ConsentModalProps) {
  const { t } = useTranslation();
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);

  const handleAccept = () => {
    onAccept();
    setConsent1(false);
    setConsent2(false);
  };

  const handleDecline = () => {
    onDecline();
    setConsent1(false);
    setConsent2(false);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleDecline()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('document.consent_title')}</DialogTitle>
          <DialogDescription>{t('document.consent_description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3">
            <Checkbox id="consent-1" checked={consent1} onCheckedChange={(checked) => setConsent1(Boolean(checked))} />
            <label htmlFor="consent-1" className="text-sm text-slate-700">
              {t('document.consent_checkbox_1')}
            </label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox id="consent-2" checked={consent2} onCheckedChange={(checked) => setConsent2(Boolean(checked))} />
            <label htmlFor="consent-2" className="text-sm text-slate-700">
              {t('document.consent_checkbox_2')}
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleDecline}>
            {t('document.decline')}
          </Button>
          <Button onClick={handleAccept} disabled={!consent1 || !consent2}>
            {t('document.accept')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
