import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Вход — CMS ХБтекс" };

export default function AdminLoginPage() {
  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <h1>ХБтекс CMS</h1>
        <p>Вход для сотрудников (Supabase Auth)</p>
        <Suspense fallback={<p>Загрузка…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
