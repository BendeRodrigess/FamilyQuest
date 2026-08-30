import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "PARENT" ? "/parent" : "/child");

  return (
    <AuthLayout
      title="Вхід"
      subtitle="Заходь у свій профіль — батьківський або дитячий."
      footer={
        <>
          Ще немає сім&apos;ї?{" "}
          <Link href="/register" className="font-bold text-[var(--color-brand-ink)]">
            Створити
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
