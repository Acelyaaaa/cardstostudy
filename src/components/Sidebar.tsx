"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileUp,
  BookOpen,
  Brain,
  MessageCircle,
  TrendingUp,
  Settings,
  GraduationCap,
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

export default function Sidebar() {
  const path = usePathname();
  const { user } = useUser();

  const name = user?.firstName || user?.username || "Student";
  const email = user?.primaryEmailAddress?.emailAddress || "";

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-gray-100 bg-white h-screen sticky top-0 z-30">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-5 h-14 border-b border-gray-100">
        <div className="w-7 h-7 rounded-lg bg-violet-700 flex items-center justify-center">
          <GraduationCap className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm tracking-tight">Cards to Study</span>
      </Link>

      <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = href === "/dashboard" ? path === "/dashboard" : path.startsWith(href);
          return (
            <Link key={href} href={href}>
              <span
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 relative",
                  active
                    ? "bg-violet-50 text-violet-700 font-medium"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
                {active && (
                  <motion.span
                    layoutId="sidebar-pill"
                    className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-violet-600"
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  />
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <UserButton afterSignOutUrl="/" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
            <p className="text-xs text-gray-400 truncate">{email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}