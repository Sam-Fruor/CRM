// src/app/(dashboard)/sales/resources/page.tsx
"use client";

import { useState } from "react";

// 📚 Hardcoded Knowledge Base Data (You can easily update this later or move to DB)
const RESOURCES = [
  {
    category: "🌍 Visa & Country Guidelines",
    items: [
      { title: "Croatia - Driver Requirements 2026", type: "PDF", date: "Updated Mar 2026", content: "Requires valid GCC license. Age limit: 25-50 years. Processing time is currently 4-6 weeks from document submission." },
      { title: "Romania - Visa Processing Steps", type: "Article", date: "Updated Jan 2026", content: "Step 1: Passport Scan. Step 2: Police Clearance. Step 3: Work Permit approval (takes 2 weeks). Step 4: Embassy Appointment." },
      { title: "Latvia - Mechanical Roles Only", type: "Alert", date: "Updated Feb 2026", content: "Currently, Latvia is only accepting applications for heavy machinery mechanics, NOT bus drivers. Please route bus drivers to Croatia." },
    ]
  },
  {
    category: "💰 Test Fees & Finance",
    items: [
      { title: "Standard Test Fee Schedule", type: "Spreadsheet", date: "Updated Mar 2026", content: "Bus Driver English Test: $50. Bus Driver Yard Test: $150. Trailer Driver Yard Test: $200. Re-test fee is 50% of original." },
      { title: "Refund Policy (Client Facing)", type: "Script", date: "Updated Dec 2025", content: "If a client fails the yard test 3 times, they are eligible for a partial refund of their initial processing fee minus $100 admin charge." },
    ]
  },
  {
    category: "📋 Sales Scripts & SOPs",
    items: [
      { title: "Initial Phone Call Script", type: "Script", date: "Updated Jan 2026", content: "Hello, am I speaking with [Name]? I am calling from Euro Driver regarding your application for [Country]. Do you have 2 minutes to verify your GCC experience?" },
      { title: "How to Handle 'Not Responding'", type: "SOP", date: "Updated Feb 2026", content: "If a client does not pick up 3 times, send the 'Final WhatsApp Warning' template. If no response in 48 hours, move to 'Not Interested'." },
    ]
  }
];

export default function ResourceCenterPage() {
  const [activeCategory, setActiveCategory] = useState(RESOURCES[0].category);
  const [searchQuery, setSearchQuery] = useState("");

  const activeData = RESOURCES.find(r => r.category === activeCategory);
  
  // Filter items based on search query
  const filteredItems = activeData?.items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* HEADER & SEARCH */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Resource Center</h1>
          <p className="text-slate-500 text-sm mt-1">Company guidelines, fee structures, and SOPs at your fingertips.</p>
        </div>
        <div className="w-full md:w-96 relative">
          <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
          <input 
            type="text" 
            placeholder="Search policies, fees, scripts..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 text-sm rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* LEFT SIDEBAR: CATEGORIES */}
        <div className="md:col-span-1 space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">Categories</h3>
          {RESOURCES.map((section) => (
            <button
              key={section.category}
              onClick={() => setActiveCategory(section.category)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                activeCategory === section.category 
                  ? "bg-blue-600 text-white shadow-md transform scale-105" 
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {section.category}
            </button>
          ))}
          
          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <h4 className="text-sm font-bold text-blue-900 mb-1">Need Help?</h4>
            <p className="text-xs text-blue-700 mb-3">Can't find the policy you're looking for?</p>
            <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm transition-colors">
              Contact Management
            </button>
          </div>
        </div>

        {/* RIGHT AREA: ARTICLES */}
        <div className="md:col-span-3 space-y-4">
          <div className="flex justify-between items-end border-b border-slate-200 pb-2 mb-4">
            <h2 className="text-lg font-bold text-slate-800">{activeCategory}</h2>
            <span className="text-xs font-bold text-slate-500">{filteredItems?.length} Resources</span>
          </div>

          {filteredItems?.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <p className="text-slate-500">No resources match your search.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredItems?.map((item, idx) => (
                <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition-colors group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.type === 'Alert' ? 'bg-red-100 text-red-700' :
                        item.type === 'Script' ? 'bg-purple-100 text-purple-700' :
                        item.type === 'Spreadsheet' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {item.type}
                      </span>
                      <h3 className="font-bold text-slate-800 text-base">{item.title}</h3>
                    </div>
                    <span className="text-xs font-medium text-slate-400">{item.date}</span>
                  </div>
                  
                  <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                    {item.content}
                  </p>
                  
                  <div className="mt-4 flex justify-end">
                    <button className="text-sm font-bold text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity">
                      Copy to Clipboard →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}