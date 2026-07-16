import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Lock, Route as RouteIcon, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { USE_MOCK_API } from '@/api/client';
// API URL
const API_URL = import.meta.env.VITE_API_URL + '/login';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
  setServerError(null);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        username: values.username,
        password: values.password,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.message ||
        data?.error ||
        'Invalid username or password.'
      );
    }

    // Change these property names according to your API response
    const token =
      data?.token ||
      data?.accessToken ||
      data?.access_token;

    if (token) {
      localStorage.setItem('authToken', token);
    }

    // Optionally save the logged-in user
    if (data?.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    const from =
      (location.state as { from?: string } | null)?.from || '/';

    navigate(from, { replace: true });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : 'Unable to sign in. Please try again.';

    setServerError(message);
  }
};

  return (
    <Card className="w-full max-w-sm border-0 shadow-none sm:border sm:shadow-card">
      <CardHeader className="space-y-1">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground lg:hidden">
          <RouteIcon className="h-5 w-5" />
        </div>
        <CardTitle className="text-lg">Sign in to HRIS</CardTitle>
        <CardDescription>National Highway Authority &middot; ETTM Department</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="username" autoComplete="username" className="pl-8" {...register('username')} />
            </div>
            {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" autoComplete="current-password" className="pl-8" {...register('password')} />
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          {serverError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{serverError}</p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </Button>

          {USE_MOCK_API && (
            <p className="rounded-md bg-secondary px-3 py-2 text-center text-xs text-muted-foreground">
              Mock mode demo credentials — username <span className="font-medium text-foreground">admin</span>,
              password <span className="font-medium text-foreground">admin123</span>
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
