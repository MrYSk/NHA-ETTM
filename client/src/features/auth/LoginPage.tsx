import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Loader2,
  Lock,
  Route as RouteIcon,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  username: z
    .string()
    .min(1, 'Office email is required')
    .email('Enter a valid office email address'),

  password: z
    .string()
    .min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [serverError, setServerError] =
    React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),

    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (
    values: FormValues,
  ) => {
    setServerError(null);

    try {
      /*
       * The field remains named "username" so it continues
       * working with useAuth and auth.service.ts.
       *
       * auth.service.ts converts this value to "email"
       * before sending it to the office backend.
       */
      await login(
        values.username.trim(),
        values.password,
      );

      const destination =
        (
          location.state as {
            from?: string;
          } | null
        )?.from || '/';

      navigate(destination, {
        replace: true,
      });
    } catch (error) {
      console.error('Login failed:', error);

      const message =
        (
          error as {
            message?: string;
          }
        )?.message ||
        'Unable to sign in. Please try again.';

      setServerError(message);
    }
  };

  return (
    <Card className="w-full max-w-sm border-0 shadow-none sm:border sm:shadow-card">
      <CardHeader className="space-y-1">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground lg:hidden">
          <RouteIcon className="h-5 w-5" />
        </div>

        <CardTitle className="text-lg">
          Sign in to HRIS
        </CardTitle>

        <CardDescription>
          National Highway Authority &middot; ETTM Department
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="username">
              Office email
            </Label>

            <div className="relative">
              <User className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="username"
                type="email"
                autoComplete="email"
                placeholder="name@nha.gov.pk"
                className="pl-8"
                disabled={isSubmitting}
                {...register('username')}
              />
            </div>

            {errors.username && (
              <p className="text-xs text-destructive">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">
              Password
            </Label>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className="pl-8"
                disabled={isSubmitting}
                {...register('password')}
              />
            </div>

            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            {isSubmitting
              ? 'Signing in...'
              : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}