"use client";

import { useContext, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./admin.css";

import AuthProvider, { AuthContext } from "./AuthProvider";
import LoginAdmin from "@/Components/Dashboard/LoginAdmin/LoginAdmin";
import Navbar from "@/Layout/Dashboard/Navbar/Navbar";
import AdminFooter from "@/Layout/Dashboard/Footer/Footer";
import Sidebar from "@/Layout/Dashboard/Sidebar/Sidebar";
import BrandLoader from "@/Components/Shared/BrandLoader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const { token, loading } = useContext(AuthContext);
  const [navOpen, setNavOpen] = useState(false);

  if (loading) {
    return <BrandLoader variant="admin" label="Restoring your session" />;
  }

  if (!token) return <LoginAdmin />;

  return (
    <div className="admin-root flex h-screen overflow-hidden">
      <Sidebar isOpen={navOpen} onClose={() => setNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onMenuToggle={() => setNavOpen((v) => !v)} />

        {/* The only scrolling region, so the chrome stays put. */}
        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6">
          <div className="mx-auto w-full max-w-[1360px]">
            {children}
            <AdminFooter />
          </div>
        </main>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3200}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="dark"
        toastStyle={{
          background: "#16132a",
          color: "#ece9f8",
          border: "1px solid rgba(124,92,255,.28)",
          borderRadius: "12px",
          fontSize: "0.86rem",
        }}
      />
    </div>
  );
}
