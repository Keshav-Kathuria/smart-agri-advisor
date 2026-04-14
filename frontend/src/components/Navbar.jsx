import React, { useEffect } from 'react';

const TABS = [
  { id: 'home',       label: 'Dashboard', icon: '⬡' },
  { id: 'fertilizer', label: 'Fertilizer Advisory', icon: '▸' },
  { id: 'yield',      label: 'Yield Prediction',      icon: '▸' },
  { id: 'disease',    label: 'Disease Detection',    icon: '▸' },
  { id: 'weather',    label: 'Weather Advisory',    icon: '▸' },
];

export default function Navbar({ activeTab, onTabChange }) {
  useEffect(() => {
    if (!document.getElementById('google-translate-script')) {
      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'hi,bn,te,mr,ta,ur,gu,kn,ml,pa,or,as,mai,kok,sd,ne,sa',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        );
      };

      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  function handleTab(id) {
    onTabChange(id);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar__logo" onClick={() => handleTab('home')}>
        <div className="sidebar__logo-mark">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
          </svg>
        </div>
        <div className="sidebar__logo-text">
          <span className="sidebar__brand">AgriSense</span>
          <span className="sidebar__tagline">AI Farming</span>
        </div>
      </div>

      <div className="sidebar__divider" />
      <div className="sidebar__section-label">Navigation</div>

      <nav className="sidebar__nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTab(tab.id)}
            className={`sidebar__item ${activeTab === tab.id ? 'sidebar__item--active' : ''}`}
          >
            <span className="sidebar__item-icon">{tab.icon}</span>
            <span className="sidebar__item-label">{tab.label}</span>
            {activeTab === tab.id && <span className="sidebar__item-dot" />}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="sidebar__bottom">
        <div className="sidebar__divider" />

        <div className="sidebar__section-label">Translate</div>
        <div id="google_translate_element" />

        <div className="sidebar__divider" />

        <div className="sidebar__info">
          <div className="sidebar__info-dot" />
          <div>
            <div className="sidebar__info-title">System Online</div>
            <div className="sidebar__info-sub">All models loaded</div>
          </div>
        </div>
        <div className="sidebar__version">v2.0.1</div>
      </div>
    </aside>
  );
}