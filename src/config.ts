// קריאת הגדרות הסביבה במקום אחד. משתני Vite חייבים להתחיל ב-VITE_
const rawApiUrl = import.meta.env.VITE_API_URL;

if (!rawApiUrl) {
  throw new Error('חסר VITE_API_URL. העתיקי את .env.example לשם .env והגדירי את כתובת השרת.');
}

export const API_URL: string = rawApiUrl.replace(/\/+$/, '');
