# AgriSense — React App

Smart Agriculture Advisory Platform converted from HTML to a multi-file React + Vite project.

## Project Structure

```
agrisense/
├── index.html                    # Vite HTML entry point
├── package.json
├── vite.config.js
└── src/
    ├── index.jsx                 # React root mount
    ├── App.jsx                   # Root component — tab routing
    ├── styles.css                # Global CSS variables + shared classes
    ├── utils/
    │   └── constants.js          # API URLs + dropdown option arrays
    ├── components/
    │   ├── Navbar.jsx            # Sticky top navigation
    │   ├── Hero.jsx              # Hero section with 4 feature cards
    │   └── UI.jsx                # Reusable: Button, FormGroup, Spinner,
    │                             #   ErrorCard, YieldBarRow, ComingSoon…
    └── pages/
        ├── HomePage.jsx          # Dashboard with quick-access cards
        ├── FertilizerPage.jsx    # 🧪 Full form + API call + result render
        ├── YieldPage.jsx         # 📊 Full form + API call + result render
        ├── DiseasePage.jsx       # 🔬 Coming Soon
        └── WeatherPage.jsx       # 🌤 Coming Soon
```

## Getting Started

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
```

## Connecting Your Backend

Edit `src/utils/constants.js` — swap the two placeholder URLs:

```js
export const API_URLS = {
  fertilizer: 'https://YOUR_BACKEND_URL/api/fertilizer/recommend',
  yield:      'https://YOUR_BACKEND_URL/api/yield/predict',
};
```

### Fertilizer API — Expected Response Shape

```json
{
  "recommended_fertilizer": "DAP + Urea",
  "N_required": 80,
  "P_required": 40,
  "K_required": 30,
  "application_method": "Broadcast + incorporation",
  "timing": "Pre-sowing + 30 DAS",
  "notes": "Soil pH is optimal for phosphorus availability."
}
```

### Yield API — Expected Response Shape

```json
{
  "predicted_yield_per_ha": 3.8,
  "total_yield": 19.0,
  "confidence": 0.87,
  "comparison_to_average": 12,
  "factors": [
    { "name": "Rainfall",    "impact": 72, "direction": "positive" },
    { "name": "Temperature", "impact": 45, "direction": "negative" }
  ],
  "recommendation": "Consider split fertilizer application to improve uptake."
}
```

## Modules Status

| Module                  | Status        |
|-------------------------|---------------|
| 🧪 Fertilizer Recommendation | ✅ Live (connect API URL) |
| 📊 Yield Prediction     | ✅ Live (connect API URL) |
| 🔬 Disease Detection    | 🔧 Coming Soon |
| 🌤 Weather Advisory     | 🔧 Coming Soon |
