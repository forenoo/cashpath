import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/auth/auth";
import RegisterForm from "./_components/register-form";

export const metadata: Metadata = {
  title: "Daftar Akun Baru",
};

const RegisterPage = async () => {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="h-screen w-full">
      <div className="flex h-svh w-full items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-none p-0">
          <CardContent className="space-y-6 p-0">
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <Image alt="Logo" height={40} src="/logo.svg" width={40} />
              </div>
              <div className="space-y-2 text-center">
                <h1 className="font-medium text-3xl text-foreground">
                  Buat Akun Baru
                </h1>
                <p className="text-muted-foreground text-sm">
                  Daftarkan identitas Anda untuk memulai.
                </p>
              </div>
            </div>
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default RegisterPage;
