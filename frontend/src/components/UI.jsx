import React from 'react';

/* ── SPINNER ── */
export function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'2rem', color:'rgba(255, 255, 255, 0.6)', fontSize:'0.9rem' }}>
      <div style={{ width:20, height:20, border:'2px solid rgba(255, 255, 255, 0.1)', borderTopColor:'var(--leaf-mid)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      Analyzing — please wait…
    </div>
  );
}

/* ── ERROR CARD ── */
export function ErrorCard({ message }) {
  return (
    <div className="result-card danger animate-in" style={{ marginTop:'1.5rem' }}>
      <div className="result-title">⚠ Error</div>
      <div className="result-body" dangerouslySetInnerHTML={{ __html: message }} />
    </div>
  );
}

/* ── FORM GROUP ── */
export function FormGroup({ label, children }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      {children}
    </div>
  );
}

/* ── SELECT INPUT ── */
export function SelectInput({ id, value, onChange, options, placeholder = '— Select —' }) {
  return (
    <select id={id} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}

/* ── NUMBER INPUT ── */
export function NumberInput({ id, value, onChange, placeholder, step, min, max }) {
  return (
    <input
      type="number"
      id={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      step={step}
      min={min}
      max={max}
    />
  );
}

/* ── TEXT INPUT ── */
export function TextInput({ id, value, onChange, placeholder }) {
  return (
    <input
      type="text"
      id={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

/* ── BUTTON ── */
export function Button({ variant = 'primary', onClick, children, type = 'button' }) {
  return (
    <button
      type={type}
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/* ── DIVIDER ── */
export function Divider() {
  return <div className="divider" />;
}

/* ── SECTION LABEL ── */
export function SectionLabel({ children }) {
  return (
    <p style={{ fontSize:'0.82rem', fontWeight:600, color:'rgba(255, 255, 255, 0.5)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.8rem' }}>
      {children}
    </p>
  );
}

/* ── MODULE PANEL ── */
export function ModulePanel({ children }) {
  return (
    <div className="module-panel animate-in">
      {children}
    </div>
  );
}

/* ── MODULE HEADER ── */
export function ModuleHeader({ icon, iconBg, title, subtitle }) {
  return (
    <div className="module-header">
      <div className="module-header-icon" style={{ background: iconBg }}>
        {icon}
      </div>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

/* ── YIELD BAR ROW ── */
export function YieldBarRow({ label, pct, value, color = 'var(--leaf-mid)', labelWidth = 90 }) {
  return (
    <div className="yield-bar-row">
      <div className="yield-bar-label" style={{ width: labelWidth }}>{label}</div>
      <div className="yield-bar-track">
        <div className="yield-bar-fill" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
      <div className="yield-bar-val">{value}</div>
    </div>
  );
}

/* ── COMING SOON ── */
export function ComingSoon({ icon, title, subtitle }) {
  return (
    <div className="coming-soon-wrapper">
      {/* Background elements to make it look like a locked app page */}
      <div className="hp-grid-overlay" />
      <div className="hp-orb hp-orb--1" style={{ opacity: 0.3 }} />
      <div className="hp-orb hp-orb--3" style={{ opacity: 0.2 }} />
      
      <div className="coming-soon-glass">
        <div className="coming-soon-icon">{icon}</div>
        <div className="hp-badge" style={{ margin: '0 auto 1.5rem', background: 'rgba(232, 160, 32, 0.15)', color: '#e8c060', border: '1px solid rgba(232, 160, 32, 0.3)' }}>
          🔒 In Development
        </div>
        <h2 className="coming-soon-title">{title}</h2>
        <p className="coming-soon-desc">{subtitle}</p>
        
        <div className="coming-soon-loader">
          <div className="cs-dot" />
          <div className="cs-dot" />
          <div className="cs-dot" />
        </div>
      </div>
    </div>
  );
}
