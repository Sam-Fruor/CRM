// src/components/layout/Header.tsx
"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  getMyNotifications, 
  markNotificationAsRead, 
  clearNotification, 
  clearAllNotifications 
} from "@/app/actions/notificationActions";

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications on load
  useEffect(() => {
    if (session?.user?.id) {
      getMyNotifications().then(setNotifications);
    }
  }, [session]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = async (id: string, link: string | null) => {
    // Optimistically mark as read in the UI
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setIsOpen(false);
    
    await markNotificationAsRead(id);
    if (link) router.push(link);
  };

  const handleClearSingle = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // 👈 Stops the click from triggering the link routing
    
    // Instantly remove it from the screen
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    
    // Delete from database
    await clearNotification(id);
  };

  const handleClearAll = async () => {
    // Instantly wipe the screen
    setNotifications([]);
    
    // Delete all from database
    await clearAllNotifications();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm shrink-0 relative z-50">
      
      {/* LEFT SIDE: DYNAMIC DASHBOARD TITLE */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">
          {session?.user?.name ? `${session.user.name}'s Dashboard` : "Dashboard"}
        </h1>
      </div>

      {/* RIGHT SIDE: NOTIFICATIONS BELL */}
      <div className="flex items-center gap-4 relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-full transition-colors focus:outline-none"
        >
          <span className="text-xl">🔔</span>
          {/* Active Red Dot if Unread exists */}
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
              {unreadCount}
            </span>
          )}
        </button>

        {/* NOTIFICATION DROPDOWN MENU */}
        {isOpen && (
          <div className="absolute top-12 right-0 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2">
            
            <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-blue-600 font-semibold">{unreadCount} New</span>
                {notifications.length > 0 && (
                  <button 
                    onClick={handleClearAll}
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-red-600 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  No notifications yet.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {notifications.map((notif) => (
                    <li 
                      key={notif.id} 
                      onClick={() => handleNotificationClick(notif.id, notif.link)}
                      className={`relative group p-4 hover:bg-slate-50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
                    >
                      {/* 👇 THE HOVER "X" BUTTON */}
                      <button 
                        onClick={(e) => handleClearSingle(e, notif.id)}
                        className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Clear notification"
                      >
                        ✕
                      </button>

                      <div className="flex items-start gap-3 pr-4">
                        <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${!notif.isRead ? 'bg-blue-600' : 'bg-transparent'}`} />
                        <div>
                          <p className={`text-sm pr-2 ${!notif.isRead ? 'font-bold text-slate-800' : 'font-semibold text-slate-600'}`}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

    </header>
  );
}