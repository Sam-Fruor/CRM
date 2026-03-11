"use client";

import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useRouter } from 'next/navigation';

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
      });
  }, []);

  if (loading) return <div className="p-10 text-center font-bold">Loading Calendar...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Sales Calendar</h1>
          <p className="text-slate-500 text-sm mt-1">Track your calls, bookings, and driving tests.</p>
        </div>
        
        {/* LEGEND */}
        <div className="flex gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-blue-600">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span> Follow-ups
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-3 h-3 bg-emerald-500 rounded-full"></span> Bookings
          </div>
          <div className="flex items-center gap-1.5 text-amber-600">
            <span className="w-3 h-3 bg-amber-500 rounded-full"></span> Tests
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
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
              router.push(info.event.url);
            }
          }}
          height="75vh"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: 'short'
          }}
          dayMaxEvents={true}
        />
      </div>

      {/* STYLES TO MAKE IT MATCH YOUR CLEAN UI */}
      <style jsx global>{`
        .fc { --fc-border-color: #e2e8f0; font-family: inherit; }
        .fc .fc-toolbar-title { font-size: 1.25rem; font-weight: 700; color: #1e293b; }
        .fc .fc-button-primary { background-color: #f8fafc; border-color: #e2e8f0; color: #475569; font-weight: 700; text-transform: capitalize; }
        .fc .fc-button-primary:hover { background-color: #f1f5f9; border-color: #cbd5e1; color: #1e293b; }
        .fc .fc-button-active { background-color: #3b82f6 !important; border-color: #3b82f6 !important; }
        .fc .fc-daygrid-day-number { font-size: 0.85rem; font-weight: 600; padding: 8px; color: #64748b; }
        .fc-event { cursor: pointer; padding: 2px 4px; border-radius: 4px; font-weight: 600; font-size: 11px; }
      `}</style>
    </div>
  );
}