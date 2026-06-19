"use client";

import HeroSection from "@/components/landing/hero-section";
import MainBannersSection from "@/components/landing/main-banners-section";
import CommunitySection from "@/components/landing/community-section";
import AboutSection from "@/components/landing/about-section";
import FeaturesSection from "@/components/landing/features-section";
import TestimonialsSection from "@/components/landing/testimonials-section";
import PremiumFooter from "@/components/landing/premium-footer";
import FloatingButtons from "@/components/landing/floating-buttons";
import CartDrawer from "@/components/modals/cart-drawer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-bg text-text">
      <main className="flex-grow">
        <HeroSection />
        <MainBannersSection />
        <CommunitySection />
        <AboutSection />
        <FeaturesSection />
        <TestimonialsSection />
      </main>

      <PremiumFooter />
      <FloatingButtons />

      <CartDrawer />
    </div>
  );
}
