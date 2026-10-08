"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn, UserRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api/client";
import { useAuthHydration, useAuthStore } from "@/stores/auth-store";

const LoginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type LoginValues = z.infer<typeof LoginSchema>;

/** Only allow same-origin relative paths to avoid open redirects. */
const safeRedirect = (path: string | null) =>
  path && path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";

export function LoginForm() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const loginAsGuest = useAuthStore((s) => s.loginAsGuest);
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthHydration();
  const next = safeRedirect(useSearchParams().get("next"));
  const [guestLoading, setGuestLoading] = useState(false);

  // Navigate once a session exists (after login, or when an authenticated user opens /login).
  useEffect(() => {
    if (hydrated && token) router.replace(next);
  }, [hydrated, token, next, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "recruiter@example.com", password: "" },
  });

  const onSubmit = async ({ email, password }: LoginValues) => {
    try {
      await login(email, password);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const onGuest = async () => {
    setGuestLoading(true);
    try {
      await loginAsGuest();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      // cacheComponents keeps /login mounted while hidden, so reset or it's still spinning after logout.
      setGuestLoading(false);
    }
  };

  const busy = isSubmitting || guestLoading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" autoComplete="email" className="h-10" aria-invalid={!!errors.email} {...register("email")} />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-10"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
        <Button type="submit" size="lg" className="h-10 w-full" disabled={busy}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : <LogIn />}
          Login
        </Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <Button type="button" variant="outline" size="lg" className="h-10 w-full" onClick={onGuest} disabled={busy}>
          {guestLoading ? <Loader2 className="animate-spin" /> : <UserRound />}
          Continue as Guest
        </Button>
      </FieldGroup>
    </form>
  );
}
