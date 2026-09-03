'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/public/Navbar';
import { Hero } from '@/components/public/Hero';
import { CategorySection } from '@/components/public/CategorySection';
import { FeaturedEvents } from '@/components/public/FeaturedEvents';
import { UpcomingEvents } from '@/components/public/UpcomingEvents';
import { OrganizerCTA } from '@/components/public/OrganizerCTA';
import { Footer } from '@/components/public/Footer';
import { AuthModal } from '@/components/public/AuthModal';
import { useLanguage } from '@/hooks/useLanguage';
import { fetchPublicEvents, ApiEvent } from '@/lib/api';

export default function PublicHomepage() {
  const { lang, setLang } = useLanguage('id');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  
  // Real Search & Category Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [apiEvents, setApiEvents] = useState<ApiEvent[]>([]);
  const [apiCategories, setApiCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Public Events from API on initial load or parameter update
  useEffect(() => {
    async function loadPublicEvents() {
      setIsLoading(true);
      const data = await fetchPublicEvents({
        search: searchQuery,
        category: selectedCategory || undefined,
      });
      setApiEvents(data.events || []);
      setApiCategories(data.categories || []);
      setIsLoading(false);
    }
    loadPublicEvents();
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const authParam = params.get('auth');
      if (authParam === 'login' || authParam === 'register') {
        setAuthModalMode(authParam);
        setIsAuthModalOpen(true);
        // Clean up URL back to clean '/' without query params
        window.history.replaceState({}, '', '/');
      }
    }
  }, []);

  const handleOpenAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleSearchSubmit = (query: string) => {
    setSearchQuery(query);
    const element = document.getElementById('events');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased selection:bg-blue-500 selection:text-white flex flex-col justify-between overflow-x-hidden">
      <div>
        {/* Navigation Bar */}
        <Navbar
          onOpenAuthModal={handleOpenAuthModal}
          lang={lang}
          onLangChange={setLang}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
        />

        {/* Hero Interactive Carousel Section */}
        <Hero lang={lang} events={apiEvents} />

        {/* Categories Grid & Active Filter Bar */}
        <CategorySection
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          apiCategories={apiCategories}
          searchQuery={searchQuery}
          onClearFilters={clearFilters}
          lang={lang}
        />

        {/* Public Events Showcase */}
        <FeaturedEvents lang={lang} apiEvents={apiEvents} isLoading={isLoading} />

        {/* Only render secondary UpcomingEvents section if there are more than 4 events */}
        {apiEvents.length > 4 && (
          <UpcomingEvents lang={lang} apiEvents={apiEvents} isLoading={isLoading} />
        )}

        {/* Organizer CTA Banner */}
        <OrganizerCTA lang={lang} />
      </div>

      {/* Footer */}
      <Footer lang={lang} />

      {/* Auth Modal Popup */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}
