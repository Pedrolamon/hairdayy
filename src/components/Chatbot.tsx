import React, { useState, useEffect } from 'react';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
}

interface Barber {
  id: number;
  name: string;
  user: { name: string };
}

interface Slot {
  date: string; // YYYY-MM-DD
  times: string[]; // ['09:00', '09:30', ...]
}

const Chatbot: React.FC = () => {
  const [step, setStep] = useState<'greeting' | 'reminder' | 'service' | 'barber' | 'date' | 'time' | 'confirm' | 'success'>('greeting');
  const [name, setName] = useState('');
  const [input, setInput] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [cancelMsg, setCancelMsg] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleTimes, setRescheduleTimes] = useState<string[]>([]);
  const [reminderChannel, setReminderChannel] = useState<'email' | 'whatsapp' | 'both' | 'none'>('email');

  useEffect(() => {
    if (step === 'service') {
      setLoading(true);
      fetch('/api/services')
        .then(res => res.json())
        .then(data => {
          setServices(data);
          setLoading(false);
        })
        .catch(() => {
          setError('Erro ao buscar serviços.');
          setLoading(false);
        });
    }
    if (step === 'barber') {
      setLoading(true);
      fetch('/api/barbers')
        .then(res => res.json())
        .then(data => {
          setBarbers(data);
          setLoading(false);
        })
        .catch(() => {
          setError('Erro ao buscar barbeiros.');
          setLoading(false);
        });
    }
    // Buscar horários disponíveis só quando step === 'time' e data selecionada
    if (step === 'time' && selectedService && selectedBarber && selectedDate) {
      setLoading(true);
      setAvailableTimes([]);
      setError('');
      fetch(`/api/appointments/available?serviceId=${selectedService.id}&barberId=${selectedBarber.id}&date=${selectedDate}`)
        .then(res => res.json())
        .then(data => {
          setAvailableTimes(data);
          setLoading(false);
        })
        .catch(() => {
          setError('Erro ao buscar horários disponíveis.');
          setLoading(false);
        });
    }
  }, [step, selectedService, selectedBarber, selectedDate]);

  useEffect(() => {
    console.log('useEffect reagendamento', { isRescheduling, rescheduleDate, appointmentDetails });
    if (
      isRescheduling &&
      rescheduleDate &&
      appointmentDetails?.services?.[0] &&
      appointmentDetails?.barber
    ) {
      (async () => {
        setLoading(true);
        try {
          console.log('Chamando fetch de horários para reagendamento:', rescheduleDate, appointmentDetails.services[0].id, appointmentDetails.barber.id);
          const res = await fetch(`/api/appointments/available?serviceId=${appointmentDetails.services[0].id}&barberId=${appointmentDetails.barber.id}&date=${rescheduleDate}`);
          const times = await res.json();
          console.log('Horários recebidos para reagendamento:', times);
          setRescheduleTimes(times);
          console.log('rescheduleTimes após fetch:', times);
        } catch {
          setError('Erro ao buscar horários para reagendamento.');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [isRescheduling, rescheduleDate, appointmentDetails]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setName(input.trim());
      setInput('');
      setStep('service');
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('barber');
  };

  const handleBarberSelect = (barber: Barber | null) => {
    setSelectedBarber(barber);
    setStep('date');
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setStep('time');
  };
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      // Calcular endTime com base na duração do serviço
      const [hour, minute] = selectedTime.split(':').map(Number);
      const duration = selectedService?.duration || 30;
      const startDate = new Date(`${selectedDate}T${selectedTime}`);
      const endDate = new Date(startDate.getTime() + duration * 60000);
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          startTime: selectedTime,
          endTime,
          serviceIds: [selectedService?.id],
          barberId: selectedBarber?.id,
          reminderChannel,
        }),
      });
      if (!res.ok) throw new Error('Erro ao agendar.');
      const data = await res.json();
      console.log('handleConfirm: data do POST', data);
      // Buscar detalhes reais do agendamento
      const detailsRes = await fetch(`/api/appointments/${data.id}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const details = await detailsRes.json();
      setAppointmentDetails(Array.isArray(details) ? null : details);
      console.log('setAppointmentDetails (detalhes):', details, Array.isArray(details));
      setSuccessMsg('Agendamento realizado com sucesso!');
      setStep('success');
    } catch (err) {
      setError('Erro ao confirmar agendamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!appointmentDetails?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/appointments/${appointmentDetails.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!res.ok) throw new Error('Erro ao cancelar.');
      setCancelMsg('Agendamento cancelado com sucesso.');
    } catch (err) {
      setError('Erro ao cancelar agendamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartReschedule = () => {
    setIsRescheduling(true);
    setRescheduleDate('');
    setRescheduleTime('');
    setRescheduleTimes([]);
  };

  const handleRescheduleDate = (date: string) => {
    console.log('handleRescheduleDate chamada com:', date);
    setRescheduleDate(date);
    setRescheduleTime('');
    setRescheduleTimes([]);
  };

  const handleRescheduleConfirm = async () => {
    if (!appointmentDetails?.id || !rescheduleDate || !rescheduleTime) return;
    setLoading(true);
    setError('');
    try {
      // Calcular endTime com base na duração do serviço
      const duration = appointmentDetails.services?.[0]?.duration || 30;
      const startDate = new Date(`${rescheduleDate}T${rescheduleTime}`);
      const endDate = new Date(startDate.getTime() + duration * 60000);
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
      const res = await fetch(`/api/appointments/${appointmentDetails.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: rescheduleDate, startTime: rescheduleTime, endTime }),
      });
      if (!res.ok) throw new Error('Erro ao reagendar.');
      const updated = await res.json();
      setAppointmentDetails(Array.isArray(updated) ? null : updated);
      console.log('setAppointmentDetails (updated):', updated, Array.isArray(updated));
      setIsRescheduling(false);
      setSuccessMsg('Agendamento remarcado com sucesso!');
    } catch (err) {
      setError('Erro ao remarcar agendamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded shadow p-6">
      <h2 className="text-xl font-bold mb-4">Assistente Virtual - Agendamento</h2>
      {step === 'greeting' && (
        <div>
          <div className="mb-4">{getGreeting()}! Sou o assistente virtual da <span className="font-semibold">Barbearia</span>. Qual o seu nome, por favor?</div>
          <form onSubmit={handleNameSubmit} className="flex gap-2">
            <input
              className="border rounded px-3 py-2 flex-1"
              placeholder="Digite seu nome..."
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Enviar</button>
          </form>
        </div>
      )}
      {step === 'reminder' && (
        <div>
          <div className="mb-4">Deseja receber lembrete do seu agendamento?</div>
          <div className="flex flex-col gap-2 mb-4">
            <label><input type="radio" name="reminder" checked={reminderChannel === 'email'} onChange={() => setReminderChannel('email')} /> E-mail</label>
            <label><input type="radio" name="reminder" checked={reminderChannel === 'whatsapp'} onChange={() => setReminderChannel('whatsapp')} /> WhatsApp</label>
            <label><input type="radio" name="reminder" checked={reminderChannel === 'both'} onChange={() => setReminderChannel('both')} /> Ambos</label>
            <label><input type="radio" name="reminder" checked={reminderChannel === 'none'} onChange={() => setReminderChannel('none')} /> Não quero lembrete</label>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setStep('service')}>Continuar</button>
        </div>
      )}
      {step === 'service' && (
        <div>
          <div className="mb-4">Ótimo, <span className="font-semibold">{name}</span>! Agora, escolha o serviço desejado:</div>
          {loading && <div className="text-gray-500">Carregando serviços...</div>}
          {error && <div className="text-red-500">{error}</div>}
          <ul className="space-y-2">
            {services.map(service => (
              <li key={service.id}>
                <button
                  className="w-full text-left border rounded p-3 hover:bg-blue-50 flex justify-between items-center"
                  onClick={() => handleServiceSelect(service)}
                >
                  <span>
                    <span className="font-semibold">{service.name}</span>
                    <span className="ml-2 text-gray-500 text-sm">({service.duration} min)</span>
                  </span>
                  <span className="font-bold text-blue-600">R$ {service.price.toFixed(2)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {step === 'barber' && selectedService && (
        <div>
          <div className="mb-4">Deseja escolher um barbeiro específico?</div>
          {loading && <div className="text-gray-500">Carregando barbeiros...</div>}
          {error && <div className="text-red-500">{error}</div>}
          <ul className="space-y-2 mb-4">
            {barbers.map(barber => (
              <li key={barber.id}>
                <button
                  className="w-full text-left border rounded p-3 hover:bg-green-50 flex justify-between items-center"
                  onClick={() => handleBarberSelect(barber)}
                >
                  <span className="font-semibold">{barber.name || barber.user?.name}</span>
                </button>
              </li>
            ))}
          </ul>
          <button
            className="w-full border rounded p-3 bg-gray-100 hover:bg-gray-200"
            onClick={() => handleBarberSelect(null)}
          >
            Não tenho preferência de barbeiro
          </button>
        </div>
      )}
      {step === 'date' && (
        <div>
          <div className="mb-4">Barbeiro selecionado: <span className="font-semibold">{selectedBarber ? (selectedBarber.name || selectedBarber.user?.name) : 'Sem preferência'}</span></div>
          <div className="mb-4">Serviço: <span className="font-semibold">{selectedService?.name}</span></div>
          <div className="mb-2 font-semibold">Escolha uma data:</div>
          <input
            type="date"
            className="border rounded px-3 py-2 mb-4"
            value={selectedDate}
            onChange={e => handleDateSelect(e.target.value)}
            aria-label="Escolha uma data"
          />
          {selectedDate && (
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
              onClick={() => setStep('time')}
              disabled={loading}
            >
              Ver horários disponíveis
            </button>
          )}
        </div>
      )}
      {step === 'time' && (
        <div>
          <div className="mb-4">Horários disponíveis para {selectedDate && new Date(selectedDate).toLocaleDateString()}:</div>
          {loading && <div className="text-gray-500">Carregando horários...</div>}
          {error && <div className="text-red-500">{error}</div>}
          {availableTimes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableTimes.map(time => (
                <button
                  key={time}
                  className="border rounded px-3 py-2 hover:bg-blue-100"
                  onClick={() => handleTimeSelect(time)}
                >
                  {time}
                </button>
              ))}
            </div>
          ) : !loading && <div className="text-gray-500">Nenhum horário disponível.</div>}
        </div>
      )}
      {step === 'confirm' && (
        <div>
          <div className="mb-4">Resumo do agendamento:</div>
          <ul className="mb-4 space-y-1">
            <li><b>Nome:</b> {name}</li>
            <li><b>Serviço:</b> {selectedService?.name}</li>
            <li><b>Barbeiro:</b> {selectedBarber ? (selectedBarber.name || selectedBarber.user?.name) : 'Sem preferência'}</li>
            <li><b>Data:</b> {selectedDate && new Date(selectedDate).toLocaleDateString()}</li>
            <li><b>Horário:</b> {selectedTime}</li>
          </ul>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Agendando...' : 'Confirmar Agendamento'}
          </button>
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </div>
      )}
      {step === 'success' && appointmentDetails && (
        <div>
          {successMsg && <div className="mb-4 text-green-700 font-bold">{successMsg}</div>}
          <div className="mb-2">Detalhes do agendamento:</div>
          <ul className="mb-4 space-y-1">
            <li><b>Nome:</b> {appointmentDetails.user?.name || name}</li>
            <li><b>Serviço:</b> {appointmentDetails.services?.[0]?.name || selectedService?.name || 'Sem preferência'}</li>
            <li><b>Barbeiro:</b> {appointmentDetails.barber?.name || selectedBarber?.name || 'Sem preferência'}</li>
            <li><b>Data:</b> {appointmentDetails.date ? new Date(appointmentDetails.date).toLocaleDateString('pt-BR') : ''}</li>
            <li><b>Horário:</b> {appointmentDetails.startTime} - {appointmentDetails.endTime}</li>
          </ul>
          <div className="text-gray-500 mb-4">Você receberá um lembrete próximo ao horário do seu agendamento.</div>
          {cancelMsg && <div className="text-red-600 font-bold mt-2">{cancelMsg}</div>}
          <div className="flex gap-2 mt-4">
            <button className="bg-yellow-500 text-white px-4 py-2 rounded" onClick={handleStartReschedule}>
              Reagendar
            </button>
            <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={handleCancel}>
              Cancelar agendamento
            </button>
          </div>
          {isRescheduling && (
            <div className="mb-4">
              <div className="mb-2 font-semibold">Escolha uma nova data:</div>
              <input
                type="date"
                className="border rounded px-3 py-2 mb-2"
                value={rescheduleDate}
                onChange={e => handleRescheduleDate(e.target.value)}
                onBlur={e => handleRescheduleDate(e.target.value)}
                aria-label="Escolha uma nova data"
              />
              {rescheduleTimes.length > 0 && (
                <div className="mb-2">Horários disponíveis:</div>
              )}
              <div className="flex flex-wrap gap-2 mb-2">
                {rescheduleTimes.map(time => (
                  <button
                    key={time}
                    className={`border rounded px-3 py-2 ${rescheduleTime === time ? 'bg-blue-200' : 'hover:bg-blue-100'}`}
                    onClick={() => setRescheduleTime(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded"
                onClick={handleRescheduleConfirm}
                disabled={loading || !rescheduleDate || !rescheduleTime}
              >
                {loading ? 'Reagendando...' : 'Confirmar novo horário'}
              </button>
              <button
                className="ml-2 text-gray-600 underline"
                onClick={() => setIsRescheduling(false)}
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Chatbot; 