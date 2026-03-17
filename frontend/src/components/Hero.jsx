import React from 'react';

const HERO_CARDS = [
  { tab: 'disease',    icon: '🔬', title: 'Disease Detection',  desc: 'Upload leaf image for instant diagnosis' },
  { tab: 'weather',    icon: '🌤', title: 'Weather Advice',      desc: 'Location-based real-time guidance' },
  { tab: 'fertilizer', icon: '🧪', title: 'Fertilizer Guide',    desc: 'Soil & crop optimized recommendations' },
  { tab: 'yield',      icon: '📊', title: 'Yield Prediction',    desc: 'ML-based harvest forecasting' },
];

export default function Hero({ activeTab, onTabChange }) {
  return (
    <div style={{
      background: 'linear-gradient(145deg, var(--soil) 0%, #2A3D12 60%, var(--leaf) 100%)',
      padding: '4rem 2.5rem 3rem',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background blobs */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(125,179,86,0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(232,160,32,0.1) 0%, transparent 45%)`,
      }} />

      <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(125,179,86,0.2)', border: '1px solid rgba(125,179,86,0.4)',
          color: 'var(--leaf-pale)', fontSize: '0.78rem', fontWeight: 500,
          padding: '5px 14px', borderRadius: 100, letterSpacing: '0.04em',
          marginBottom: '1.2rem', textTransform: 'uppercase',
        }}>
          🛰 AI-Powered Platform
        </div>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          fontWeight: 600, color: '#fff',
          lineHeight: 1.2, marginBottom: '1rem',
        }}>
          Smart Farming,<br />
          <span style={{ color: 'var(--leaf-pale)' }}>Smarter Decisions</span>
        </h1>

        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', maxWidth: 560, fontWeight: 300, lineHeight: 1.75 }}>
          Real-time, personalized agricultural guidance powered by machine learning — from disease detection to yield forecasting.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginTop: '2.5rem' }}>
          {HERO_CARDS.map(card => (
            <HeroCard
              key={card.tab}
              {...card}
              isActive={activeTab === card.tab}
              onClick={() => onTabChange(card.tab)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroCard({ icon, title, desc, isActive, onClick }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isActive
          ? 'var(--leaf-mid)'
          : hovered ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.07)',
        border: `1px solid ${isActive ? 'var(--leaf-light)' : hovered ? 'rgba(125,179,86,0.5)' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '1.1rem 1rem',
        cursor: 'pointer',
        transition: 'all 0.25s',
        textAlign: 'left',
        transform: hovered && !isActive ? 'translateY(-2px)' : 'none',
      }}
    >
      <span style={{ fontSize: '1.6rem', marginBottom: '0.5rem', display: 'block' }}>{icon}</span>
      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', fontWeight: 300 }}>{desc}</div>
    </div>
  );
}
