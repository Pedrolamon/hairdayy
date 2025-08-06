self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Notificação Hairday';
  const options = {
    body: data.body || 'Você tem uma nova notificação.',
    icon: '/vite.svg',
  };
  event.waitUntil(self.registration.showNotification(title, options));
}); 