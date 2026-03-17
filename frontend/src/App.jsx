import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';

// Pages
import HomePage       from './pages/HomePage';
import DiseasePage    from './pages/DiseasePage';
import WeatherPage    from './pages/WeatherPage';
import FertilizerPage from './pages/FertilizerPage';
import YieldPage      from './pages/YieldPage';

const PAGES = {
  home:       HomePage,
  disease:    DiseasePage,
  weather:    WeatherPage,
  fertilizer: FertilizerPage,
  yield:      YieldPage,
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  // Keep browser URL in sync (optional but nice — back/forward will work too)
  useEffect(() => {
    const slug = activeTab === 'home' ? '' : activeTab;
    window.history.pushState({}, '', slug ? `/${slug}` : '/');
  }, [activeTab]);

  // Restore tab from URL on first load
  useEffect(() => {
    const slug = window.location.pathname.replace('/', '').trim();
    if (slug && PAGES[slug]) setActiveTab(slug);
  }, []);

  function handleTabChange(id) {
    setActiveTab(id);
  }

  const PageComponent = PAGES[activeTab] || HomePage;

  return (
    <div className="app-layout">
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="app-main">
        {/* Key forces full unmount/remount on tab switch — resets all form state */}
        <PageComponent key={activeTab} onTabChange={handleTabChange} />
      </main>
    </div>
  );
}