import React, { useState } from 'react';
import { CloudSun, Sprout } from 'lucide-react';
import {
  ModulePanel, ModuleHeader, FormGroup, SelectInput,
  TextInput, Button, Divider, Spinner, ErrorCard
} from '../components/UI.jsx';
import { CROPS_COMMON } from '../utils/constants.js';

const API_BASE = 'http://127.0.0.1:8000'; // Unified FastAPI backend

const INITIAL_FORM = {
  city: '',
  crop: '',
};

export default function WeatherPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const set = key => val => {
    setForm(f => ({ ...f, [key]: val }));
  };

  function validate() {
    if (!form.city.trim()) return 'Please enter a city name.';
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) { alert(err); return; }

    setStatus('loading');

    try {
      const response = await fetch(`${API_BASE}/weather/advisory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setErrorMsg(data.error || 'Failed to fetch weather data.');
        setStatus('error');
      } else {
        setResult(data);
        setStatus('success');
      }
    } catch (e) {
      setErrorMsg(`Could not connect to weather API.<br/><small style="opacity:.7">${e.message}</small>`);
      setStatus('error');
    }
  }

  function handleReset() {
    setForm(INITIAL_FORM);
    setStatus('idle');
    setResult(null);
  }

  return (
    <div className="module-page">
      <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <ModulePanel>
          <ModuleHeader
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--leaf-light)' }}>
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
              </svg>
            }
            iconBg="rgba(125, 179, 86, 0.15)"
            title="Weather Advisory"
            subtitle="Location-based real-time weather data with personalized farming guidance"
          />
          <div className="module-body">
            <div className="form-grid" style={{ marginBottom: '1rem' }}>
              <FormGroup label="City / Location">
                <TextInput id="w-city" value={form.city} onChange={set('city')} placeholder="e.g. New Delhi" />
              </FormGroup>
              <FormGroup label="Target Crop (Optional)">
                <SelectInput id="w-crop" value={form.crop} onChange={set('crop')} options={CROPS_COMMON} placeholder="— Select Crop —" />
              </FormGroup>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: '2rem' }}>
              <Button onClick={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CloudSun size={18} /> Get Advisory</Button>
              <Button variant="secondary" onClick={handleReset}>Reset</Button>
            </div>

            {status === 'loading' && <Spinner />}
            {status === 'error' && <ErrorCard message={errorMsg} />}
            {status === 'success' && result && <WeatherResult data={result} form={form} />}
          </div>
        </ModulePanel>
      </div>
    </div>
  );
}

function WeatherResult({ data, form }) {
  const { temperature, humidity, wind, advice } = data;

  return (
    <div className="result-card result-card-glass success animate-in" style={{ marginTop: '2.5rem' }}>
      <div className="result-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--leaf-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4"></path>
          <path d="M12 8h.01"></path>
        </svg>
        Current Weather & Advisory
      </div>

      <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.55)', marginBottom: '1.5rem' }}>
        Location: <strong style={{ color: '#fff' }}>{form.city}</strong> &nbsp;|&nbsp; Crop: <strong style={{ color: '#fff' }}>{form.crop || 'Not specified'}</strong>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>Temperature</div>
          <div style={{ fontSize: '2.2rem', fontFamily: "'Playfair Display', serif", fontWeight: 700, color: 'var(--leaf-light)', lineHeight: 1 }}>{temperature.toFixed(1)}°C</div>
        </div>
        <div style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>Humidity</div>
          <div style={{ fontSize: '2.2rem', fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#3498db', lineHeight: 1 }}>{humidity}%</div>
        </div>
        <div style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>Wind Speed</div>
          <div style={{ fontSize: '2.2rem', fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#f39c12', lineHeight: 1 }}>{wind.toFixed(1)} <span style={{ fontSize: '1rem' }}>m/s</span></div>
        </div>
      </div>

      <Divider />

      <div>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}><Sprout size={20} /> Agronomic Advice</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {advice.map((item, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 14px', background: 'rgba(125, 179, 86, 0.12)',
              border: '1px solid rgba(125, 179, 86, 0.25)',
              borderRadius: '8px', color: '#fff', fontSize: '0.9rem'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--leaf-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M11 20A7 7 0 0 1 4 13"></path>
                <path d="M11 20H4"></path>
                <path d="M12 2v20"></path>
                <path d="M18 13a7 7 0 0 1-7 7"></path>
                <path d="M18 13h-7"></path>
                <path d="M4 4c4 4 4 10 4 10s4-6 10-6"></path>
              </svg>
              {item}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}