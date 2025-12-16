"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth/auth-client";
import GoogleIcon from "@/public/google.svg";

const formSchema = z.object({
  email: z.email("Masukkan alamat email yang valid."),
  password: z.string().min(6, "Password harus minimal 6 karakter."),
  rememberMe: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: FormValues) => {
    await authClient.signIn.email(
      {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
        callbackURL: "/dashboard",
      },
      {
        onSuccess: () => {
          toast.success("Login berhasil!");
        },
        onError: (error) => {
          toast.error(error.error.message);
        },
      },
    );
  };

  const onGoogleSubmit = async () => {
    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: "/dashboard",
      },
      {
        onRequest: () => {
          setIsGoogleLoading(true);
        },
        onError: (error) => {
          toast.error(error.error.message);
          setIsGoogleLoading(false);
        },
      },
    );
  };

  return (
    <form
      className="space-y-6"
      id="login-form"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-form-email">Email</FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="email"
                id="login-form-email"
                placeholder="Masukkan alamat email Anda"
                type="email"
              />
              {fieldState.error ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-form-password">Password</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="current-password"
                  id="login-form-password"
                  placeholder="Masukkan password Anda"
                  type={showPassword ? "text" : "password"}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword(!showPassword)}
                    size="icon-xs"
                    type="button"
                    variant="ghost"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {fieldState.error ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <div className="flex items-center justify-between">
          <Controller
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={field.value}
                  id="login-form-remember"
                  onCheckedChange={field.onChange}
                />
                <FieldLabel
                  className="cursor-pointer font-normal text-foreground text-sm"
                  htmlFor="login-form-remember"
                >
                  Ingat Saya
                </FieldLabel>
              </div>
            )}
          />
          <Link className="text-primary text-sm hover:underline" href={"/"}>
            Lupa Kata Sandi?
          </Link>
        </div>
      </FieldGroup>

      <Button
        className="w-full"
        disabled={form.formState.isSubmitting}
        type="submit"
      >
        {form.formState.isSubmitting ? (
          <>
            <Spinner />
            Memuat...
          </>
        ) : (
          "Masuk"
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-border border-t" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-background px-2 text-muted-foreground">Atau</span>
        </div>
      </div>

      <Button
        className="flex w-full items-center justify-center gap-2"
        disabled={form.formState.isSubmitting || isGoogleLoading}
        onClick={onGoogleSubmit}
        type="button"
        variant="outline"
      >
        <GoogleIcon aria-label="Google logo" className="size-4" />
        Google
      </Button>

      <div className="text-center text-muted-foreground text-sm">
        Belum Punya Akun?{" "}
        <Link className="text-primary hover:underline" href="/register">
          Daftar Sekarang
        </Link>
      </div>
    </form>
  );
};

export default LoginForm;
