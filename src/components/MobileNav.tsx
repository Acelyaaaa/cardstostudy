"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  Menu,
  X,
  GraduationCap,
  LayoutDashboard,
  FileUp,
  BookOpen,
  Brain,
  MessageCircle,
  TrendingUp,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Upload", href: "/dashboard/upload", icon: FileUp },
  { label: "My Decks", href: "/dashboard/decks", icon: BookOpen },
  { label: "Study", href: "/dashboard/study", icon: Brain },
  { label: "AI Tutor", href: "/dashboard/tutor", icon: MessageCircle },
  { label: "Progress", href: "/dashboard/progress", icon: TrendingUp },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const { user } = useUser();

  const name = user?.firstName || "Student";
  const email = user?.primaryEmailAddress?.emailAddress || "";

  return (
    <>
      <header className="md:hidden flex items-center justify-between px-4 h-14 border-b border-gray-100 bg-white sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-700 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm text-gray-900">Cards to Study</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors duration-150"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setOpen(false)} />
          <nav className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100">
              <span className="font-semibold text-sm text-gray-900">Menu</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="text-gray-400 hover:text-gray-700 transition-colors duration-150"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 py-4 px-3 flex flex-col gap-0.5">
              {nav.map(({ label, href, icon: Icon }) => {
                const active = href === "/dashboard" ? path === "/dashboard" : path.startsWith(href);
                return (
                  <Link key={href} href={href} onClick={() => setOpen(false)}>
                    <span
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm",
                        active
                          ? "bg-violet-50 text-violet-700 font-medium"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <UserButton afterSignOutUrl="/" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                  <p className="text-xs text-gray-400 truncate">{email}</p>
                </div>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}