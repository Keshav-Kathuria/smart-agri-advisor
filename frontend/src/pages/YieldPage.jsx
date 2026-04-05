import React, { useState, useEffect } from 'react';
import { BarChart2, Lightbulb } from 'lucide-react';
import {
  ModulePanel, ModuleHeader, FormGroup, SelectInput,
  NumberInput, Button, Divider, SectionLabel,
  Spinner, ErrorCard, YieldBarRow,
} from '../components/UI.jsx';

// Central API config as requested
const API_BASE = 'http://127.0.0.1:8000';const CROP_CATEGORY_MAP = {
  "Wheat": "Cereal",
  "Rice": "Cereal",
  "Maize (corn)": "Cereal",
  "Barley": "Cereal",
  "Millet": "Cereal",
  "Sorghum": "Cereal",
  "Potatoes": "Root Crop",
  "Sweet potatoes": "Root Crop",
  "Cassava, fresh": "Root Crop",
  "Yams": "Root Crop",
  "Tomatoes": "Vegetable",
  "Onions and shallots, dry (excluding dehydrated)": "Vegetable",
  "Cabbages": "Vegetable",
  "Cauliflowers and broccoli": "Vegetable",
  "Cucumbers and gherkins": "Vegetable",
  "Eggplants (aubergines)": "Vegetable",
  "Okra": "Vegetable",
  "Pumpkins, squash and gourds": "Vegetable",
  "Carrots and turnips": "Vegetable",
  "Lettuce and chicory": "Vegetable",
  "Other vegetables, fresh n.e.c.": "Vegetable",
  "Other beans, green": "Vegetable",
  "Peas, green": "Vegetable",
  "Green garlic": "Vegetable",
  "Chillies and peppers, green (Capsicum spp. and Pimenta spp.)": "Vegetable",
  "Bananas": "Fruit",
  "Mangoes, guavas and mangosteens": "Fruit",
  "Oranges": "Fruit",
  "Apples": "Fruit",
  "Grapes": "Fruit",
  "Papayas": "Fruit",
  "Pineapples": "Fruit",
  "Watermelons": "Fruit",
  "Cantaloupes and other melons": "Fruit",
  "Strawberries": "Fruit",
  "Apricots": "Fruit",
  "Cherries": "Fruit",
  "Peaches and nectarines": "Fruit",
  "Pears": "Fruit",
  "Plums and sloes": "Fruit",
  "Figs": "Fruit",
  "Kiwi fruit": "Fruit",
  "Lemons and limes": "Fruit",
  "Tangerines, mandarins, clementines": "Fruit",
  "Pomelos and grapefruits": "Fruit",
  "Other citrus fruit, n.e.c.": "Fruit",
  "Other fruits, n.e.c.": "Fruit",
  "Other stone fruits": "Fruit",
  "Other tropical fruits, n.e.c.": "Fruit",
  "Other berries and fruits of the genus vaccinium n.e.c.": "Fruit",
  "Soya beans": "Oilseed",
  "Groundnuts, excluding shelled": "Oilseed",
  "Sunflower seed": "Oilseed",
  "Rape or colza seed": "Oilseed",
  "Sesame seed": "Oilseed",
  "Linseed": "Oilseed",
  "Castor oil seeds": "Oilseed",
  "Safflower seed": "Oilseed",
  "Other oil seeds, n.e.c.": "Oilseed",
  "Beans, dry": "Pulse",
  "Lentils, dry": "Pulse",
  "Chick peas, dry": "Pulse",
  "Pigeon peas, dry": "Pulse",
  "Peas, dry": "Pulse",
  "Other pulses n.e.c.": "Pulse",
  "Sugar cane": "Cash Crop",
  "Seed cotton, unginned": "Cash Crop",
  "Jute, raw or retted": "Fibre",
  "Kenaf, and other textile bast fibres, raw or retted": "Fibre",
  "Natural rubber in primary forms": "Industrial",
  "Unmanufactured tobacco": "Industrial",
  "Cocoa beans": "Beverage",
  "Coffee, green": "Beverage",
  "Tea leaves": "Beverage",
  "Areca nuts": "Beverage",
  "Almonds, in shell": "Tree Nut",
  "Cashew nuts, in shell": "Tree Nut",
  "Walnuts, in shell": "Tree Nut",
  "Coconuts, in shell": "Tree Nut",
  "Pepper (Piper spp.), raw": "Spice",
  "Chillies and peppers, dry (Capsicum spp., Pimenta spp.), raw": "Spice",
  "Ginger, raw": "Spice",
  "Nutmeg, mace, cardamoms, raw": "Spice",
  "Anise, badian, coriander, cumin, caraway, fennel and juniper berries, raw": "Spice",
  "Other stimulant, spice and aromatic crops, n.e.c.": "Spice",
};

const INITIAL_FORM = {
  crop: '',
  crop_category: '',
  year: new Date().getFullYear(),
  rainfall_label: '',
  avg_temp_c: '',
  fertilizer_npk_kg_ha: '',
};

