import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/common/Logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-200 bg-white/95 backdrop-blur">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-fit">
            <Logo />
          </div>
          <CardTitle>{t('auth.register_title')}</CardTitle>
          <CardDescription>{t('auth.register_subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
}
