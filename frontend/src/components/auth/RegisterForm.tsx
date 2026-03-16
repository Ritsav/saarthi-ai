import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';
import { validateEmail, validatePassword } from '@/utils/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function RegisterForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [homePhone, setHomePhone] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      await register(email, password, name, {
        contact_number: contactNumber.trim() || undefined,
        home_phone: homePhone.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
        contact_email: contactEmail.trim() || undefined,
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          setError(`Cannot connect to backend API at ${apiUrl}. Start backend and try again.`);
        } else {
          const apiMessage = (error.response.data as { message?: string; error?: string })?.message;
          setError(apiMessage || t('auth.register_error'));
        }
      } else {
        setError(t('auth.register_error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label className="text-sm font-medium">{t('auth.name')}</label>
        <Input type="text" value={name} onChange={(event) => setName(event.target.value)} required />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">{t('auth.email')}</label>
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">{t('auth.password')}</label>
        <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">{t('auth.contact_number')}</label>
        <Input type="tel" value={contactNumber} onChange={(event) => setContactNumber(event.target.value)} />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">{t('auth.home_phone')}</label>
        <Input type="tel" value={homePhone} onChange={(event) => setHomePhone(event.target.value)} />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">{t('auth.contact_phone')}</label>
        <Input type="tel" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">{t('auth.contact_email')}</label>
        <Input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t('common.loading') : t('auth.register')}
      </Button>

      <p className="text-center text-sm text-slate-500">
        {t('auth.has_account')} <Link to="/login" className="text-primary hover:underline">{t('auth.login')}</Link>
      </p>
    </form>
  );
}
