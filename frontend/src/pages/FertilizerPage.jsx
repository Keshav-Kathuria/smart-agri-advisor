import React, { useState, useEffect, useRef } from 'react';
import { ImagePlus, Search, FlaskConical, Lightbulb, BarChart2 } from 'lucide-react';
import {
  ModulePanel, ModuleHeader, FormGroup, SelectInput,
  NumberInput, Button, Divider, SectionLabel,
  Spinner, ErrorCard,
} from '../components/UI.jsx';

import { API_URLS } from '../util/constants';


const INITIAL = {
  Temperature: '',
  Soil_Type: '',
  Crop_Type: '',
  Nitrogen: '',
  Potassium: '',
  Phosphorous: '',
};

export default function FertilizerPage() {
  const [form, setForm]         = useState(INITIAL);
  const [status, setStatus]     = useState('idle');
  const [result, setResult]     = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [options, setOptions]   = useState({ soil_types: [], crop_types: [] });

  // Soil image detection state
  const [soilImage, setSoilImage]           = useState(null);      // File object
  const [soilPreview, setSoilPreview]       = useState(null);      // blob URL
  const [soilDetecting, setSoilDetecting]   = useState(false);
  const [soilDetected, setSoilDetected]     = useState(null);      // { soil_type, confidence, top3 }
  const [soilDetectErr, setSoilDetectErr]   = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchOptions() {
      try {
        const res = await fetch(`${API_URLS.fertilizer.replace('/predict', '/options')}`);
        const data = await res.json();
        setOptions({ soil_types: data.soil_types, crop_types: data.crop_types });
      } catch (err) {
        console.error('Failed to load fertilizer options', err);
      }
    }
    fetchOptions();
  }, []);

  // Cleanup blob URL on unmount / image change
  useEffect(() => {
    return () => { if (soilPreview) URL.revokeObjectURL(soilPreview); };
  }, [soilPreview]);

  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  /* ── Image pick ── */
  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSoilImage(file);
    setSoilPreview(URL.createObjectURL(file));
    setSoilDetected(null);
    setSoilDetectErr('');
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setSoilImage(file);
    setSoilPreview(URL.createObjectURL(file));
    setSoilDetected(null);
    setSoilDetectErr('');
  }

  /* ── Detect soil from image ── */
  async function handleDetectSoil() {
    if (!soilImage) return;
    setSoilDetecting(true);
    setSoilDetectErr('');
    setSoilDetected(null);

    try {
      const fd = new FormData();
      fd.append('file', soilImage);

      const res = await fetch(API_URLS.soil, { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) {
        setSoilDetectErr(data.detail || 'Detection failed.');
      } else {
        setSoilDetected(data);
        // Auto-fill dropdown with the actual detected CNN label (matches the 10-item list)
        setForm(f => ({ ...f, Soil_Type: data.detected_soil }));
      }
    } catch (e) {
      setSoilDetectErr(`Could not reach API: ${e.message}`);
    } finally {
      setSoilDetecting(false);
    }
  }

  /* ── Fertilizer predict ── */
  function validate() {
    if (!form.Crop_Type)      return 'Please select a crop type.';
    if (!form.Soil_Type)      return 'Please select a soil type.';
    if (form.Temperature === '') return 'Please enter temperature.';
    if (form.Nitrogen    === '') return 'Please enter Nitrogen value.';
    if (form.Potassium   === '') return 'Please enter Potassium value.';
    if (form.Phosphorous === '') return 'Please enter Phosphorous value.';
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) { alert(err); return; }

    const payload = {
      Temperature : parseFloat(form.Temperature),
      Humidity    : 60,
      Moisture    : 40,
      Soil_Type   : form.Soil_Type,
      Crop_Type   : form.Crop_Type,
      Nitrogen    : parseFloat(form.Nitrogen),
      Potassium   : parseFloat(form.Potassium),
      Phosphorous : parseFloat(form.Phosphorous),
    };

    setStatus('loading');
    try {
      const res = await fetch(API_URLS.fertilizer, {
      method  : 'POST',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) { setErrorMsg(data.error); setStatus('error'); }
      else            { setResult(data);         setStatus('success'); }
    } catch (e) {
      setErrorMsg(`Could not connect to fertilizer API.<br/><small style="opacity:.7">${e.message}</small>`);
      setStatus('error');
    }
  }

  function handleReset() {
    setForm(INITIAL);
    setStatus('idle');
    setResult(null);
    setSoilImage(null);
    setSoilPreview(null);
    setSoilDetected(null);
    setSoilDetectErr('');
  }

  return (
    <div className="module-page">
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

            {/* ── SOIL IMAGE DETECTION ── */}
            <SectionLabel>Detect Soil Type from Photo</SectionLabel>

            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => !soilPreview && fileInputRef.current?.click()}
              style={{
                border        : soilPreview
                  ? '2px solid rgba(125,179,86,0.4)'
                  : '2px dashed rgba(255,255,255,0.18)',
                borderRadius  : '14px',
                padding       : soilPreview ? '0' : '2rem',
                marginBottom  : '1.2rem',
                background    : soilPreview
                  ? 'transparent'
                  : 'rgba(255,255,255,0.03)',
                cursor        : soilPreview ? 'default' : 'pointer',
                transition    : 'border-color 0.2s, background 0.2s',
                overflow      : 'hidden',
              }}
            >
              {soilPreview ? (
                /* Preview + actions */
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img
                      src={soilPreview}
                      alt="Soil preview"
                      style={{
                        width        : 120,
                        height       : 120,
                        objectFit    : 'cover',
                        borderRadius : '10px',
                        border       : '1px solid rgba(255,255,255,0.12)',
                        display      : 'block',
                      }}
                    />
                    {/* Remove button */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setSoilImage(null);
                        setSoilPreview(null);
                        setSoilDetected(null);
                        setSoilDetectErr('');
                      }}
                      style={{
                        position     : 'absolute',
                        top          : -8,
                        right        : -8,
                        width        : 22,
                        height       : 22,
                        borderRadius : '50%',
                        border       : '1px solid rgba(255,255,255,0.2)',
                        background   : 'rgba(30,30,30,0.9)',
                        color        : '#fff',
                        fontSize     : 12,
                        cursor       : 'pointer',
                        display      : 'flex',
                        alignItems   : 'center',
                        justifyContent: 'center',
                        lineHeight   : 1,
                      }}
                    >✕</button>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                      {soilImage?.name}
                    </div>

                    {/* Detection result badge */}
                    {soilDetected && (
                      <div style={{
                        background   : 'rgba(125,179,86,0.12)',
                        border       : '1px solid rgba(125,179,86,0.3)',
                        borderRadius : '8px',
                        padding      : '8px 12px',
                        marginBottom : 10,
                      }}>
                        {/* Detected soil type (real CNN label) */}
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>
                          Detected soil
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--leaf-light)', fontSize: '1rem', textTransform: 'capitalize' }}>
                          {soilDetected.detected_soil}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                          Confidence: {(soilDetected.confidence * 100).toFixed(1)}%
                        </div>

                        {/* Top-3 mini bars */}
                        {soilDetected.top3?.length > 1 && (
                          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {soilDetected.top3.map((t, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                  fontSize     : '0.68rem',
                                  color        : i === 0 ? 'var(--leaf-light)' : 'rgba(255,255,255,0.35)',
                                  width        : 72,
                                  flexShrink   : 0,
                                  fontWeight   : i === 0 ? 600 : 400,
                                  overflow     : 'hidden',
                                  textOverflow : 'ellipsis',
                                  whiteSpace   : 'nowrap',
                                  textTransform: 'capitalize',
                                }}>{t.soil_type}</div>
                                <div style={{
                                  flex        : 1,
                                  height      : 4,
                                  background  : 'rgba(255,255,255,0.08)',
                                  borderRadius: 2,
                                  overflow    : 'hidden',
                                }}>
                                  <div style={{
                                    width       : `${(t.confidence * 100).toFixed(1)}%`,
                                    height      : '100%',
                                    background  : i === 0 ? 'var(--leaf-light)' : 'rgba(255,255,255,0.18)',
                                    borderRadius: 2,
                                    transition  : 'width 0.5s ease',
                                  }} />
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', width: 30, textAlign: 'right' }}>
                                  {(t.confidence * 100).toFixed(0)}%
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {soilDetectErr && (
                      <div style={{ fontSize: '0.8rem', color: '#e89090', marginBottom: 8 }}>
                        ⚠ {soilDetectErr}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        onClick={e => { e.stopPropagation(); handleDetectSoil(); }}
                        disabled={soilDetecting}
                        style={{
                          padding      : '6px 14px',
                          borderRadius : '7px',
                          border       : '1px solid rgba(125,179,86,0.4)',
                          background   : 'rgba(125,179,86,0.15)',
                          color        : 'var(--leaf-light)',
                          fontSize     : '0.8rem',
                          fontWeight   : 600,
                          cursor       : soilDetecting ? 'not-allowed' : 'pointer',
                          opacity      : soilDetecting ? 0.6 : 1,
                          display      : 'flex',
                          alignItems   : 'center',
                          gap          : 6,
                        }}
                      >
                        {soilDetecting
                          ? <><span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(125,179,86,0.4)', borderTopColor: 'var(--leaf-light)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Detecting…</>
                          : <><Search size={16} /> Detect Soil</>}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        style={{
                          padding      : '6px 14px',
                          borderRadius : '7px',
                          border       : '1px solid rgba(255,255,255,0.12)',
                          background   : 'rgba(255,255,255,0.05)',
                          color        : 'rgba(255,255,255,0.6)',
                          fontSize     : '0.8rem',
                          cursor       : 'pointer',
                        }}
                      >
                        Change photo
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Drop zone */
                <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><ImagePlus size={48} strokeWidth={1.5} color="rgba(255,255,255,0.6)" /></div>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                    Drop a soil photo here or click to browse
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                    JPEG · PNG · WEBP — model detects soil type automatically
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />

            <Divider />

            {/* ── CROP & SOIL DETAILS ── */}
            <SectionLabel>Crop &amp; Soil Details</SectionLabel>
            <div className="form-grid" style={{ marginBottom: '1.2rem' }}>
              <FormGroup label="Crop Type">
                <SelectInput
                  id="f-crop" value={form.Crop_Type}
                  onChange={set('Crop_Type')} options={options.crop_types}
                  placeholder="— Select Crop —"
                />
              </FormGroup>

              <FormGroup label={
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Soil Type
                  {soilDetected && (
                    <span style={{
                      fontSize     : '0.65rem',
                      fontWeight   : 700,
                      padding      : '1px 7px',
                      borderRadius : '10px',
                      background   : 'rgba(125,179,86,0.18)',
                      color        : 'var(--leaf-light)',
                      border       : '1px solid rgba(125,179,86,0.3)',
                    }}>
                      ✓ auto-detected
                    </span>
                  )}
                </span>
              }>
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
                <NumberInput id="f-n" value={form.Nitrogen} onChange={set('Nitrogen')} placeholder="e.g. 37" />
              </FormGroup>
              <FormGroup label="Potassium (kg/ha)">
                <NumberInput id="f-k" value={form.Potassium} onChange={set('Potassium')} placeholder="e.g. 20" />
              </FormGroup>
              <FormGroup label="Phosphorous (kg/ha)">
                <NumberInput id="f-p" value={form.Phosphorous} onChange={set('Phosphorous')} placeholder="e.g. 15" />
              </FormGroup>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Button onClick={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FlaskConical size={16} /> Get Recommendation</Button>
              <Button variant="secondary" onClick={handleReset}>Reset</Button>
            </div>

            {status === 'loading' && <Spinner />}
            {status === 'error'   && <ErrorCard message={errorMsg} />}
            {status === 'success' && result && <FertilizerResult data={result} />}
          </div>
        </ModulePanel>
      </div>

      {/* Spinner keyframe — inject once */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
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

      <div style={{
        background   : 'rgba(0,0,0,0.25)',
        border       : '1px solid rgba(255,255,255,0.1)',
        borderRadius : '12px',
        padding      : '2rem',
        textAlign    : 'center',
        marginBottom : '1.5rem',
        boxShadow    : 'inset 0 2px 10px rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>
          Recommended Fertilizer
        </div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '3rem', fontWeight: 700, color: 'var(--leaf-light)', lineHeight: 1 }}>
          {predicted_fertilizer}
        </div>
      </div>

      {reason?.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>
            <Lightbulb size={18} /> Why this fertilizer?
          </h4>
          <ul style={{ paddingLeft: '1.2rem' }}>
            {reason.map((r, i) => (
              <li key={i} style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px', lineHeight: 1.6 }}>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Divider />

      {explanation && Object.values(explanation).some(v => v !== 0) && (
        <div>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>
            <BarChart2 size={18} /> Key Factors
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(explanation)
              .filter(([, v]) => v !== 0)
              .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
              .map(([feature, impact], i) => {
                const isUp      = impact > 0;
                const color       = isUp ? 'var(--leaf-pale)' : '#e89090';
                const bg          = isUp ? 'rgba(125,179,86,0.12)' : 'rgba(192,57,43,0.12)';
                const borderColor = isUp ? 'rgba(125,179,86,0.25)' : 'rgba(192,57,43,0.25)';
                const icon = isUp ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--leaf-light)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e89090" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                );
                return (
                  <div key={i} style={{
                    display        : 'flex',
                    justifyContent : 'space-between',
                    alignItems     : 'center',
                    padding        : '10px 14px',
                    background     : bg,
                    borderRadius   : '8px',
                    border         : `1px solid ${borderColor}`,
                    fontSize       : '0.85rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fff', fontWeight: 500 }}>
                      <span style={{ fontSize: '0.75rem' }}>{icon}</span> {feature}
                    </div>
                    <div style={{ color, fontWeight: 600 }}>
                      {isUp ? '+' : ''}{impact}
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