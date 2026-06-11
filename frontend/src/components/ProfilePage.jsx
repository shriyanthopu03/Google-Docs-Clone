import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

function ProfilePage() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const userName = user?.name || user?.email || "User";
  const userEmail = user?.email || "No email available";

  return (
    <main className="dashboard-shell">
      <div className="dashboard-hero">
        <div className="dashboard-hero-card" style={{ display: "flex", justifyContent: "space-between", gap: "1.5rem" }}>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Profile</p>
            <h1 className="dashboard-title text-4xl font-bold mt-2">{userName}</h1>
            <p className="text-slate-500 mt-3">{userEmail}</p>
          </div>

          <button type="button" onClick={() => navigate("/dashboard")} className="primary-button" style={{ paddingInline: "1.1rem" }}>
            Back to dashboard
          </button>
        </div>
      </div>
    </main>
  );
}

export default ProfilePage;