import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

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

export default function Chatbot () {
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


  async function fetchServices() {
    setLoading(true);
    try {
      const { data: apiServices } = await api.get("/services")
      setServices(apiServices)
    } catch (error) {
      console.log(error)
      // TODO: show toast message to the user
    } finally {
      setLoading(false)
    }
  }

  async function fetchBarbers() {
    setLoading(true);
    try {
      const { data: apiBarbers } = await api.get("/barbers")
      setBarbers(apiBarbers)
    } catch (error) {
      console.log(error)
      setError('Erro ao buscar barbeiros.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchAvailableTimes() {
    setLoading(true);
    setAvailableTimes([]);
    setError('');
    try {
      const { data: apiTimes } = await api.get('/appointments/available', {
        params: {
          serviceId: selectedService?.id,
          barberId: selectedBarber?.id,
          date: selectedDate
        }
      });
      setAvailableTimes(apiTimes);
    } catch (error) {
      setError('Erro ao buscar horários disponíveis.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (step === 'service') {      
      fetchServices();
    }
    if (step === 'barber') {
      fetchBarbers();
    }
    if (step === 'time' && selectedService && selectedBarber && selectedDate) {
      fetchAvailableTimes();
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
          const res = await fetch(`/appointments/available?serviceId=${appointmentDetails.services[0].id}&barberId=${appointmentDetails.barber.id}&date=${rescheduleDate}`);
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
      const res = await fetch('/appointments', {
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
      const detailsRes = await fetch(`/appointments/${data.id}`, {
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
      const res = await fetch(`/appointments/${appointmentDetails.id}`, {
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
      const res = await fetch(`/appointments/${appointmentDetails.id}`, {
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
<div className="min-h-screen flex items-center justify-center bg-[#36454F]">
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-[#B87333]">Assistente Virtual</h2>

      {step === 'greeting' && (
        <div className="space-y-4">
          <div className="bg-[#4a5568] text-gray-200 rounded-lg p-3 min-w-50">{getGreeting()}! Sou o assistente virtual do <span className="font-semibold">Aparato</span>. Qual o seu nome, por favor?</div>
          <form onSubmit={handleNameSubmit} className="flex gap-2 mt-4">
            <input
              className="border border-[#B87333] bg-gray-700 text-white rounded-full px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-[#B87333] transition-all duration-200"
              placeholder="Digite seu nome..."
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className="bg-[#B87333] text-gray-800 px-6 py-2 rounded-full font-bold shadow-md hover:bg-[#a66a30] transition-colors duration-200">Enviar</button>
          </form>
        </div>
      )}

      {step === 'reminder' && (
        <div className="space-y-4">
          <div className="bg-[#4a5568] text-gray-200 rounded-lg p-3 max-w-xs">Deseja receber lembrete do seu agendamento?</div>
          <div className="flex flex-col gap-2 mt-4">
            <label className="text-gray-200 flex items-center gap-2 cursor-pointer">
              <input type="radio" name="reminder" checked={reminderChannel === 'email'} onChange={() => setReminderChannel('email')} className="accent-[#B87333]" /> E-mail
            </label>
            <label className="text-gray-200 flex items-center gap-2 cursor-pointer">
              <input type="radio" name="reminder" checked={reminderChannel === 'whatsapp'} onChange={() => setReminderChannel('whatsapp')} className="accent-[#B87333]" /> WhatsApp
            </label>
            <label className="text-gray-200 flex items-center gap-2 cursor-pointer">
              <input type="radio" name="reminder" checked={reminderChannel === 'both'} onChange={() => setReminderChannel('both')} className="accent-[#B87333]" /> Ambos
            </label>
            <label className="text-gray-200 flex items-center gap-2 cursor-pointer">
              <input type="radio" name="reminder" checked={reminderChannel === 'none'} onChange={() => setReminderChannel('none')} className="accent-[#B87333]" /> Não quero lembrete
            </label>
          </div>
          <button className="bg-[#B87333] text-gray-800 px-6 py-2 rounded-full font-bold shadow-md hover:bg-[#a66a30] transition-colors duration-200" onClick={() => setStep('service')}>Continuar</button>
        </div>
      )}

      {step === 'service' && (
        <div className="space-y-4">
          <div className="bg-[#4a5568] text-gray-200 rounded-lg p-3">Ótimo, <span className="font-semibold text-white">{name}</span>! Agora, escolha o serviço desejado:</div>
          {loading && <div className="text-gray-400 mt-2">Carregando serviços...</div>}
          {error && <div className="text-red-400 mt-2">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            {services.map(service => (
              <button
                key={service.id}
                className="w-full text-left bg-gray-700 text-gray-200 rounded-full p-4 hover:bg-gray-600 transition-colors duration-200 flex justify-between items-center"
                onClick={() => handleServiceSelect(service)}
              >
                <span>
                  <span className="font-semibold">{service.name}</span>
                  <span className="ml-2 text-gray-400 text-sm">({service.duration} min)</span>
                </span>
                <span className="font-bold text-[#B87333]">R$ {service.price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'barber' && selectedService && (
        <div className="space-y-4">
          <div className="bg-[#4a5568] text-gray-200 rounded-lg p-3">Deseja escolher um barbeiro específico?</div>
          {loading && <div className="text-gray-400 mt-2">Carregando barbeiros...</div>}
          {error && <div className="text-red-400 mt-2">{error}</div>}
          <div className="flex flex-wrap gap-2 mt-4">
            {barbers.map(barber => (
              <button
                key={barber.id}
                className="bg-[#B87333] text-gray-800 px-6 py-2 rounded-full font-bold shadow-md hover:bg-[#a66a30] transition-colors duration-200"
                onClick={() => handleBarberSelect(barber)}
              >
                <span className="font-semibold">{barber.name || barber.user?.name}</span>
              </button>
            ))}
          </div>
          <button
            className="w-full border border-gray-500 rounded-full p-3 bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors duration-200"
            onClick={() => handleBarberSelect(null)}
          >
            Não tenho preferência
          </button>
        </div>
      )}

      {step === 'date' && (
        <div className="space-y-4">
          <div className="bg-[#4a5568] text-gray-200 rounded-lg p-3">
            <p>Barbeiro selecionado: <span className="font-semibold">{selectedBarber ? (selectedBarber.name || selectedBarber.user?.name) : 'Sem preferência'}</span></p>
            <p>Serviço: <span className="font-semibold">{selectedService?.name}</span></p>
          </div>
          <div className="bg-[#4a5568] text-gray-200 rounded-lg p-3">Escolha uma data:</div>
          <div className="flex flex-col gap-2 mt-4">
            <input
              type="date"
              className="border border-[#B87333] bg-gray-700 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#B87333] transition-all duration-200"
              value={selectedDate}
              onChange={e => handleDateSelect(e.target.value)}
              aria-label="Escolha uma data"
            />
          </div>
          {selectedDate && (
            <button
              className="bg-[#B87333] text-gray-800 px-6 py-2 rounded-full font-bold shadow-md hover:bg-[#a66a30] transition-colors duration-200"
              onClick={() => setStep('time')}
              disabled={loading}
            >
              Ver horários disponíveis
            </button>
          )}
        </div>
      )}

      {step === 'time' && (
        <div className="space-y-4">
          <div className="bg-[#4a5568] text-gray-200 rounded-lg p-3">Horários disponíveis para {selectedDate && new Date(selectedDate).toLocaleDateString()}:</div>
          {loading && <div className="text-gray-400 mt-2">Carregando horários...</div>}
          {error && <div className="text-red-400 mt-2">{error}</div>}
          {availableTimes.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-4">
              {availableTimes.map(time => (
                <button
                  key={time}
                  className="bg-gray-700 text-gray-200 rounded-full px-4 py-2 hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleTimeSelect(time)}
                >
                  {time}
                </button>
              ))}
            </div>
          ) : !loading && <div className="text-gray-400 mt-2">Nenhum horário disponível.</div>}
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="bg-[#4a5568] text-gray-200 rounded-lg p-3">Resumo do agendamento:</div>
          <ul className="mb-4 space-y-1 text-gray-200">
            <li><b>Nome:</b> {name}</li>
            <li><b>Serviço:</b> {selectedService?.name}</li>
            <li><b>Barbeiro:</b> {selectedBarber ? (selectedBarber.name || selectedBarber.user?.name) : 'Sem preferência'}</li>
            <li><b>Data:</b> {selectedDate && new Date(selectedDate).toLocaleDateString()}</li>
            <li><b>Horário:</b> {selectedTime}</li>
          </ul>
          <button
            className="bg-[#B87333] text-gray-800 px-6 py-2 rounded-full font-bold shadow-md hover:bg-[#a66a30] transition-colors duration-200"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Agendando...' : 'Confirmar Agendamento'}
          </button>
          {error && <div className="text-red-400 mt-2">{error}</div>}
        </div>
      )}

      {step === 'success' && appointmentDetails && (
        <div className="space-y-4">
          {successMsg && <div className="mb-4 text-green-400 font-bold">{successMsg}</div>}
          <div className="bg-[#4a5568] text-gray-200 rounded-lg p-3">Detalhes do agendamento:</div>
          <ul className="mb-4 space-y-1 text-gray-200">
            <li><b>Nome:</b> {appointmentDetails.user?.name || name}</li>
            <li><b>Serviço:</b> {appointmentDetails.services?.[0]?.name || selectedService?.name || 'Sem preferência'}</li>
            <li><b>Barbeiro:</b> {appointmentDetails.barber?.name || selectedBarber?.name || 'Sem preferência'}</li>
            <li><b>Data:</b> {appointmentDetails.date ? new Date(appointmentDetails.date).toLocaleDateString('pt-BR') : ''}</li>
            <li><b>Horário:</b> {appointmentDetails.startTime} - {appointmentDetails.endTime}</li>
          </ul>
          <div className="text-gray-400 mb-4 text-sm">Você receberá um lembrete próximo ao horário do seu agendamento.</div>
          {cancelMsg && <div className="text-red-400 font-bold mt-2">{cancelMsg}</div>}
          <div className="flex gap-2 mt-4">
            <button className="bg-yellow-600 text-gray-800 px-4 py-2 rounded-full font-bold shadow-md hover:bg-yellow-500 transition-colors duration-200" onClick={handleStartReschedule}>
              Reagendar
            </button>
            <button className="bg-red-600 text-white px-4 py-2 rounded-full font-bold shadow-md hover:bg-red-500 transition-colors duration-200" onClick={handleCancel}>
              Cancelar
            </button>
          </div>
          {isRescheduling && (
            <div className="mt-4 space-y-4">
              <div className="bg-[#4a5568] text-gray-200 rounded-lg p-3">Escolha uma nova data:</div>
              <input
                type="date"
                className="border border-[#B87333] bg-gray-700 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#B87333] transition-all duration-200"
                value={rescheduleDate}
                onChange={e => handleRescheduleDate(e.target.value)}
                onBlur={e => handleRescheduleDate(e.target.value)}
                aria-label="Escolha uma nova data"
              />
              {rescheduleTimes.length > 0 && (
                <div className="bg-[#4a5568] text-gray-200 rounded-lg p-3">Horários disponíveis:</div>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {rescheduleTimes.map(time => (
                  <button
                    key={time}
                    className={`rounded-full px-4 py-2 ${rescheduleTime === time ? 'bg-[#B87333] text-gray-800 font-bold shadow-md' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                    onClick={() => setRescheduleTime(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-green-600 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-green-500 transition-colors duration-200"
                  onClick={handleRescheduleConfirm}
                  disabled={loading || !rescheduleDate || !rescheduleTime}
                >
                  {loading ? 'Reagendando...' : 'Confirmar novo horário'}
                </button>
                <button
                  className="ml-2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
                  onClick={() => setIsRescheduling(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);
}