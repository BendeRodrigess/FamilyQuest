import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "PARENT" ? "/parent" : "/child");

  return (
    <AuthLayout
      title="Створити сім'ю"
      subtitle="Спочатку батьківський акаунт — дітей додаси наступним кроком."
      footer={
        <>
          Вже маєш акаунт?{" "}
          <Link href="/login" className="font-bold text-[var(--color-brand-ink)]">
            Увійти
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
