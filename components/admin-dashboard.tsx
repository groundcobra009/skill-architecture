"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

type Overview = {
  totals: { users: number; events: number; diagrams: number };
  users: Array<{ _id: string; email: string; name: string; lastSeenAt: number; useCount: number }>;
  events: Array<{ _id: string; email: string; name: string; action: string; detail: string; at: number }>;
  diagrams: Array<{ _id: string; title: string; sourceName: string; ownerEmail: string; updatedAt: number }>;
};

function fmt(value: number) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/overview", { cache: "no-store" });
    if (!res.ok) {
      setError("管理データを取得できませんでした。");
      setLoading(false);
      return;
    }
    const json = await res.json();
    setOverview(json.overview);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const activeUsers = useMemo(() => overview?.users.slice(0, 12) ?? [], [overview]);

  return (
    <section className="admin-grid">
      <div className="admin-summary">
        <div className="metric">
          <span>ユーザー</span>
          <strong>{overview?.totals.users ?? 0}</strong>
        </div>
        <div className="metric">
          <span>利用イベント</span>
          <strong>{overview?.totals.events ?? 0}</strong>
        </div>
        <div className="metric">
          <span>図</span>
          <strong>{overview?.totals.diagrams ?? 0}</strong>
        </div>
        <button className="ghost-button" onClick={load} disabled={loading}>
          <RefreshCw size={16} />
          更新
        </button>
      </div>

      {error ? <p className="error-line">{error}</p> : null}

      <div className="table-panel wide">
        <h2>最近使ったユーザー</h2>
        <table>
          <thead>
            <tr>
              <th>ユーザー</th>
              <th>回数</th>
              <th>最終利用</th>
            </tr>
          </thead>
          <tbody>
            {activeUsers.map((user) => (
              <tr key={user._id}>
                <td>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </td>
                <td>{user.useCount}</td>
                <td>{fmt(user.lastSeenAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-panel">
        <h2>最近の操作</h2>
        <table>
          <tbody>
            {(overview?.events ?? []).slice(0, 20).map((event) => (
              <tr key={event._id}>
                <td>
                  <strong>{event.action}</strong>
                  <span>{event.email}</span>
                </td>
                <td>{event.detail}</td>
                <td>{fmt(event.at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-panel">
        <h2>更新された図</h2>
        <table>
          <tbody>
            {(overview?.diagrams ?? []).slice(0, 20).map((diagram) => (
              <tr key={diagram._id}>
                <td>
                  <strong>{diagram.title}</strong>
                  <span>{diagram.sourceName}</span>
                </td>
                <td>{diagram.ownerEmail}</td>
                <td>{fmt(diagram.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
