// src/app/(dashboard)/hr/payments/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import PaymentApprovalClient from "./PaymentApprovalClient";
import LiveSearch from "@/components/LiveSearch";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic"; 

export default async function VerifyPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string, search?: string }>;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session || !["HR", "MANAGEMENT", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams.tab || "pending_sales";
  const searchQuery = resolvedSearchParams.search || ""; 

  const branchFilter = session.user.branch === "MASTER" 
    ? {} 
    : { branch: session.user.branch as any };

  // 🚀 Fetch ALL payment interactions. We removed the restrictive DB search filter 
  // so we can deeply search through complex JSON arrays and invoices below!
  const allPaymentLeads = await prisma.lead.findMany({
    where: {
      ...branchFilter,
      OR: [
        { testFeeVerifyStatus: { not: "Unsubmitted" } },
        { reTestFeeVerifyStatus: { not: "Unsubmitted" } },
        { saFeeVerifyStatus: { not: "Unsubmitted" } },
        { jobOfferVerifyStatus: { not: "Unsubmitted" } },
        { workPermitVerifyStatus: { not: "Unsubmitted" } },
        { insuranceVerifyStatus: { not: "Unsubmitted" } },
        { schoolFeesVerifyStatus: { not: "Unsubmitted" } },
        { flightTicketVerifyStatus: { not: "Unsubmitted" } },
        { otherPendingVerifyStatus: { not: "Unsubmitted" } },
        { otherPayments: { not: Prisma.JsonNull } }
      ]
    },
    orderBy: { updatedAt: "desc" }
  });

  const pendingSales: any[] = [];
  const historySales: any[] = [];
  const pendingOps: any[] = [];
  const historyOps: any[] = [];

  const getDocUrl = (docFiles: any, paymentName: string) => {
    if (!docFiles) return null;
    let filesObj = docFiles;
    if (typeof filesObj === 'string') {
      try { filesObj = JSON.parse(filesObj); } catch(e) { filesObj = {}; }
    }
    const filesArray = Array.isArray(filesObj) ? filesObj : Object.values(filesObj);
    if (filesArray.length === 0) return null;

    const cleanStr = (str: string) => String(str || "")
      .toLowerCase()
      .replace(/receipt|fee|payment|\.pdf|\.jpg|\.jpeg|\.png/g, "")
      .replace(/[^a-z0-9]/g, '');

    const target = cleanStr(paymentName);

    for (let i = filesArray.length - 1; i >= 0; i--) {
      const f = filesArray[i] as any;
      const docType = cleanStr(f?.documentType);
      const fileName = cleanStr(f?.name);
      if (target && (docType.includes(target) || fileName.includes(target))) {
        return f.url;
      }
    }

    for (let i = filesArray.length - 1; i >= 0; i--) {
      const f = filesArray[i] as any;
      if (String(f?.category).toLowerCase() === 'financial' || String(f?.documentType).toLowerCase().includes('receipt')) {
        return f.url;
      }
    }

    return (filesArray[filesArray.length - 1] as any).url;
  };

  allPaymentLeads.forEach(lead => {
    // =====================================
    // SALES PAYMENTS
    // =====================================
    if (lead.testFeeVerifyStatus === "Pending") pendingSales.push({ lead, type: "TEST", name: "Initial Test Fee", amount: lead.testFeesAmount, date: lead.paymentDate, status: "Pending", receiptUrl: getDocUrl(lead.documentFiles, "Initial Test") });
    else if (["Approved", "Rejected"].includes(lead.testFeeVerifyStatus)) historySales.push({ lead, type: "TEST", name: "Initial Test Fee", amount: lead.testFeesAmount, date: lead.paymentDate, status: lead.testFeeVerifyStatus, inv: lead.invoiceNumber, reason: lead.testFeeVerifyStatus === 'Approved' ? lead.testFeeApproveRemark : lead.testFeeRejectReason, receiptUrl: getDocUrl(lead.documentFiles, "Initial Test") });

    if (lead.reTestFeeVerifyStatus === "Pending") pendingSales.push({ lead, type: "RETEST", name: "Re-Test Fee", amount: lead.reTestFeesAmount, date: lead.reTestPaymentDate, status: "Pending", receiptUrl: getDocUrl(lead.documentFiles, "Re-Test") });
    else if (["Approved", "Rejected"].includes(lead.reTestFeeVerifyStatus)) historySales.push({ lead, type: "RETEST", name: "Re-Test Fee", amount: lead.reTestFeesAmount, date: lead.reTestPaymentDate, status: lead.reTestFeeVerifyStatus, inv: lead.reTestInvoiceNumber, reason: lead.reTestFeeVerifyStatus === 'Approved' ? lead.reTestFeeApproveRemark : lead.reTestFeeRejectReason, receiptUrl: getDocUrl(lead.documentFiles, "Re-Test") });

    if (lead.saFeeVerifyStatus === "Pending") pendingSales.push({ lead, type: "SA", name: "Service Agreement", amount: lead.serviceAgreementAmount, date: lead.serviceAgreementPaymentDate, status: "Pending", receiptUrl: getDocUrl(lead.documentFiles, "Service Agreement") });
    else if (["Approved", "Rejected"].includes(lead.saFeeVerifyStatus)) historySales.push({ lead, type: "SA", name: "Service Agreement", amount: lead.serviceAgreementAmount, date: lead.serviceAgreementPaymentDate, status: lead.saFeeVerifyStatus, inv: lead.serviceAgreementInvoice, reason: lead.saFeeVerifyStatus === 'Approved' ? lead.saFeeApproveRemark : lead.saFeeRejectReason, receiptUrl: getDocUrl(lead.documentFiles, "Service Agreement") });

    // =====================================
    // OPERATIONS PAYMENTS
    // =====================================
    if (lead.jobOfferVerifyStatus === "Pending") pendingOps.push({ lead, type: "JOB_OFFER", name: "Job Offer", amount: lead.jobOfferPending, date: lead.jobOfferPaymentDate, status: "Pending", receiptUrl: getDocUrl(lead.documentFiles, "Job Offer") });
    else if (["Approved", "Rejected"].includes(lead.jobOfferVerifyStatus)) historyOps.push({ lead, type: "JOB_OFFER", name: "Job Offer", amount: lead.jobOfferPending, date: lead.jobOfferPaymentDate, status: lead.jobOfferVerifyStatus, inv: lead.jobOfferInvoice, reason: lead.jobOfferVerifyStatus === 'Approved' ? lead.jobOfferApproveRemark : lead.jobOfferRejectReason, receiptUrl: getDocUrl(lead.documentFiles, "Job Offer") });

    if (lead.workPermitVerifyStatus === "Pending") pendingOps.push({ lead, type: "WORK_PERMIT", name: "Work Permit", amount: lead.workPermitPending, date: lead.workPermitPaymentDate, status: "Pending", receiptUrl: getDocUrl(lead.documentFiles, "Work Permit") });
    else if (["Approved", "Rejected"].includes(lead.workPermitVerifyStatus)) historyOps.push({ lead, type: "WORK_PERMIT", name: "Work Permit", amount: lead.workPermitPending, date: lead.workPermitPaymentDate, status: lead.workPermitVerifyStatus, inv: lead.workPermitInvoice, reason: lead.workPermitVerifyStatus === 'Approved' ? lead.workPermitApproveRemark : lead.workPermitRejectReason, receiptUrl: getDocUrl(lead.documentFiles, "Work Permit") });

    if (lead.insuranceVerifyStatus === "Pending") pendingOps.push({ lead, type: "INSURANCE", name: "Insurance", amount: lead.insurancePending, date: lead.insurancePaymentDate, status: "Pending", receiptUrl: getDocUrl(lead.documentFiles, "Insurance") });
    else if (["Approved", "Rejected"].includes(lead.insuranceVerifyStatus)) historyOps.push({ lead, type: "INSURANCE", name: "Insurance", amount: lead.insurancePending, date: lead.insurancePaymentDate, status: lead.insuranceVerifyStatus, inv: lead.insuranceInvoice, reason: lead.insuranceVerifyStatus === 'Approved' ? lead.insuranceApproveRemark : lead.insuranceRejectReason, receiptUrl: getDocUrl(lead.documentFiles, "Insurance") });

    if (lead.schoolFeesVerifyStatus === "Pending") pendingOps.push({ lead, type: "SCHOOL_FEES", name: "School Fees", amount: lead.schoolFeesPending, date: lead.schoolFeesPaymentDate, status: "Pending", receiptUrl: getDocUrl(lead.documentFiles, "School Fees") });
    else if (["Approved", "Rejected"].includes(lead.schoolFeesVerifyStatus)) historyOps.push({ lead, type: "SCHOOL_FEES", name: "School Fees", amount: lead.schoolFeesPending, date: lead.schoolFeesPaymentDate, status: lead.schoolFeesVerifyStatus, inv: lead.schoolFeesInvoice, reason: lead.schoolFeesVerifyStatus === 'Approved' ? lead.schoolFeesApproveRemark : lead.schoolFeesRejectReason, receiptUrl: getDocUrl(lead.documentFiles, "School Fees") });

    if (lead.flightTicketVerifyStatus === "Pending") pendingOps.push({ lead, type: "FLIGHT_TICKET", name: "Flight Ticket", amount: lead.flightTicketPending, date: lead.flightTicketPaymentDate, status: "Pending", receiptUrl: getDocUrl(lead.documentFiles, "Flight Ticket") });
    else if (["Approved", "Rejected"].includes(lead.flightTicketVerifyStatus)) historyOps.push({ lead, type: "FLIGHT_TICKET", name: "Flight Ticket", amount: lead.flightTicketPending, date: lead.flightTicketPaymentDate, status: lead.flightTicketVerifyStatus, inv: lead.flightTicketInvoice, reason: lead.flightTicketVerifyStatus === 'Approved' ? lead.flightTicketApproveRemark : lead.flightTicketRejectReason, receiptUrl: getDocUrl(lead.documentFiles, "Flight Ticket") });

    if (lead.otherPendingVerifyStatus === "Pending") pendingOps.push({ lead, type: "OTHER_OPS", name: "Other Ops", amount: lead.otherPending, date: lead.otherPendingPaymentDate, status: "Pending", receiptUrl: getDocUrl(lead.documentFiles, "Other Ops") });
    else if (["Approved", "Rejected"].includes(lead.otherPendingVerifyStatus)) historyOps.push({ lead, type: "OTHER_OPS", name: "Other Ops", amount: lead.otherPending, date: lead.otherPendingPaymentDate, status: lead.otherPendingVerifyStatus, inv: lead.otherPendingInvoice, reason: lead.otherPendingVerifyStatus === 'Approved' ? lead.otherPendingApproveRemark : lead.otherPendingRejectReason, receiptUrl: getDocUrl(lead.documentFiles, "Other Ops") });

    // =====================================
    // DYNAMIC / CUSTOM PAYMENTS (Pushed to Ops)
    // =====================================
    if (lead.otherPayments) {
      let customPayments: any[] = [];
      try {
        customPayments = Array.isArray(lead.otherPayments) ? lead.otherPayments : JSON.parse(lead.otherPayments as any);
      } catch (e) {}

      customPayments.forEach((p: any) => {
        const paymentName = p.name || "Custom";
        if (p.status === "Pending") {
          pendingOps.push({ lead, type: p.id, name: paymentName, amount: p.amount, date: p.date, status: "Pending", receiptUrl: getDocUrl(lead.documentFiles, paymentName) });
        } else if (p.status === "Approved" || p.status === "Rejected") {
          historyOps.push({ lead, type: p.id, name: paymentName, amount: p.amount, date: p.date, status: p.status, inv: p.invoice, reason: p.status === 'Approved' ? p.approveRemark : p.rejectReason, receiptUrl: getDocUrl(lead.documentFiles, paymentName) });
        }
      });
    }
  });

  const formatAmount = (amt: any) => (amt !== null && amt !== undefined && amt !== "") ? `${amt} AED` : null;
  const formatDate = (date: any) => date ? new Date(date).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  const getRenderList = () => {
    switch (activeTab) {
      case "pending_sales": return pendingSales;
      case "pending_ops": return pendingOps;
      case "history_sales": return historySales;
      case "history_ops": return historyOps;
      default: return pendingSales;
    }
  };

  const baseList = getRenderList();
  
  // 🚀 SMART DEEP SEARCH: Filters the arrays directly so it matches EVERY detail 
  let filteredList = baseList;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredList = baseList.filter(req => {
      const fullName = `${req.lead.givenName} ${req.lead.surname}`.toLowerCase();
      const leadId = req.lead.id.toLowerCase();
      const passport = (req.lead.passportNum || "").toLowerCase();
      const payName = (req.name || "").toLowerCase();
      const invoice = (req.inv || "").toLowerCase();
      const status = (req.status || "").toLowerCase();
      const amount = String(req.amount || "").toLowerCase();
      const remark = (req.reason || "").toLowerCase();

      return fullName.includes(q) || 
             leadId.includes(q) || 
             passport.includes(q) || 
             payName.includes(q) || 
             invoice.includes(q) || 
             status.includes(q) || 
             amount.includes(q) || 
             remark.includes(q);
    });
  }

  // 🚀 SORT BY NEWEST FIRST: Order the filtered list descending by payment date
  filteredList.sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    return timeB - timeA; // Descending
  });

  const isHistoryTab = activeTab.includes("history");

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      
      {/* 🚀 HEADER WITH LIVE SEARCH */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">💰 Payment Verification Center</h1>
          <p className="text-slate-500 text-sm mt-1">
            Review and approve payments submitted by Sales and Operations. Ensure all required receipts are available in the Document Vault before approving.
          </p>
        </div>
        <div className="shrink-0 w-full md:w-auto">
          <LiveSearch placeholder="Search name, ID, invoice, etc..." />
        </div>
      </div>

      {/* TOP LEVEL TABS (Sales vs Ops) */}
      <div className="flex gap-2 mb-4 bg-slate-100 p-1.5 rounded-lg w-fit">
        <Link 
          href={`?tab=pending_sales${searchQuery ? `&search=${searchQuery}` : ''}`} 
          className={`px-6 py-2.5 text-sm font-bold rounded-md transition-all ${
            activeTab.includes('sales') ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Sales Transactions
        </Link>
        <Link 
          href={`?tab=pending_ops${searchQuery ? `&search=${searchQuery}` : ''}`} 
          className={`px-6 py-2.5 text-sm font-bold rounded-md transition-all ${
            activeTab.includes('ops') ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Operations Transactions
        </Link>
      </div>

      {/* SUB TABS (Pending vs History) */}
      <div className="flex space-x-2 border-b border-slate-200 px-2">
        <Link 
          href={`?tab=pending_${activeTab.includes('sales') ? 'sales' : 'ops'}${searchQuery ? `&search=${searchQuery}` : ''}`} 
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            !isHistoryTab ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          ⏳ Pending Approval
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${!isHistoryTab ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
            {activeTab.includes('sales') ? pendingSales.length : pendingOps.length}
          </span>
        </Link>
        <Link 
          href={`?tab=history_${activeTab.includes('sales') ? 'sales' : 'ops'}${searchQuery ? `&search=${searchQuery}` : ''}`} 
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            isHistoryTab ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          📜 Verification History
        </Link>
      </div>

      {/* CONTENT AREA */}
      {!isHistoryTab ? (
        filteredList.length === 0 ? (
          <div className="bg-white p-16 rounded-xl border border-slate-200 text-center flex flex-col items-center shadow-sm animate-in fade-in">
            <span className="text-5xl mb-4">🎉</span>
            <h2 className="text-xl font-bold text-slate-700">All Clear!</h2>
            <p className="text-slate-500 mt-2">
              {searchQuery ? `No pending ${activeTab.includes('sales') ? 'Sales' : 'Operations'} payments match "${searchQuery}".` : `There are no pending ${activeTab.includes('sales') ? 'Sales' : 'Operations'} payments waiting for your approval right now.`}
            </p>
            {searchQuery && (
              <Link href={`?tab=${activeTab}`} className="mt-4 text-sm font-bold text-blue-600 hover:underline">
                Clear Search
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="p-4 font-semibold w-1/4">Candidate Info</th>
                  <th className="p-4 font-semibold">Payment Type</th>
                  <th className="p-4 font-semibold">Amount</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold text-center">Receipt</th>
                  <th className="p-4 font-semibold text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((req) => (
                  <tr key={`${req.lead.id}-${req.type}`} className="hover:bg-slate-50/50 transition-colors bg-white group">
                    <td className="p-4">
                      <p className="font-bold text-slate-800 text-sm">{req.lead.givenName} {req.lead.surname}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 mb-2 font-medium">ID: {req.lead.id.slice(-6).toUpperCase()} • {req.lead.branch.replace("BRANCH_", "")}</p>
                      <Link href={`/hr/${req.lead.id}?tab=${activeTab.includes('sales') ? 'documents' : 'hr'}`} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-md hover:bg-blue-100 transition-colors border border-blue-100 inline-block">
                        ↗️ View Full Profile
                      </Link>
                    </td>
                    
                    <td className="p-4">
                      <span className={`px-3 py-1.5 text-[11px] font-bold rounded-md border ${activeTab.includes('sales') ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {req.name}
                      </span>
                    </td>
                    
                    <td className="p-4 font-black text-slate-800 text-base">
                      {formatAmount(req.amount) || <span className="text-red-500 font-bold text-[10px] uppercase bg-red-50 px-2 py-1 rounded border border-red-200">Missing</span>}
                    </td>
                    
                    <td className="p-4 text-sm font-medium text-slate-600">
                      {formatDate(req.date) || <span className="text-red-500 font-bold text-[10px] uppercase bg-red-50 px-2 py-1 rounded border border-red-200">No Date</span>}
                    </td>

                    <td className="p-4 text-center align-middle">
                      {req.receiptUrl ? (
                        <a 
                          href={req.receiptUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-all shadow-sm transform hover:-translate-y-0.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          View Doc
                        </a>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 px-3 py-1.5 rounded-md" title="Could not locate file in Document Vault">
                          ⚠️ Not Found
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <PaymentApprovalClient leadId={req.lead.id} paymentType={req.type as any} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
          {filteredList.length === 0 ? (
             <div className="bg-white p-16 rounded-xl border border-slate-200 text-center flex flex-col items-center shadow-sm animate-in fade-in">
             <span className="text-5xl mb-4">🔍</span>
             <h2 className="text-xl font-bold text-slate-700">No History Found!</h2>
             <p className="text-slate-500 mt-2">
               {searchQuery ? `No matching history found for "${searchQuery}".` : `There are no processed payments in the history yet.`}
             </p>
             {searchQuery && (
               <Link href={`?tab=${activeTab}`} className="mt-4 text-sm font-bold text-blue-600 hover:underline">
                 Clear Search
               </Link>
             )}
           </div>
          ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="p-4 font-semibold w-1/4">Candidate Info</th>
                <th className="p-4 font-semibold">Payment Type</th>
                <th className="p-4 font-semibold">Amount & Invoice</th>
                <th className="p-4 font-semibold text-center">Receipt</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right w-1/4">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((req) => (
                <tr key={`${req.lead.id}-${req.type}`} className="hover:bg-slate-50 transition-colors bg-white">
                  <td className="p-4">
                    <p className="font-bold text-slate-800 text-sm">{req.lead.givenName} {req.lead.surname}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 mb-2 font-medium">ID: {req.lead.id.slice(-6).toUpperCase()}</p>
                    <Link href={`/hr/${req.lead.id}?tab=${activeTab.includes('sales') ? 'documents' : 'hr'}`} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-md hover:bg-blue-100 transition-colors border border-blue-100 inline-block">
                      ↗️ View Full Profile
                    </Link>
                  </td>
                  
                  <td className="p-4">
                    <span className="px-3 py-1 text-[11px] font-bold rounded-md bg-slate-100 text-slate-600 border border-slate-200">{req.name}</span>
                  </td>
                  
                  <td className="p-4">
                    <p className="font-bold text-slate-800 text-sm">{formatAmount(req.amount) || "No Amount"}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{req.inv ? `INV: ${req.inv}` : "No Invoice"}</p>
                  </td>

                  <td className="p-4 text-center align-middle">
                    {req.receiptUrl ? (
                      <a 
                        href={req.receiptUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        👁️ View Doc
                      </a>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">⚠️ N/A</span>
                    )}
                  </td>
                  
                  <td className="p-4">
                    <span className={`px-3 py-1.5 text-[10px] font-bold rounded-md uppercase tracking-wider border ${
                      req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  
                  <td className="p-4 text-right">
                    {req.reason ? (
                      <span className={`text-xs ${req.status === 'Rejected' ? 'text-red-600 font-medium' : 'text-slate-600'} whitespace-normal inline-block text-left`}>
                        {req.reason}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      )}
    </div>
  );
}