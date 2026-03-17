import React, { useEffect, useRef } from 'react';
import anime from 'animejs';

const MODULES = [
  {
    id: 'fertilizer',
    icon: '🧪',
    name: 'Fertilizer Recommendation',
    desc: 'AI-driven nutrient guidance based on soil health data and crop-specific requirements',
    live: true,
    color: '#edf7e0',
  },
  {
    id: 'yield',
    icon: '📊',
    name: 'Yield Prediction',
    desc: 'Regression-based ML model forecasting harvest output using rainfall, temperature, and land area',
    live: true,
    color: '#f3edf8',
  },
  {
    id: 'disease',
    icon: '🔬',
    name: 'Disease Detection',
    desc: 'Upload a crop leaf image to detect diseases and receive treatment recommendations',
    live: false,
    color: '#f5f0e8',
  },
  {
    id: 'weather',
    icon: '🌤',
    name: 'Weather-Based Advisory',
    desc: 'Real-time weather insights with region-specific farming recommendations',
    live: false,
    color: '#e8f4fd',
  },
];

const STATS = [
  { num: '4', label: 'AI Models Deployed' },
  { num: '20+', label: 'Crops Supported' },
  { num: 'Live', label: 'Weather Integration' },
  { num: 'No', label: 'Signup Needed' },
];

const CROP_IMAGES = [
  "https://wallpaperaccess.com/full/1598227.jpg", 
  "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=400&h=300",
  "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=400&h=300",
  "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=400&h=300",
  "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=400&h=300",
  "https://images.unsplash.com/photo-1590682680695-43b964a3ae17?auto=format&fit=crop&q=80&w=400&h=300"
];

// Pipeline diagram data — one row per module
const PIPELINES = [
  {
    id: 'fertilizer',
    icon: '🧪',
    steps: ['Soil NPK Data', 'Fertilizer ML Model', 'Nutrient Recommendation'],
    color: '#6abf69',
  },
  {
    id: 'yield',
    icon: '📊',
    steps: ['Farm Parameters', 'XGBoost Regressor Model', 'Yield Forecast'],
    color: '#9c7fd4',
  },
  {
    id: 'disease',
    icon: '🔬',
    steps: ['Leaf Image Upload', 'CNN Classifier', 'Disease + Treatment'],
    color: '#d4a057',
  },
  {
    id: 'weather',
    icon: '🌤',
    steps: ['Location Data', 'Weather API + ML', 'Crop-Specific Advisory'],
    color: '#57b8d4',
  },
];

