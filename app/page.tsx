import Link from "next/link";
import { LayoutDashboard, LogIn } from "lucide-react";
import { getAuthLinks, getCurrentUser, isAdmin, isWorkOSConfigured } from "./lib/auth";
import Workbench from "../components/workbench";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  const links = await getAuthLinks();

  if (!user) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <p className="eyebrow">Skill Architecture</p>
          <h1>{isWorkOSConfigured() ? "ログインしてください" : "WorkOS の設定待ちです"}</h1>
          <p>
            {isWorkOSConfigured()
              ? "WorkOS AuthKit の Google ログインでワークスペースに入ります。"
              : "WORKOS_API_KEY、WORKOS_CLIENT_ID、WORKOS_COOKIE_PASSWORD、NEXT_PUBLIC_WORKOS_REDIRECT_URI を Vercel に設定してください。"}
          </p>
          {isWorkOSConfigured() ? (
            <div className="login-actions">
              <Link className="primary-link" href={links.signIn}>
                <LogIn size={18} />
                ログイン
              </Link>
              <Link className="secondary-link" href={links.signUp}>
                新規登録
              </Link>
            </div>
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Skill Architecture</p>
          <h1>スキル構造マップ</h1>
        </div>
        <nav className="top-actions">
          <span className="user-pill">{user.isDemo ? "demo" : user.email}</span>
          {isAdmin(user) ? (
            <Link className="icon-link" href="/admin" title="管理者画面">
              <LayoutDashboard size={18} />
              管理
            </Link>
          ) : null}
          <Link className="icon-link" href="/logout">
            ログアウト
          </Link>
        </nav>
      </header>
      <Workbench />
    </main>
  );
}
