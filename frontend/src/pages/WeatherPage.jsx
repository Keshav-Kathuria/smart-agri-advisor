import React from 'react';
import { ComingSoon } from '../components/UI.jsx';

export default function WeatherPage() {
  return (
    <ComingSoon
      icon="🌤"
      title="Weather Advisory"
      subtitle="Location-based real-time weather data with personalized farming guidance is on its way."
      features={[
        '📍 Location-based data',
        '🌡 Temperature & humidity',
        '🌧 Rainfall forecasting',
        '💨 Wind speed alerts',
        '🌾 Crop-specific advice',
        '⚠ Weather alert system',
      ]}
    />
  );
}
