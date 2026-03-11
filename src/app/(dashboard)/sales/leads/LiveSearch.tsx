// src/app/(dashboard)/sales/leads/LiveSearch.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function LiveSearch({ 
  currentFilter, 
  initialSearch 
}: { 
  currentFilter: string; 
  initialSearch: string;
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  
  // Track if it's the first time rendering
  const isInitialMount = useRef(true);

  useEffect(() => {
    // 🛑 If it's the first time the page loads, do nothing!
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      // ✅ Now it ONLY fires when the user actually types a letter
      router.replace(`?filter=${currentFilter}&search=${encodeURIComponent(searchTerm)}`);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentFilter, router]);

  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search name or phone..."
        className="pl-4 pr-10 py-2.5 bg-white border border-slate-300 text-sm rounded-lg outline-none focus:ring-2 focus:ring-blue-500 shadow-sm w-64"
      />
      <span className="absolute right-3 top-2.5 text-slate-400">🔍</span>
    </div>
  );
}