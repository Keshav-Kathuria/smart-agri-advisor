import React, { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { FlaskConical, BarChart2, Microscope, CloudSun, Droplets, Calendar, ClipboardList, Zap, Sprout, Wheat, Leaf } from 'lucide-react';

/* ───────────────────────────────────────────────────
   DATA
   ─────────────────────────────────────────────────── */
const MODULES = [
  {
    id: 'fertilizer',
    icon: <FlaskConical size={20} />,
    name: 'Fertilizer Recommendation',
    desc: 'Targeted NPK recommendations derived from deep soil analysis and crop-specific nutrient profiles.',
    live: true,
    link: 'ACCESS MODULE',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=800&h=500',
    size: 'half',
  },
  {
    id: 'yield',
    icon: <BarChart2 size={20} />,
    name: 'Yield Prediction',
    desc: 'AI-driven regression modeling predicting crop yields with high accuracy using environmental parameters.',
    live: true,
    link: 'ACCESS MODULE',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=80&w=1200&h=500',
    size: 'full',
  },
  {
    id: 'disease',
    icon: <Microscope size={20} />,
    name: 'Disease Detection',
    desc: 'Upload leaf imagery for rapid computer-vision diagnosis and targeted treatment suggestions.',
    live: true,
    link: 'ACCESS MODULE',
    image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=800&h=500',
    size: 'half',
  },
  {
    id: 'weather',
    icon: <CloudSun size={20} />,
    name: 'Weather Advisory',
    desc: 'Real-time meteorological insights integrated with agronomic strategies for your region.',
    live: true,
    link: 'ACCESS MODULE',
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1200&h=500',
    size: 'full',
  },
];

/* ── Side cards that appear next to half-width modules ── */
const SIDE_CARDS = [
  {
    icon: <Droplets size={20} />,
    title: 'Irrigation Techniques',
    image: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&q=80&w=600&h=400',
    points: [
      { label: 'Drip Irrigation', info: 'Saves 50% water — ideal for row crops & orchards' },
      { label: 'Sprinkler Systems', info: 'Best for wheat, pulses & large open fields' },
      { label: 'Flood Scheduling', info: 'Monitor soil moisture to avoid water-logging' },
    ],
  },
  {
    icon: <Calendar size={20} />,
    title: 'Seasonal Crop Calendar',
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=600&h=400',
    points: [
      { label: 'Kharif (Jun–Oct)', info: 'Rice, millets, cotton, groundnut, sugarcane' },
      { label: 'Rabi (Nov–Mar)', info: 'Wheat, barley, mustard, peas, lentils' },
      { label: 'Zaid (Mar–Jun)', info: 'Watermelon, muskmelon, cucumber, moong' },
    ],
  },
];

const SCROLL_IMAGES = [
  'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=350&h=240',
  'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=350&h=240',
  'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?auto=format&fit=crop&q=80&w=350&h=240',
  'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=350&h=240',
  'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=80&w=350&h=240',
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=350&h=240',
];

const STATS = [
  { val: '4', label: 'AI Models Deployed' },
  { val: '20+', label: 'Crops Supported' },
  { val: '97%', label: 'Model Accuracy' },
  { val: 'Free', label: 'No Signup Needed' },
];

const HOW_STEPS = [
  { num: '01', icon: <ClipboardList size={32} />, title: 'Enter Your Data', desc: 'Provide soil NPK values, crop type, field dimensions, or upload a leaf photograph.' },
  { num: '02', icon: <Zap size={32} />, title: 'AI Processes', desc: 'Our ML pipelines (XGBoost, CNN, regression) analyze your inputs on Indian crop datasets.' },
  { num: '03', icon: <Sprout size={32} />, title: 'Get Insights', desc: 'Receive actionable guidance — fertilizer dosage, yield forecast, disease ID, or weather advice.' },
];

/* ───────────────────────────────────────────────────
   COMPONENT
   ─────────────────────────────────────────────────── */
export default function HomePage({ onTabChange }) {
  const containerRef = useRef(null);

  // Scroll-reveal
  useEffect(() => {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        anime({
          targets: el.querySelectorAll('[data-anim]'),
          translateY: [50, 0],
          opacity: [0, 1],
          delay: anime.stagger(120),
          duration: 800,
          easing: 'easeOutQuart',
        });
        obs.unobserve(el);
      });
    }, { threshold: 0.12 });

    containerRef.current?.querySelectorAll('[data-section]').forEach(el => {
      el.querySelectorAll('[data-anim]').forEach(c => { c.style.opacity = '0'; });
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  function go(id) {
    onTabChange(id);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // Build module rows:  half + side  |  full  |  half + side  |  full
  let sideIdx = 0;
  const moduleRows = [];
  MODULES.forEach((m) => {
    if (m.size === 'half') {
      const side = SIDE_CARDS[sideIdx % SIDE_CARDS.length];
      sideIdx++;
      moduleRows.push({ type: 'half', module: m, side });
    } else {
      moduleRows.push({ type: 'full', module: m });
    }
  });

  return (
    <div className="hp3" ref={containerRef}>

      {/* ═══════════ HERO ═══════════ */}
      <section className="hp3-hero">
        <div className="hp3-hero__bg">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1920&h=1080"
            alt=""
            className="hp3-hero__bg-img"
          />
          <div className="hp3-hero__overlay" />
        </div>

        <div className="hp3-hero__content">
          <h1 className="hp3-hero__title hp3-anim-1">
            The Future of{' '}
            <em>Agriculture</em>
            <br />
            is Data-Driven.
          </h1>

          <p className="hp3-hero__sub hp3-anim-2">
            AgriSense pairs stunning agronomic insights with world-class machine learning
            models. Maximize your yield, monitor crop health, and perfect your nutrient
            deployment logic.
          </p>

          <div className="hp3-hero__actions hp3-anim-3">
            <button className="hp3-btn hp3-btn--primary" onClick={() => go('fertilizer')}>
              Get Started
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
            <button className="hp3-btn hp3-btn--ghost" onClick={() => {
              containerRef.current?.querySelector('[data-section="modules"]')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Explore Modules
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════ MODULE CARDS ═══════════ */}
      <section className="hp3-modules" data-section="modules">
        {moduleRows.map((row, idx) => {
          const m = row.module;
          if (row.type === 'full') {
            return (
              <div key={m.id} className="hp3-modrow hp3-modrow--full" data-anim>
                <div className="hp3-mod hp3-mod--full" onClick={() => go(m.id)}>
                  <img src={m.image} alt={m.name} className="hp3-mod__img" />
                  <div className="hp3-mod__overlay" />
                  <div className="hp3-mod__body">
                    <span className="hp3-mod__icon-badge">{m.icon}</span>
                    <h3 className="hp3-mod__name">{m.name}</h3>
                    <p className="hp3-mod__desc">{m.desc}</p>
                    <span className={`hp3-mod__link ${m.live ? '' : 'hp3-mod__link--dev'}`}>
                      {m.live ? `${m.link} →` : 'IN DEVELOPMENT'}
                    </span>
                  </div>
                </div>
              </div>
            );
          }
          // half module + side resource card
          const sc = row.side;
          return (
            <div key={m.id} className="hp3-modrow hp3-modrow--split" data-anim>
              <div className="hp3-mod hp3-mod--half" onClick={() => go(m.id)}>
                <img src={m.image} alt={m.name} className="hp3-mod__img" />
                <div className="hp3-mod__overlay" />
                <div className="hp3-mod__body">
                  <span className="hp3-mod__icon-badge">{m.icon}</span>
                  <h3 className="hp3-mod__name">{m.name}</h3>
                  <p className="hp3-mod__desc">{m.desc}</p>
                  <span className={`hp3-mod__link ${m.live ? '' : 'hp3-mod__link--dev'}`}>
                    {m.live ? `${m.link} →` : 'IN DEVELOPMENT'}
                  </span>
                </div>
              </div>

              {/* ── Resource / Guide side card ── */}
              <div className="hp3-resource">
                <div className="hp3-resource__img-wrap">
                  <img src={sc.image} alt={sc.title} className="hp3-resource__img" />
                  <div className="hp3-resource__img-overlay" />
                </div>
                <div className="hp3-resource__body">
                  <div className="hp3-resource__head">
                    <span className="hp3-resource__icon">{sc.icon}</span>
                    <span className="hp3-resource__title">{sc.title}</span>
                  </div>
                  <div className="hp3-resource__list">
                    {sc.points.map((p, i) => (
                      <div key={i} className="hp3-resource__item">
                        <span className="hp3-resource__dot" />
                        <div>
                          <div className="hp3-resource__label">{p.label}</div>
                          <div className="hp3-resource__info">{p.info}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ═══════════ IMAGE SCROLLER ═══════════ */}
      <section className="hp3-scroller" data-section="scroller">
        <div className="hp3-scroller__track" data-anim>
          {[...SCROLL_IMAGES, ...SCROLL_IMAGES].map((src, i) => (
            <img key={i} src={src} alt="Agriculture" loading="lazy" className="hp3-scroller__img" />
          ))}
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="hp3-section" data-section="how">
        <div className="hp3-section__header" data-anim>
          <span className="hp3-section__tag">How It Works</span>
          <h2 className="hp3-section__title">Three Steps to Smarter Farming</h2>
          <p className="hp3-section__sub">From raw data to actionable insights in seconds.</p>
        </div>
        <div className="hp3-how">
          {HOW_STEPS.map(s => (
            <div key={s.num} className="hp3-how__card" data-anim>
              <div className="hp3-how__num">{s.num}</div>
              <div className="hp3-how__icon">{s.icon}</div>
              <h3 className="hp3-how__name">{s.title}</h3>
              <p className="hp3-how__desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ STATS ═══════════ */}
      <section className="hp3-stats-section" data-section="stats">
        <div className="hp3-stats">
          {STATS.map(s => (
            <div key={s.label} className="hp3-stat" data-anim>
              <div className="hp3-stat__val">{s.val}</div>
              <div className="hp3-stat__label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ BOTTOM CTA ═══════════ */}
      <section className="hp3-cta" data-section="cta">
        <div className="hp3-cta__inner" data-anim>
          <span className="hp3-cta__emoji"><Wheat size={48} strokeWidth={1} style={{ margin: '0 auto', color: 'var(--leaf-light)' }} /></span>
          <h3 className="hp3-cta__title">No signup required — start instantly</h3>
          <p className="hp3-cta__desc">
            AgriSense is free and open to every farmer.
            Select any module above to begin — all AI models are live and ready.
          </p>
          <button className="hp3-btn hp3-btn--primary" onClick={() => go('fertilizer')}>
            Launch Nutrient Module
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="hp3-footer">
        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>Built with <Leaf size={14} color="var(--leaf-light)" /> by Keshav — AgriSense v2.1</p>
      </footer>
    </div>
  );
}