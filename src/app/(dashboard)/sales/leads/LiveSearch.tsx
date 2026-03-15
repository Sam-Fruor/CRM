"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function LiveSearch({ 
  currentFilter, 
  initialSearch 
}: { 
  currentFilter: string; 
  initialSearch: string;
}) {
  const router = useRouter();
  const pathname = usePathname(); // 👈 Grab the exact current path
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      // 👈 Use pathname to build the absolute route, and stop page jumping!
      router.replace(
        `${pathname}?filter=${currentFilter}&search=${encodeURIComponent(searchTerm)}`, 
        { scroll: false }
      );
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentFilter, pathname, router]);

  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search name, phone, or ID..."
        className="pl-4 pr-10 py-2.5 bg-white border border-slate-300 text-sm rounded-lg outline-none focus:ring-2 focus:ring-blue-500 shadow-sm w-64"
      />
      <span className="absolute right-3 top-2.5 text-slate-400">🔍</span>
    </div>
  );
}