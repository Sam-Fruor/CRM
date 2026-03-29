// src/app/(dashboard)/sales/calendar/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useRouter } from 'next/navigation';

// --- ENTERPRISE ICONS ---
const Icons = {
  Calendar: () => <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Phone: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  ClipboardCheck: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  Car: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8M8 11h8M8 15h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" /></svg>,
  Loading: () => <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
};

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/sales/calendar-events') 
      .then(res => res.json())
      .then(data => {
        setEvents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load calendar events", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto h-[80vh] flex flex-col items-center justify-center animate-in fade-in duration-500">
        <Icons.Loading />
        <p className="mt-4 text-slate-500 font-bold tracking-wider uppercase text-xs">Syncing Calendar...</p>
      </div>
    );
  }

  return (
    // 🚀 SLIGHTLY STRETCHED WRAPPER: Increased height from 100vh-72px to 100vh-24px to give more room
    <div className="max-w-7xl mx-auto p-3 md:p-4 h-[calc(100vh-24px)] flex flex-col gap-4 relative overflow-hidden">
      
      {/* 🚀 COMPACTED ENTERPRISE HEADER */}
      <div className="bg-white p-3 md:px-5 md:py-3 rounded-xl shadow-sm border border-slate-200/60 relative flex flex-col md:flex-row md:justify-between md:items-center gap-3 shrink-0">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm">
            <Icons.Calendar />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">Sales Calendar</h1>
            <p className="text-slate-500 font-medium mt-1 text-[11px] hidden sm:block">
              Track upcoming follow-ups, slot bookings, and driving tests.
            </p>
          </div>
        </div>
        
        {/* 🎨 ULTRA-COMPACT LEGEND */}
        <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg shadow-inner flex flex-wrap gap-4 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
            <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center border border-indigo-200 shadow-sm"><Icons.Phone /></span> 
            Follow-ups
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
            <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm"><Icons.ClipboardCheck /></span> 
            Bookings
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
            <span className="w-5 h-5 rounded bg-amber-100 text-amber-600 flex items-center justify-center border border-amber-200 shadow-sm"><Icons.Car /></span> 
            Tests
          </div>
        </div>
      </div>

      {/* 📅 CALENDAR CONTAINER */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200/80 flex-1 min-h-0 animate-in fade-in duration-500 relative">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={events}
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            if (info.event.url) {
              router.push(info.event.url); // Next.js soft routing
            }
          }}
          height="100%" 
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
          }}
          dayMaxEvents={3} 
          buttonText={{
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day'
          }}
        />
      </div>

      {/* 🎨 TIGHT ENTERPRISE CSS OVERRIDES FOR FULLCALENDAR */}
      <style>{`
        /* Core Grid Styling */
        .fc {
          --fc-border-color: #f1f5f9; 
          --fc-neutral-bg-color: #f8fafc; 
          --fc-neutral-text-color: #64748b; 
          --fc-today-bg-color: #eef2ff; 
          font-family: inherit;
        }

        /* 🚀 THE FIX: KILL THE INNER SCROLLBAR COMPLETELY */
        .fc-scroller {
          overflow-y: hidden !important;
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .fc-scroller::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }
        .fc-scroller-liquid-absolute {
          overflow: hidden !important;
        }

        /* Toolbar Title - Made much smaller to save vertical space */
        .fc .fc-toolbar-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a; 
          letter-spacing: -0.01em;
        }

        .fc .fc-toolbar.fc-header-toolbar {
          margin-bottom: 0.85rem !important; /* Slightly increased to breathe */
        }

        /* Toolbar Buttons */
        .fc .fc-button-primary {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-weight: 700;
          font-size: 0.75rem;
          text-transform: capitalize;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          border-radius: 0.375rem;
          padding: 0.25rem 0.6rem;
          transition: all 0.2s;
        }
        
        .fc .fc-button-primary:not(:disabled):hover {
          background-color: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }
        
        .fc .fc-button-primary:not(:disabled):active,
        .fc .fc-button-primary:not(:disabled).fc-button-active {
          background-color: #eef2ff !important; 
          border-color: #c7d2fe !important; 
          color: #4f46e5 !important; 
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.02);
        }

        .fc .fc-button-group > .fc-button { border-radius: 0; }
        .fc .fc-button-group > .fc-button:first-child { border-top-left-radius: 0.375rem; border-bottom-left-radius: 0.375rem; }
        .fc .fc-button-group > .fc-button:last-child { border-top-right-radius: 0.375rem; border-bottom-right-radius: 0.375rem; }

        /* Header Cells (Mon, Tue, Wed) */
        .fc-theme-standard th {
          border: none !important;
          border-bottom: 1px solid #e2e8f0 !important;
          padding: 8px 0;
        }
        .fc-col-header-cell-cushion {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Day Cells */
        .fc-theme-standard td, .fc-theme-standard th { border-color: #f1f5f9; }
        .fc .fc-daygrid-day-number {
          font-size: 0.8rem;
          font-weight: 700;
          padding: 6px 8px;
          color: #475569;
        }
        
        .fc .fc-daygrid-day-top {
          flex-direction: row;
        }

        .fc .fc-day-today .fc-daygrid-day-number {
          color: #4f46e5; 
          background-color: #eef2ff; 
          border-radius: 9999px;
          margin: 4px;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Events */
        .fc-event {
          cursor: pointer;
          border-radius: 4px;
          font-weight: 700;
          font-size: 0.68rem;
          padding: 2px 5px;
          margin: 1.5px 3px;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          transition: transform 0.1s, box-shadow 0.1s;
          border-width: 1px;
        }
        
        .fc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
          opacity: 0.95;
        }

        .fc .fc-daygrid-more-link {
          font-size: 0.68rem;
          font-weight: 800;
          color: #475569;
          padding: 2px 5px;
          background: #f1f5f9;
          border-radius: 4px;
          margin-left: 3px;
          margin-top: 2px;
          transition: all 0.2s;
        }
        .fc .fc-daygrid-more-link:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        /* Responsive Fixes */
        @media (max-width: 768px) {
          .fc .fc-toolbar { flex-direction: column; gap: 0.5rem; }
          .fc .fc-toolbar-title { font-size: 1rem; }
        }
      `}</style>
    </div>
  );
}