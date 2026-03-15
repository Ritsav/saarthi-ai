import { Globe } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const handleToggle = async () => {
    await setLanguage(language === 'en' ? 'ne' : 'en');
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleToggle} className="gap-2">
      <Globe className="h-4 w-4" />
      {language === 'en' ? '??????' : 'English'}
    </Button>
  );
}
