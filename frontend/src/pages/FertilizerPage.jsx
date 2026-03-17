import React, { useState, useEffect } from 'react';
import {
  ModulePanel, ModuleHeader, FormGroup, SelectInput,
  NumberInput, Button, Divider, SectionLabel,
  Spinner, ErrorCard,
} from '../components/UI.jsx';

const API_BASE_FERTILIZER = 'http://127.0.0.1:8001';

const INITIAL = {
  Temperature: '',
  Soil_Type: '',
  Crop_Type: '',
  Nitrogen: '',
  Potassium: '',
  Phosphorous: '',
};

export default function FertilizerPage() {
  const [form, setForm] = useState(INITIAL);
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [options, setOptions] = useState({ soil_types: [], crop_types: [] });

  useEffect(() => {
    async function fetchOptions() {
      try {
        const res = await fetch(`${API_BASE_FERTILIZER}/options`);
        const data = await res.json();
        setOptions({ soil_types: data.soil_types, crop_types: data.crop_types });
      } catch (err) {
        console.error("Failed to load fertilizer options", err);
      }
    }
    fetchOptions();
  }, []);

  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  function validate() {
    if (!form.Crop_Type) return 'Please select a crop type.';
    if (!form.Soil_Type) return 'Please select a soil type.';
    if (form.Temperature === '') return 'Please enter temperature.';
    if (form.Nitrogen === '') return 'Please enter Nitrogen value.';
    if (form.Potassium === '') return 'Please enter Potassium value.';
    if (form.Phosphorous === '') return 'Please enter Phosphorous value.';
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) { alert(err); return; }

    const payload = {
      Temperature: parseFloat(form.Temperature),
      Humidity: 60,   // default — not required from user
      Moisture: 40,   // default — not required from user
      Soil_Type: form.Soil_Type,
      Crop_Type: form.Crop_Type,
      Nitrogen: parseFloat(form.Nitrogen),
      Potassium: parseFloat(form.Potassium),
      Phosphorous: parseFloat(form.Phosphorous),
    };

    setStatus('loading');
    try {
      const res = await fetch(`${API_BASE_FERTILIZER}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.error) {
        setErrorMsg(data.error);
        setStatus('error');
      } else {
        setResult(data);
        setStatus('success');
      }
    } catch (e) {
      setErrorMsg(`Could not connect to fertilizer API.<br/><small style="opacity:.7">${e.message}</small>`);
      setStatus('error');
    }
  }

  function handleReset() {
    setForm(INITIAL);
    setStatus('idle');
    setResult(null);
  }

  return (
    <div className="hp-hero" style={{ padding: '6rem 2rem', alignItems: 'flex-start', minHeight: '100vh' }}>
      {/* Background Elements to match HomePage */}
      <div className="hp-orb hp-orb--1" />
      <div className="hp-orb hp-orb--2" />
      <div className="hp-orb hp-orb--3" />
      <div className="hp-grid-overlay" />

      <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <ModulePanel>
          <ModuleHeader
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--leaf-light)' }}>
                <path d="M10 2v7.31"></path>
                <path d="M14 9.3V1.99"></path>
                <path d="M8.5 2h7"></path>
                <path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path>
                <path d="M5.52 16h10.96"></path>
              </svg>
            }
            iconBg="rgba(125, 179, 86, 0.15)"
            title="Fertilizer Recommendation"
            subtitle="Enter your crop and soil details to get the best fertilizer recommendation"
          />
          <div className="module-body">

        <SectionLabel>Crop & Soil Details</SectionLabel>
        <div className="form-grid" style={{ marginBottom: '1.2rem' }}>
          <FormGroup label="Crop Type">
            <SelectInput
              id="f-crop" value={form.Crop_Type}
              onChange={set('Crop_Type')} options={options.crop_types}
              placeholder="— Select Crop —"
            />
          </FormGroup>
          <FormGroup label="Soil Type">
            <SelectInput
              id="f-soil" value={form.Soil_Type}
              onChange={set('Soil_Type')} options={options.soil_types}
              placeholder="— Select Soil —"
            />
          </FormGroup>
          <FormGroup label="Temperature (°C)">
            <NumberInput
              id="f-temp" value={form.Temperature}
              onChange={set('Temperature')} placeholder="e.g. 26"
            />
          </FormGroup>
        </div>

        <Divider />
        <SectionLabel>Soil Nutrient Levels (from soil test report)</SectionLabel>
        <div className="form-grid-3" style={{ marginBottom: '1.2rem' }}>
          <FormGroup label="Nitrogen (kg/ha)">
            <NumberInput
              id="f-n" value={form.Nitrogen}
              onChange={set('Nitrogen')} placeholder="e.g. 37"
            />
          </FormGroup>
          <FormGroup label="Potassium (kg/ha)">
            <NumberInput
              id="f-k" value={form.Potassium}
              onChange={set('Potassium')} placeholder="e.g. 20"
            />
          </FormGroup>
          <FormGroup label="Phosphorous (kg/ha)">
            <NumberInput
              id="f-p" value={form.Phosphorous}
              onChange={set('Phosphorous')} placeholder="e.g. 15"
            />
          </FormGroup>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button onClick={handleSubmit}>🧪 Get Recommendation</Button>
          <Button variant="secondary" onClick={handleReset}>Reset</Button>
        </div>

        {status === 'loading' && <Spinner />}
        {status === 'error' && <ErrorCard message={errorMsg} />}
        {status === 'success' && result && <FertilizerResult data={result} />}
      </div>
    </ModulePanel>
      </div>
    </div>
  );
}

/* ── RESULT RENDERER ── */
function FertilizerResult({ data }) {
  const { predicted_fertilizer, explanation, reason } = data;

  return (
    <div className="result-card result-card-glass success animate-in" style={{ marginTop: '2.5rem' }}>
      <div className="result-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--leaf-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 4 13"></path>
          <path d="M11 20H4"></path>
          <path d="M12 2v20"></path>
          <path d="M18 13a7 7 0 0 1-7 7"></path>
          <path d="M18 13h-7"></path>
          <path d="M4 4c4 4 4 10 4 10s4-6 10-6"></path>
        </svg>
        Fertilizer Recommendation
      </div>

      {/* Main Result */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        marginBottom: '1.5rem',
        boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255, 255, 255, 0.5)', marginBottom: 8, fontWeight: 600 }}>
          Recommended Fertilizer
        </div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '3rem', fontWeight: 700, color: 'var(--leaf-light)', lineHeight: 1 }}>
          {predicted_fertilizer}
        </div>
      </div>

      {/* Reasons */}
      {reason && reason.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>
            💡 Why this fertilizer?
          </h4>
          <ul style={{ paddingLeft: '1.2rem' }}>
            {reason.map((r, i) => (
              <li key={i} style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px', lineHeight: 1.6 }}>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Divider />

      {/* SHAP Explanation */}
      {explanation && Object.values(explanation).some(v => v !== 0) && (
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>
            📊 Key Factors
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(explanation)
              .filter(([, v]) => v !== 0)
              .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
              .map(([feature, impact], i) => {
                const isUp = impact > 0;
                const color = isUp ? 'var(--leaf-pale)' : '#e89090';
                const bg = isUp ? 'rgba(125, 179, 86, 0.12)' : 'rgba(192, 57, 43, 0.12)';
                const borderColor = isUp ? 'rgba(125, 179, 86, 0.25)' : 'rgba(192, 57, 43, 0.25)';
                const icon = isUp ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--leaf-light)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e89090" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                );
                const sign = isUp ? '+' : '';
                return (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: bg,
                    borderRadius: '8px',
                    border: `1px solid ${borderColor}`,
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontWeight: 500 }}>
                      <span style={{ fontSize: '0.75rem' }}>{icon}</span> {feature}
                    </div>
                    <div style={{ color, fontWeight: 600 }}>
                      {sign}{impact}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}