export default function YieldPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Dropdown options state
  const [options, setOptions] = useState({
    crops: [],
    categories: [],
    rainfall: []
  });

  // Step 1: Fetch dropdown options on mount
  useEffect(() => {
    async function fetchOptions() {
      try {
        const res = await fetch(`${API_BASE}/yield/crops`);
        const data = await res.json();

        setOptions({
          crops: data.crops,
          categories: data.categories,
          rainfall: data.rainfall_options
        });
      } catch (err) {
        console.error("Failed to load options", err);
      }
    }
    fetchOptions();
  }, []);

  const set = key => val => {
    setForm(f => {
      const updated = { ...f, [key]: val };
      // Auto-fill category when crop is selected
      if (key === 'crop' && CROP_CATEGORY_MAP[val]) {
        updated.crop_category = CROP_CATEGORY_MAP[val];
      }
      return updated;
    });
  };

  function validate() {
    if (!form.crop) return 'Please select a crop.';
    if (!form.crop_category) return 'Please select a crop category.';
    if (!form.year || form.year < 1900 || form.year > 2100) return 'Please enter a valid 4-digit year.';
    if (!form.rainfall_label) return 'Please select rainfall conditions.';
    if (form.avg_temp_c === '') return 'Please enter average temperature.';
    if (form.fertilizer_npk_kg_ha === '') return 'Please enter fertilizer amount.';
    return null;
  }

  // Step 3: Send API Request
  async function handleSubmit() {
    const err = validate();
    if (err) { alert(err); return; }

    const payload = {
      ...form,
      year: parseInt(form.year, 10),
      avg_temp_c: parseFloat(form.avg_temp_c),
      fertilizer_npk_kg_ha: parseFloat(form.fertilizer_npk_kg_ha),
    };

    setStatus('loading');

    try {
      // REAL API CALL
      const response = await fetch(`${API_BASE}/yield/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      // Step 5: Handle errors returned by API
      if (data.error) {
        setErrorMsg(data.error);
        setStatus('error');
      } else {
        setResult(data);
        setStatus('success');
      }

    } catch (e) {
      setErrorMsg(`Could not connect to yield API.<br/><small style="opacity:.7">${e.message}</small>`);
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
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
          }
          iconBg="rgba(125, 179, 86, 0.15)"
          title="Yield Prediction"
          subtitle="Machine learning forecast of crop output based on environmental and agronomic inputs"
        />
        <div className="module-body">

          {/* Step 2: Build the Input Form */}
          <div className="form-grid" style={{ marginBottom: '1rem' }}>
            <FormGroup label="Crop">
              <SelectInput id="y-crop" value={form.crop} onChange={set('crop')} options={options.crops} placeholder="— Select Crop —" />
            </FormGroup>
            <FormGroup label="Crop Category">
              <SelectInput id="y-cat" value={form.crop_category} onChange={set('crop_category')} options={options.categories} placeholder="— Select Category —" />
            </FormGroup>
            <FormGroup label="Prediction Year">
              <NumberInput id="y-year" value={form.year} onChange={set('year')} placeholder="e.g. 2024" />
            </FormGroup>
            <FormGroup label="Rainfall Level">
              <SelectInput id="y-rain" value={form.rainfall_label} onChange={set('rainfall_label')} options={options.rainfall} placeholder="— Select Rainfall —" />
            </FormGroup>
            <FormGroup label="Avg Temperature (°C)">
              <NumberInput id="y-temp" value={form.avg_temp_c} onChange={set('avg_temp_c')} placeholder="e.g. 25.0" step="0.1" />
            </FormGroup>
            <FormGroup label="Fertilizer NPK (kg/ha)">
              <NumberInput id="y-fert" value={form.fertilizer_npk_kg_ha} onChange={set('fertilizer_npk_kg_ha')} placeholder="e.g. 150.0" step="0.1" />
            </FormGroup>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: '2rem' }}>
            <Button onClick={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><BarChart2 size={18} /> Predict Yield</Button>
            <Button variant="secondary" onClick={handleReset}>Reset</Button>
          </div>

          {status === 'loading' && <Spinner />}
          {status === 'error' && <ErrorCard message={errorMsg} />}
          {status === 'success' && result && <YieldResult data={result} />}
        </div>
      </ModulePanel>
      </div>
    </div>
  );
}

/* ── RESULT RENDERER ── */
function YieldResult({ data }) {
  const {
    crop, crop_category, year,
    predicted_yield, unit, baseline,
    rainfall_category, explanation, top_factors
  } = data;

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
        Yield Prediction Result
      </div>

      <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.55)', marginBottom: '1.5rem' }}>
        Crop: <strong style={{ color: '#fff' }}>{crop}</strong> ({crop_category}) &nbsp;|&nbsp; Year: <strong style={{ color: '#fff' }}>{year}</strong>
      </div>

      {/* Main Prediction Box */}
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
          Predicted Yield
        </div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '3rem', fontWeight: 700, color: 'var(--leaf-light)', lineHeight: 1 }}>
          {predicted_yield.toLocaleString()} <span style={{ fontSize: '1.2rem', color: 'rgba(255, 255, 255, 0.6)' }}>{unit}</span>
        </div>
      </div>

      {/* Secondary Stats */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', fontSize: '0.9rem' }}>
        <div><span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>National average:</span> <strong style={{ color: '#fff' }}>{baseline.toLocaleString()} {unit}</strong></div>
        <div><span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Rainfall detected:</span> <strong style={{ color: '#fff' }}>{rainfall_category}</strong></div>
      </div>

      <Divider />

      {/* Explanation */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}><Lightbulb size={18} /> Explanation</h4>
        <p className="result-body">{explanation}</p>
      </div>

      {/* Top Factors */}
      <div>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}><BarChart2 size={18} /> Top Factors driving this prediction</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {top_factors.map((f, i) => {
            const isUp = f.direction === 'up';
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
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: bg, borderRadius: '8px',
                border: `1px solid ${borderColor}`, fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontWeight: 500 }}>
                  <span style={{ fontSize: '0.75rem' }}>{icon}</span> {f.feature}
                </div>
                <div style={{ color, fontWeight: 600 }}>
                  {sign}{f.impact.toLocaleString()} {unit}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}