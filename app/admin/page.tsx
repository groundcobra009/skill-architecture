import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, isAdmin, isWorkOSConfigured } from "../lib/auth";
import AdminDashboard from "../../components/admin-dashboard";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (isWorkOSConfigured() && !user) redirect("/login");

  if (!isAdmin(user)) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <p className="eyebrow">Admin</p>
          <h1>権限がありません</h1>
          <p>管理者メールは `ADMIN_EMAILS` で設定します。</p>
          <Link className="secondary-link" href="/">
            戻る
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>利用状況</h1>
        </div>
        <Link className="icon-link" href="/">
          <ArrowLeft size={18} />
          ワークスペース
        </Link>
      </header>
      <AdminDashboard />
    </main>
  );
}
