import React, { useState, useEffect } from "react";
import { ConfigProvider, App as AntApp, Spin } from "antd";
import SignIn from "./components/auth/SignIn";
import CRMApp from "./components/crm/CRMApp";
import "./App.css";

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

type View = "loading" | "signin" | "crm";

const App: React.FC = () => {
  const [view, setView] = useState<View>("loading");
  const [user, setUser] = useState<GoogleUser | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth")) window.history.replaceState({}, "", "/");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    fetch("/api/auth/status", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data.connected && data.user) {
          setUser(data.user);
          setView("crm");
        } else {
          setView("signin");
        }
      })
      .catch(() => setView("signin"))
      .finally(() => clearTimeout(timeout));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/google", { method: "DELETE" });
    setUser(null);
    setView("signin");
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1D9E75",
          colorSuccess: "#1D9E75",
          borderRadius: 8,
          borderRadiusLG: 12,
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        },
        components: {
          Layout: { siderBg: "#fff", headerBg: "#fff" },
          Menu: { itemBg: "#fff", activeBarBorderWidth: 0 },
        },
      }}
    >
      <AntApp>
        {view === "loading" && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "100vh",
            }}
          >
            <Spin size="large" />
          </div>
        )}
        {view === "signin" && <SignIn />}
        {view === "crm" && <CRMApp onLogout={handleLogout} user={user} />}
      </AntApp>
    </ConfigProvider>
  );
};

export default App;
