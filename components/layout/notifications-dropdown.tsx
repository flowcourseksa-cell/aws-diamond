"use client";

import { useState, useEffect, useRef } from "react";
import { IconBell, IconCheck, IconTrash, IconX } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Fetch latest 10 notifications
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data && !error) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Polling every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async () => {
    if (unreadCount === 0) return;
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", session.user.id)
      .eq("is_read", false);
    
    setUnreadCount(0);
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const supabase = createClient();
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications(notifications.filter(n => n.id !== id));
    // refresh count
    fetchNotifications();
  };

  const deleteAll = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("notifications").delete().eq("user_id", session.user.id);
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleToggle = () => {
    if (!isOpen) markAsRead();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        title="الإشعارات"
        className="relative flex h-9.5 w-9.5 items-center justify-center rounded-[10px] border border-border bg-card text-text transition-transform duration-200 hover:-translate-y-0.5"
        aria-label="الإشعارات"
      >
        <IconBell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-red text-[10px] font-bold text-white shadow-sm border-2 border-card">
            {unreadCount > 9 ? "+9" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-2xl z-50 overflow-hidden fade-in" dir="rtl">
          <div className="flex items-center justify-between border-b border-border p-4 bg-bg">
            <h3 className="font-black text-text flex items-center gap-2">
              <IconBell size={18} className="text-primary" /> الإشعارات
            </h3>
            {notifications.length > 0 && (
              <button 
                onClick={deleteAll}
                className="text-xs font-bold text-accent-red hover:underline flex items-center gap-1"
              >
                <IconTrash size={14} /> حذف الكل
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-sm font-bold flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center mb-2">
                  <IconCheck size={32} className="text-text-muted opacity-50" />
                </div>
                لا توجد إشعارات حالياً
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`relative p-3 rounded-xl border transition-colors ${notif.is_read ? 'bg-bg/50 border-transparent' : 'bg-primary/5 border-primary/10'}`}
                  >
                    <button 
                      onClick={(e) => deleteNotification(notif.id, e)}
                      className="absolute top-2 left-2 p-1 text-text-muted hover:text-accent-red rounded-md hover:bg-red-50 transition-colors"
                      title="حذف الإشعار"
                    >
                      <IconX size={14} />
                    </button>
                    <div className="flex items-start gap-3 pl-6">
                      <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        notif.type === 'success' ? 'bg-accent-teal/10 text-accent-teal' :
                        notif.type === 'error' || notif.type === 'rejected' ? 'bg-accent-red/10 text-accent-red' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {notif.type === 'success' ? <IconCheck size={16} /> : <IconBell size={16} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-text leading-tight mb-1">{notif.title}</h4>
                        <p className="text-xs font-medium text-text-muted leading-relaxed">{notif.message}</p>
                        <span className="text-[10px] text-text-muted/60 font-semibold mt-2 block">
                          {new Date(notif.created_at).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
