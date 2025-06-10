"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className={`text-white px-3 py-2 rounded-md text-sm font-medium ${
                pathname === "/" ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              Weather
            </Link>
            <Link
              href="/records"
              className={`text-white px-3 py-2 rounded-md text-sm font-medium ml-4 ${
                pathname === "/records" ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              Records
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
