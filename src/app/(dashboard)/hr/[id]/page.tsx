import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import HRDetailsForm from "./HRDetailsForm"; // 👈 Updated Import
import DocumentVault from "@/components/DocumentVault";
import ActivityTimeline from "@/components/ActivityTimeline";

export default async function HRFileView({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await getServerSession(authOptions);
  if (!session || !["HR", "MANAGEMENT", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams.tab || "details";

  const lead = await prisma.lead.findUnique({
    where: { id: resolvedParams.id },
    include: {
      activities: {
        orderBy: { createdAt: "desc" },
        include: { user: true }
      },
      // 👇 ADD THIS: Fetch the testing history for the HR page!
      testEvaluations: {
        orderBy: { createdAt: "desc" } 
      }
    }
  });

  if (!lead) notFound();

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      
      {/* 1. HEADER */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-800">{lead.givenName} {lead.surname}</h1>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-full">
              ID: {lead.id.slice(-6).toUpperCase()}
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Category: <span className="text-slate-700 font-bold">{lead.category}</span> | Country: <span className="text-slate-700 font-bold">{lead.countryPreferred}</span>
          </p>
        </div>
        
        {/* 👇 NEW: Button group with Edit Lead and Back to Queue */}
        <div className="flex items-center gap-3">
          <Link 
            href={`/hr/${lead.id}/edit`} 
            className="px-5 py-2.5 rounded-lg font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-2"
          >
            ✏️ Edit Lead
          </Link>
          <Link 
            href="/hr/verification" 
            className="px-5 py-2.5 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Back to Queue
          </Link>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex space-x-2 border-b border-slate-200 px-2">
        <Link 
          href={`/hr/${lead.id}?tab=details`}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'details' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          📋 HR Details & Financials {/* 👈 Updated Text */}
        </Link>
        <Link 
          href={`/hr/${lead.id}?tab=documents`}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'documents' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          🗂️ Document Vault
          {lead.documentFiles && Object.keys(lead.documentFiles).length > 0 && (
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">
              {Object.keys(lead.documentFiles).length}
            </span>
          )}
        </Link>
      </div>

      {/* 3. DYNAMIC CONTENT AREA */}
      <div className="mt-6">
        {activeTab === "details" ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <HRDetailsForm lead={lead} /> {/* 👈 Updated Component */}
              </div>
              <div className="lg:col-span-1">
                <div className="sticky top-6">
                  <ActivityTimeline activities={lead.activities} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <DocumentVault leadId={lead.id} existingDocs={lead.documentFiles} />
          </div>
        )}
      </div>

    </div>
  );
}