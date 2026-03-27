"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, User, Plus } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <nav className="bottom-nav">
      <Link href="/dashboard" className={`nav-item ${isActive("/dashboard") ? "active" : ""}`} id="nav-home">
        <Home size={22} />
        <span>Home</span>
      </Link>

      <Link href="/complaints" className={`nav-item ${isActive("/complaints") ? "active" : ""}`} id="nav-complaints">
        <FileText size={22} />
        <span>Cases</span>
      </Link>

      <Link href="/complaint/new" className="nav-fab" id="nav-new-complaint">
        <Plus size={26} color="#050d1a" strokeWidth={3} />
      </Link>

      <Link href="/wallet" className={`nav-item ${isActive("/wallet") ? "active" : ""}`} id="nav-wallet">
        <span style={{ fontSize: "1.2rem" }}>🪙</span>
        <span>Wallet</span>
      </Link>

      <Link href="/profile" className={`nav-item ${isActive("/profile") ? "active" : ""}`} id="nav-profile">
        <User size={22} />
        <span>Profile</span>
      </Link>
    </nav>
  );
}
