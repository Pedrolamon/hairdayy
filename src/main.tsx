import React,{ StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useAuth, AuthProvider } from './context/AuthContext';
import { UnitProvider } from './context/UnitContext';

function registerPushNotifications(token: string) {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    navigator.serviceWorker.register('/notification-sw.js').then(async swReg => {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
      const existing = await swReg.pushManager.getSubscription();
      let subscription = existing;
      if (!subscription) {
        const response = await fetch('/api/notifications/vapid-public-key');
        const vapidPublicKey = await response.text();
        subscription = await swReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }
      await fetch('/api/notifications/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subscription }),
      });
    });
  }
}
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function Main() {
  const { token } = useAuth();
  React.useEffect(() => {
    if (token) registerPushNotifications(token);
  }, [token]);
  return <App />;
}

createRoot(document.getElementById('root')!).render( // <-- A CORREÇÃO ESTÁ AQUI
  <StrictMode>
    <AuthProvider>
      <UnitProvider>
        <Main />
      </UnitProvider>
    </AuthProvider>
  </StrictMode>
);
