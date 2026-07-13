"use client";

import React from "react";
import { IconDownload, IconShare } from "@tabler/icons-react";

export default function VerifyClientButtons({ certId }: { certId: string }) {
  const handleShare = async () => {
    try {
      const shareUrl = window.location.href;
      if (navigator.share) {
        await navigator.share({
          title: 'شهادة إتمام دورة',
          text: `شاهد شهادة اجتيازي للدورة بنجاح على منصة الأوس الماسية!`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("تم نسخ رابط الشهادة بنجاح للمشاركة!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "center", width: "100%", maxWidth: "500px" }}>
      <a 
        href={`/api/certificates/generate?id=${certId}`}
        target="_blank"
        style={{
          display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px",
          backgroundColor: "#C5A059", color: "white", fontWeight: "bold",
          borderRadius: "12px", textDecoration: "none",
          boxShadow: "0 4px 6px rgba(197, 160, 89, 0.2)"
        }}
      >
        <IconDownload size={20} />
        تحميل الشهادة (PDF)
      </a>
      <button 
        onClick={handleShare}
        style={{
          display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px",
          backgroundColor: "white", color: "#1A2B4C", fontWeight: "bold",
          border: "1px solid #cbd5e1", borderRadius: "12px", cursor: "pointer",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
        }}
      >
        <IconShare size={20} />
        مشاركة الرابط
      </button>
    </div>
  );
}
