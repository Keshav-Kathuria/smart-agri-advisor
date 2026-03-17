import React from 'react';
import { ComingSoon } from '../components/UI.jsx';

export default function DiseasePage() {
  return (
    <ComingSoon
      icon="🔬"
      title="Disease Detection"
      subtitle="Our CNN-powered plant disease detection engine is coming soon. Upload a leaf photo and get instant diagnosis with treatment recommendations."
      features={[
        '📷 Image upload & drag-drop',
        '🧠 CNN model analysis',
        '🦠 Multi-disease detection',
        '💊 Treatment recommendations',
        '🌱 Crop-specific diagnosis',
        '📊 Confidence scoring',
      ]}
    />
  );
}
