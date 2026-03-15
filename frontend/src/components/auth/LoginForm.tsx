import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';
import { validateEmail } from '@/utils/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/chat';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          setError(`Cannot connect to backend API at ${apiUrl}. Start backend and try again.`);
        } else {
          const apiMessage = (error.response.data as { message?: string; error?: string })?.message;
          setError(apiMessage || t('auth.login_error'));
        }
      } else {
        setError(t('auth.login_error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label className="text-sm font-medium">{t('auth.email')}</label>
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">{t('auth.password')}</label>
        <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t('common.loading') : t('auth.login')}
      </Button>

      <p className="text-center text-sm text-slate-500">
        {t('auth.no_account')} <Link to="/register" className="text-primary hover:underline">{t('auth.register')}</Link>
      </p>
    </form>
  );
}