export default function HomePage({ onTabChange }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target.classList.contains('hp-how')) {
            anime({
              targets: '.hp-how__step',
              translateY: [60, 0],
              opacity: [0, 1],
              delay: anime.stagger(150),
              duration: 1000,
              easing: 'easeOutElastic(1, .8)'
            });
            obs.unobserve(entry.target);
          } else if (entry.target.classList.contains('hp-detail-grid')) {
            anime({
              targets: '.hp-detail-card',
              translateY: [50, 0],
              opacity: [0, 1],
              delay: anime.stagger(150),
              duration: 800,
              easing: 'easeOutQuart'
            });
            obs.unobserve(entry.target);
          } else if (entry.target.classList.contains('hp-cta')) {
            anime({
              targets: entry.target,
              scale: [0.95, 1],
              opacity: [0, 1],
              duration: 800,
              easing: 'easeOutQuart'
            });
            obs.unobserve(entry.target);
          } else if (entry.target.classList.contains('hp-pipeline')) {
            anime({
              targets: '.hp-pipeline__row',
              translateX: [-40, 0],
              opacity: [0, 1],
              delay: anime.stagger(120),
              duration: 700,
              easing: 'easeOutQuart'
            });
            obs.unobserve(entry.target);
          }
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.hp-how__step').forEach(el => el.style.opacity = '0');
    document.querySelectorAll('.hp-detail-card').forEach(el => el.style.opacity = '0');
    document.querySelectorAll('.hp-pipeline__row').forEach(el => el.style.opacity = '0');

    if (containerRef.current) {
      const cta = containerRef.current.querySelector('.hp-cta');
      if (cta) { cta.style.opacity = '0'; observer.observe(cta); }

      const how = containerRef.current.querySelector('.hp-how');
      if (how) observer.observe(how);

      const grid = containerRef.current.querySelector('.hp-detail-grid');
      if (grid) observer.observe(grid);

      const pipeline = containerRef.current.querySelector('.hp-pipeline');
      if (pipeline) observer.observe(pipeline);
    }

    return () => observer.disconnect();
  }, []);

  function go(id) {
    onTabChange(id);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  return (
    <div ref={containerRef}>
      {/* ════════ HERO ════════ */}
      <div className="hp-hero">
        <div className="hp-orb hp-orb--1" />
        <div className="hp-orb hp-orb--2" />
        <div className="hp-orb hp-orb--3" />
        <div className="hp-orb hp-orb--4" />
        <div className="hp-grid-overlay" />
        <div className="hp-particles">
          {[...Array(8)].map((_, i) => <div key={i} className="hp-particle" />)}
        </div>

        <div className="hp-hero-inner">
          <div className="hp-badge">🛰 AI-Powered · Smart Farming</div>

          <h1 className="hp-title">
            Grow Smarter with<br />
            <em>Data-Driven</em> Farming
          </h1>

          <p className="hp-subtitle">
            Precision recommendations — from soil nutrients to harvest forecasts —
            powered by AI decision models trained on Indian crop and soil datasets.
          </p>

          <div className="hp-cards">
            {MODULES.map((m, i) => (
              <div
                key={m.id}
                className={`hp-card hp-stagger-${i + 1}${!m.live ? ' hp-card--disabled' : ''}`}
                onClick={() => m.live && go(m.id)}
              >
                <div className="hp-card__icon">{m.icon}</div>
                <div className="hp-card__content">
                  <div className="hp-card__name">{m.name}</div>
                  <div className="hp-card__desc">{m.desc}</div>
                  <span className={`hp-card__status ${m.live ? 'hp-card__status--live' : 'hp-card__status--soon'}`}>
                    {m.live && <span className="hp-pulse" />}
                    {m.live ? 'Live Now' : 'Coming Soon'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Stats bar ── */}
          <div className="hp-stats">
            {STATS.map((s) => (
              <div className="hp-stat" key={s.label}>
                <div className="hp-stat__num">{s.num}</div>
                <div className="hp-stat__label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════ LOWER SECTION ════════ */}
      <div className="hp-lower-bg">
        {/* Scrolling crop images */}
        <div className="hp-scroller">
          <div className="hp-scroller-inner">
            {[...CROP_IMAGES, ...CROP_IMAGES].map((src, i) => (
              <img key={i} src={src} className="hp-scroller-img" alt="Agriculture field" loading="lazy" />
            ))}
          </div>
        </div>

        <div className="hp-divider" />

        {/* ════════ HOW IT WORKS ════════ */}
        <div className="hp-how">
          <h2 className="hp-how__title">How It Works</h2>
          <p className="hp-how__sub">Three simple steps to smarter farming decisions</p>
          <div className="hp-how__steps">
            <div className="hp-how__step">
              <div className="hp-how__num">01</div>
              <div className="hp-how__icon">📝</div>
              <h3>Enter Your Data</h3>
              <p>Provide soil nutrients, crop type, field area, or upload a leaf photo</p>
            </div>
            <div className="hp-how__connector">→</div>
            <div className="hp-how__step">
              <div className="hp-how__num">02</div>
              <div className="hp-how__icon">🤖</div>
              <h3>AI Analyzes</h3>
              <p>Our ML models process your input using trained pipelines for accurate results</p>
            </div>
            <div className="hp-how__connector">→</div>
            <div className="hp-how__step">
              <div className="hp-how__num">03</div>
              <div className="hp-how__icon">🌱</div>
              <h3>Get Recommendations</h3>
              <p>Receive actionable insights — fertilizer dosage, yield forecast, or disease treatment</p>
            </div>
          </div>
        </div>

        {/* ════════ DETAIL SECTION ════════ */}
        <div className="hp-section">
          <h2 className="hp-section__title">Explore Modules</h2>
          <p className="hp-section__sub">
            Four AI modules, one unified platform — select a module to get started.
          </p>

          {/* ── Pipeline Diagram ── */}
          <div className="hp-pipeline">
            <p className="hp-pipeline__label">AI Decision Pipeline</p>
            {PIPELINES.map((p) => (
              <div key={p.id} className="hp-pipeline__row">
                {/* Module icon badge */}
                <div className="hp-pipeline__badge" style={{ background: p.color + '22', border: `1px solid ${p.color}55` }}>
                  <span>{p.icon}</span>
                </div>

                {/* Steps */}
                {p.steps.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <div className="hp-pipeline__node" style={{ borderColor: p.color + '66' }}>
                      <span className="hp-pipeline__node-dot" style={{ background: p.color }} />
                      <span className="hp-pipeline__node-text">{step}</span>
                    </div>
                    {idx < p.steps.length - 1 && (
                      <div className="hp-pipeline__arrow" style={{ color: p.color }}>
                        →
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>

          {/* Module cards */}
          <div className="hp-detail-grid">
            {MODULES.map((m) => (
              <div
                key={m.id}
                className={`hp-detail-card c-${m.id}${!m.live ? ' hp-detail-card--disabled' : ''}`}
                onClick={() => m.live && go(m.id)}
              >
                <div className="hp-detail-card__top">
                  <div
                    className="hp-detail-card__icon"
                    style={{ filter: m.live ? 'none' : 'grayscale(.35)' }}
                  >
                    {m.icon}
                  </div>
                  <div>
                    <h3 className="hp-detail-card__name">{m.name}</h3>
                    <p className="hp-detail-card__desc">{m.desc}</p>
                  </div>
                </div>
                <div className="hp-detail-card__bottom">
                  <span className={`hp-detail-card__tag ${m.live ? 'hp-detail-card__tag--live' : 'hp-detail-card__tag--soon'}`}>
                    {m.live ? '✦ Live Now' : '◎ Coming Soon'}
                  </span>
                  <span className="hp-detail-card__arrow" style={{ opacity: m.live ? 1 : 0.28 }}>
                    →
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* CTA banner */}
          <div className="hp-cta">
            <div className="hp-cta__icon">🌾</div>
            <div>
              <h3 className="hp-cta__title">
                No login required — start getting recommendations instantly
              </h3>
              <p className="hp-cta__text">
                AgriSense is open to every farmer. Select Fertilizer or Yield Prediction
                to begin. Disease detection and weather advisory are coming soon.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════ PIPELINE CSS (scoped inline) ════════ */}
      <style>{`
        .hp-pipeline {
          margin: 0 auto 2.5rem auto;
          max-width: 860px;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .hp-pipeline__label {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin-bottom: 0.25rem;
        }

        .hp-pipeline__row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 0.55rem 0.85rem;
          flex-wrap: wrap;
        }

        .hp-pipeline__badge {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
          margin-right: 0.25rem;
        }

        .hp-pipeline__node {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid;
          border-radius: 6px;
          padding: 0.3rem 0.65rem;
        }

        .hp-pipeline__node-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .hp-pipeline__node-text {
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(255,255,255,0.8);
          white-space: nowrap;
        }

        .hp-pipeline__arrow {
          font-size: 0.9rem;
          opacity: 0.6;
          font-weight: 700;
          flex-shrink: 0;
        }

        @media (max-width: 640px) {
          .hp-pipeline__row {
            gap: 0.35rem;
          }
          .hp-pipeline__node-text {
            font-size: 0.68rem;
          }
        }
      `}</style>
    </div>
  );
}