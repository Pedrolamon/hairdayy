import '@testing-library/jest-dom';

// Mock global do fetch para testes
global.fetch = jest.fn((input, options) => {
  const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();
  if (url.startsWith('/api/appointments/available')) {
    const params = new URLSearchParams(url.split('?')[1]);
    if (params.get('date') === '2024-06-20') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(['09:00'])
      } as Response);
    }
    if (params.get('date') === '2024-06-21') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(['09:30'])
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([])
    } as Response);
  }
  if (url === '/api/appointments' && options?.method === 'POST') {
    // Criação de agendamento
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 123 })
    } as Response);
  }
  if (url.match(/^\/api\/appointments\/\d+$/) && (!options?.method || options?.method === 'GET')) {
    // GET de detalhes do agendamento
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        id: 123,
        user: { name: 'Cliente Teste' },
        services: [{ id: 1, name: 'Corte', duration: 30, price: 25 }],
        barber: { id: 1, name: 'Barbeiro 1' },
        date: '2024-06-21',
        startTime: '09:30',
        endTime: '10:00',
        status: 'scheduled',
      })
    } as Response);
  }
  if (url.match(/^\/api\/appointments\/\d+$/) && options?.method === 'PUT') {
    // PUT de reagendamento/cancelamento
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        id: 123,
        user: { name: 'Cliente Teste' },
        services: [{ id: 1, name: 'Corte', duration: 30, price: 25 }],
        barber: { id: 1, name: 'Barbeiro 1' },
        date: '2024-06-21',
        startTime: '09:30',
        endTime: '10:00',
        status: 'scheduled',
      })
    } as Response);
  }
  if (url.startsWith('/api/services')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([{ id: 1, name: 'Corte', duration: 30, price: 25 }])
    } as Response);
  }
  if (url.startsWith('/api/barbers')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([{ id: 1, name: 'Barbeiro 1' }])
    } as Response);
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve([])
  } as Response);
}); 