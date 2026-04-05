import React, { useState, useRef, useCallback } from 'react';
import {
  ModulePanel, ModuleHeader, Button, Divider, Spinner, ErrorCard,
} from '../components/UI.jsx';
import { Camera, Search, Brain, Pin, Leaf, AlertTriangle, BarChart2, ClipboardList, Wrench, Pill, ShoppingCart, Zap } from 'lucide-react';

import { API_URLS } from '../util/constants';


const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  UNCERTAIN: 'uncertain',
  ERROR: 'error',
};

export default function DiseasePage() {
  const [status, setStatus]     = useState(STATUS.IDLE);
  const [preview, setPreview]   = useState(null);
  const [file, setFile]         = useState(null);
  const [result, setResult]     = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef                = useRef(null);

  // ── File handling ──
  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(f.type)) {
      alert('Please upload a JPG or PNG image.');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus(STATUS.IDLE);
    setResult(null);
  };

  const onInputChange = (e) => handleFile(e.target.files[0]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  // ── API call ──
  const handleSubmit = async () => {
    if (!file) return;
    setStatus(STATUS.LOADING);
    setResult(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(API_URLS.disease, { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setStatus(STATUS.ERROR);
        setResult({ error: data.error || 'Something went wrong.' });
        return;
      }

      if (data.status === 'uncertain') {
        setStatus(STATUS.UNCERTAIN);
        setResult(data);
      } else {
        setStatus(STATUS.SUCCESS);
        setResult(data);
      }
    } catch (err) {
      setStatus(STATUS.ERROR);
      setResult({ error: 'Could not reach the server. Make sure the API is running.' });
    }
  };

  const handleReset = () => {
    setStatus(STATUS.IDLE);
    setPreview(null);
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="module-page">
      <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <ModulePanel>
          <ModuleHeader
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--leaf-light)' }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
            }
            iconBg="rgba(125, 179, 86, 0.15)"
            title="Disease Detection"
            subtitle="Upload a clear leaf photo — our CNN model will identify the disease and suggest treatment"
          />

          <div className="module-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

              {/* ── Left: Upload panel ── */}
              <div>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.8rem' }}>
                  Upload Leaf Image
                </p>

                {/* Drop zone */}
                <div
                  style={{
                    border: dragging
                      ? '2px solid rgba(125, 179, 86, 0.6)'
                      : preview
                        ? '2px solid rgba(125, 179, 86, 0.3)'
                        : '2px dashed rgba(255, 255, 255, 0.15)',
                    borderRadius: '14px',
                    padding: preview ? '8px' : '2.5rem',
                    background: dragging
                      ? 'rgba(125, 179, 86, 0.08)'
                      : 'rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    minHeight: '220px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={() => inputRef.current?.click()}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                >
                  {preview ? (
                    <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', borderRadius: '10px' }} />
                  ) : (
                    <div style={{ pointerEvents: 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}><Camera size={48} strokeWidth={1.5} color="rgba(255,255,255,0.6)" /></div>
                      <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 500 }}>
                        Drag & drop an image here
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.3)', marginTop: '6px' }}>
                        or click to browse — JPG, PNG supported
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  onChange={onInputChange}
                />

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 10, marginTop: '1rem' }}>
                  {preview && (
                    <Button variant="secondary" onClick={handleReset}>Clear</Button>
                  )}
                  <button
                    className={`btn btn-primary`}
                    onClick={handleSubmit}
                    disabled={!file || status === STATUS.LOADING}
                    style={{
                      flex: 1,
                      opacity: (!file || status === STATUS.LOADING) ? 0.5 : 1,
                      cursor: (!file || status === STATUS.LOADING) ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    {status === STATUS.LOADING ? <><Search size={16} /> Analysing...</> : <><Brain size={16} /> Analyse Leaf</>}
                  </button>
                </div>

                {/* Tips */}
                <div style={{
                  margintop: '1.2rem',
                  padding: '14px',
                  background: 'rgba(125, 179, 86, 0.08)',
                  border: '1px solid rgba(125, 179, 86, 0.15)',
                  borderRadius: '10px',
                  marginTop: '1.2rem',
                }}>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--leaf-light)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}><Pin size={14} /> Tips for best results</p>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.8 }}>
                    <li>Use a clear, well-lit photo</li>
                    <li>Focus on affected leaves</li>
                    <li>Avoid blurry or dark images</li>
                    <li>Single leaf fills the frame ideally</li>
                  </ul>
                </div>
              </div>

              {/* ── Right: Results panel ── */}
              <div>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.8rem' }}>
                  Analysis Results
                </p>

                {/* IDLE */}
                {status === STATUS.IDLE && (
                  <div style={{ textAlign: 'center', padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Leaf size={48} strokeWidth={1.5} color="rgba(255,255,255,0.2)" style={{ marginBottom: '16px' }} />
                    <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.9rem' }}>
                      Upload a leaf image and click Analyse to see results here.
                    </p>
                  </div>
                )}

                {/* LOADING */}
                {status === STATUS.LOADING && <Spinner />}

                {/* ERROR */}
                {status === STATUS.ERROR && <ErrorCard message={result?.error || 'An error occurred.'} />}

                {/* UNCERTAIN */}
                {status === STATUS.UNCERTAIN && (
                  <div style={{
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    background: 'rgba(232, 160, 32, 0.1)', border: '1px solid rgba(232, 160, 32, 0.3)',
                    borderRadius: '10px', padding: '14px',
                  }}>
                    <AlertTriangle size={24} style={{ color: '#e8c060', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontWeight: 600, color: '#e8c060', margin: '0 0 4px', fontSize: '0.9rem' }}>Could Not Identify</p>
                      <p style={{ color: 'rgba(255, 255, 255, 0.55)', fontSize: '0.82rem', margin: 0 }}>{result.message}</p>
                    </div>
                  </div>
                )}

                {/* SUCCESS */}
                {status === STATUS.SUCCESS && result && (
                  <div className="result-card result-card-glass success animate-in">
                    {/* Prediction badge */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(125,179,86,0.25)',
                      borderRadius: '12px', padding: '1rem 1.2rem', marginBottom: '1rem',
                    }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--leaf-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                          Detected Disease
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                          {result.prediction.class_name.replace(/___/g, ' — ')}
                        </div>
                      </div>
                      <div style={{
                        textAlign: 'center', background: 'rgba(125,179,86,0.2)', borderRadius: '10px', padding: '8px 14px',
                        border: '1px solid rgba(125,179,86,0.3)',
                      }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--leaf-light)', lineHeight: 1 }}>
                          {result.prediction.confidence}%
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>confidence</div>
                      </div>
                    </div>

                    {/* Top 3 */}
                    {result.top3 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                          <BarChart2 size={16} /> Top 3 Predictions
                        </p>
                        {result.top3.map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', width: '22px', flexShrink: 0 }}>#{i+1}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{item.class_name}</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>{item.confidence}%</span>
                              </div>
                              <div style={{ height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${item.confidence}%`, height: '100%', borderRadius: '3px',
                                  background: i === 0 ? 'var(--leaf-light)' : 'rgba(255,255,255,0.2)',
                                  transition: 'width 0.5s ease',
                                }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Disease info */}
                    {result.disease_info?.description && (
                      <>
                        <Divider />
                        <div style={{ marginBottom: '1rem' }}>
                          <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}><ClipboardList size={18} /> About this Disease</h4>
                          <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--leaf-pale)', marginBottom: '4px' }}>{result.disease_info.disease_name}</p>
                          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: 0 }}>{result.disease_info.description}</p>
                        </div>
                      </>
                    )}

                    {/* Treatment steps */}
                    {result.disease_info?.possible_steps && (
                      <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}><Wrench size={18} /> Treatment Steps</h4>
                        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: 0 }}>{result.disease_info.possible_steps}</p>
                      </div>
                    )}

                    {/* Supplement */}
                    {result.supplement?.supplement_name && (
                      <div style={{
                        background: 'rgba(232,160,32,0.08)', border: '1px solid rgba(232,160,32,0.25)',
                        borderRadius: '10px', padding: '14px',
                      }}>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, color: '#e8c060', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 8px' }}><Pill size={16} /> Recommended Supplement</p>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          {result.supplement.supplement_image && (
                            <img
                              src={result.supplement.supplement_image}
                              alt={result.supplement.supplement_name}
                              style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <div>
                            <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', margin: '0 0 6px' }}>{result.supplement.supplement_name}</p>
                            {result.supplement.buy_link && (
                              <a
                                href={result.supplement.buy_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-block', background: 'rgba(232,160,32,0.2)',
                                  border: '1px solid rgba(232,160,32,0.4)',
                                  color: '#e8c060', padding: '5px 12px', borderRadius: '8px',
                                  textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600,
                                  display: 'flex', alignItems: 'center', gap: '6px'
                                }}
                              >
                                <ShoppingCart size={14} /> Buy Now →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Feature highlights ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '2rem' }}>
              {[
                { icon: <Brain size={28} />, label: 'CNN Model', desc: 'Custom-trained ResNet architecture' },
                { icon: <BarChart2 size={28} />, label: '97% Accuracy', desc: 'Tested on PlantVillage dataset' },
                { icon: <Leaf size={28} />, label: '38 Classes', desc: 'Covers major crop diseases' },
                { icon: <Zap size={28} />, label: 'Fast Results', desc: 'Prediction in under 2 seconds' },
              ].map((f) => (
                <div key={f.label} style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}>
                  <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '6px' }}>{f.icon}</span>
                  <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>{f.label}</p>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </ModulePanel>
      </div>
    </div>
  );
}