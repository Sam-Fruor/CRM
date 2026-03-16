// src/components/LiveSearch.tsx
"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function LiveSearch({ 
  placeholder = "Search name, ID, or passport..." 
}: { 
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname(); 
  const searchParams = useSearchParams();
  
  // Automatically grab the initial search term from the URL (if any)
  const initialSearch = searchParams.get("search") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip the first render so it doesn't accidentally clear an existing URL search
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      // 🧠 SMART URL BUILDER: Grabs ALL existing URL parameters (like ?view=waiting or ?filter=leads)
      const params = new URLSearchParams(searchParams.toString());
      
      if (searchTerm) {
        params.set("search", searchTerm);
      } else {
        params.delete("search");
      }
      
      // Update the URL without reloading the page or jumping to the top!
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, pathname, router, searchParams]);

  return (
    <div className="relative flex items-center w-full md:w-auto">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 text-sm rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white shadow-sm w-full md:w-72 transition-all"
      />
      <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
      
      {/* 1-Click Clear Button (Only shows if typing) */}
      {searchTerm && (
        <button 
          onClick={() => setSearchTerm("")}
          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition-colors bg-slate-100 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
          title="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}