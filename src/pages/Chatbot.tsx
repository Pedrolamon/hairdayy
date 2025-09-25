import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { getPersonalInformation, getBusinessName, getAvailableDates } from '../api/personalInformation';
import type { AvailableDate } from '../api/personalInformation';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'; 
import timezone from 'dayjs/plugin/timezone'; 

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'America/Sao_Paulo'; 


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


export default function Chatbot () {
  const [step, setStep] = useState<'greeting' | 'reminder' | 'service' | 'barber' | 'date' | 'time' | 'confirm' | 'success'>('greeting');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('')
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [cancelMsg, setCancelMsg] = useState('');
  const [reminderChannel, setReminderChannel] = useState<'email' | 'whatsapp' | 'both' | 'none'>('email');
  const [businessName, setBusinessName] = useState<string>('Aparato');
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  

  async function fetchServices() {
    setLoading(true);
    try {
      const { data: apiServices } = await api.get("/publicService")
      setServices(apiServices)
    } catch (error) {
      console.log(error)
      setError('Error searching for services.');
    } finally {
      setLoading(false)
    }
  }

  async function fetchBarbers() {
    setLoading(true);
    try {
      const { data: apiBarbers } = await api.get("/barberss")
      const normalizedBarbers = apiBarbers.map((barber: any) => ({
      ...barber,
      name: barber.name || barber.user?.name 
    }));
    setBarbers(normalizedBarbers);
    } catch (error) {
      console.log(error)
      setError('Error searching for barbers.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchAvailableTimes() {
    setLoading(true);
    setAvailableTimes([]);
    setError('');
    try {
      const formattedDate = new Date(selectedDate).toISOString().split('T')[0];

      console.log('Searching for times for:', {
      serviceId: selectedService?.id,
      barberId: selectedBarber?.id,
      date: formattedDate
    });

      const { data: apiTimes } = await api.get('/chatbot/open', {
        params: {
          serviceId: selectedService?.id,
          barberId: selectedBarber?.id,
          date: formattedDate
        }
      });
      console.log('API data received (times):', apiTimes);
      setAvailableTimes(apiTimes);
    } catch (error) {
      setError('Error searching for available times.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAvailableDates() {
    if (!selectedBarber) return;

    setLoading(true);
    setAvailableDates([]);
    setError('');
    try {
      console.log('Buscando datas disponíveis para o barbeiro:', selectedBarber.id);
      const dates = await getAvailableDates(selectedBarber.id.toString());
      console.log('Datas recebidas:', dates);
      setAvailableDates(dates);
    } catch (error) {
      console.error('Erro ao buscar datas disponíveis:', error);
      setError('Error searching for available dates.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const fetchBusinessName = async () => {
      try {
        const name = await getBusinessName();
        setBusinessName(name);
      } catch (error) {
        console.error('Erro ao buscar nome da empresa:', error);
      }
    };
    fetchBusinessName();
  }, []);

  useEffect(() => {
    if (step === 'service') {
      fetchServices();
    }
    if (step === 'barber') {
      fetchBarbers();
    }
    if (step === 'date' && selectedBarber) {
      fetchAvailableDates();
    }
    if (step === 'time' && selectedService && selectedBarber && selectedDate) {
      fetchAvailableTimes();
    }
  }, [step, selectedService, selectedBarber, selectedDate]);

  

  const handleNameSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (name.trim() && phone.trim()) {
    setStep("service");
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
  const [serviceToken, setServiceToken] = useState<string | null>(null);
  
  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const [hour, minute] = selectedTime.split(':').map(Number);
      const duration = selectedService?.duration || 30;
      const startDate = new Date(`${selectedDate}T${selectedTime}`);
      const endDate = new Date(startDate.getTime() + duration * 60000);
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
     
      const res = await api.post('/chatbot', {
          date: selectedDate,
          startTime: selectedTime,
          endTime,
          serviceIds: [selectedService?.id],
          barberId: selectedBarber?.id,
          reminderChannel,
          clientName: name, 
          phone: phone,
        });
      const data = res.data;
      setAppointmentDetails(data);
      setServiceToken(data.serviceToken); 
      setSuccessMsg('Scheduling completed successfully!');
      setStep('success')
      const detailsRes = await api.get(`/chatbot/${data.id}`);
      const details = await detailsRes.data
      setAppointmentDetails(Array.isArray(details) ? null : details);
      setSuccessMsg('Scheduling completed successfully!');
      setStep('success');
    } catch (err) {
      setError('Error confirming appointmen.');
    } finally {
      setLoading(false);
    }
  };
  

  return (
<div className="h-screen w-screen flex items-center justify-center bg-[#36454F] relative flex-col">
   <a href={`/clientAppointments?phone=${phone}`} className='p-2 bg-[#B87333] text-white rounded-lg absolute top-4 right-4 hover:bg-[#d88f4c]'>My appointments</a>
    <div className=" w-full max-w-[180vh] "> 
      <h2 className="text-3xl font-bold mb-6 text-[#B87333]">Virtual Assistant</h2>
    
      {step === 'greeting' && (
        <div className="space-y-4">
          <div className="bg-[#4a5568] text-gray-200 text-lg rounded-lg p-5 min-w-50">{getGreeting()}! I'm the virtual assistant for <span className="font-semibold">{businessName}</span>. What is your name, please?</div>
          <form onSubmit={handleNameSubmit} className="flex gap-2 mt-4">
            <input
              className="border border-[#B87333] bg-gray-700 text-white rounded-full px-5 py-3 flex-1 focus:outline-none focus:ring-2 focus:ring-[#B87333] transition-all duration-200"
              placeholder="Enter your name..."
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              required
            />
              <input
              className="border border-[#B87333] bg-gray-700 text-white rounded-full px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-[#B87333] transition-all duration-200"
              placeholder="Enter your Number..."
              value={phone}
              onChange={e => setPhone(e.target.value)}
              autoFocus
              required
            />
            <button type="submit" className="bg-[#B87333] text-gray-800 px-6 py-2 rounded-full font-bold shadow-md hover:bg-[#a66a30] transition-colors duration-200">Send</button>
          </form>
        </div>
      )}

      {step === 'reminder' && (
        <div className="space-y-4">
          <div className="bg-[#4a5568] text-gray-200 rounded-lg p-3 max-w-xs">Do you want to receive a reminder of your appointment?</div>
          <div className="flex flex-col gap-2 mt-4">
            <label className="text-gray-200 flex items-center gap-2 cursor-pointer">
              <input type="radio" name="reminder" checked={reminderChannel === 'email'} onChange={() => setReminderChannel('email')} className="accent-[#B87333]" /> E-mail
            </label>
            <label className="text-gray-200 flex items-center gap-2 cursor-pointer">
              <input type="radio" name="reminder" checked={reminderChannel === 'whatsapp'} onChange={() => setReminderChannel('whatsapp')} className="accent-[#B87333]" /> WhatsApp
            </label>
            <label className="text-gray-200 flex items-center gap-2 cursor-pointer">
              <input type="radio" name="reminder" checked={reminderChannel === 'both'} onChange={() => setReminderChannel('both')} className="accent-[#B87333]" /> Both
            </label>
            <label className="text-gray-200 flex items-center gap-2 cursor-pointer">
              <input type="radio" name="reminder" checked={reminderChannel === 'none'} onChange={() => setReminderChannel('none')} className="accent-[#B87333]" /> I don't want a reminder
            </label>
          </div>
          <button className="bg-[#B87333] text-gray-800 px-6 py-2 rounded-full font-bold shadow-md hover:bg-[#a66a30] transition-colors duration-200" onClick={() => setStep('service')}>Continue</button>
        </div>
      )}

      {step === 'service' && (
        <div className="space-y-4">
          <div className="bg-[#4a5568] text-gray-200 rounded-lg p-3">Excellent, <span className="font-semibold text-white">{name}</span>!Now, choose the desired service :</div>
          {loading && <div className="text-gray-400 mt-2">Loading services...</div>}
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
          <div className="bg-[#4a5568] text-gray-200 rounded-lg p-3">Choose a barber</div>
          {loading && <div className="text-gray-400 mt-2">Loading barbers...</div>}
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
        </div>
      )}

      {step === 'date' && (
        <div className="space-y-4">
          <div className="bg-[#4a5568] text-gray-200 rounded-lg p-3">
            <p>Selected barber: <span className="font-semibold">{selectedBarber ? (selectedBarber.name || selectedBarber.user?.name) : 'No preference'}</span></p>
            <p>Service: <span className="font-semibold">{selectedService?.name}</span></p>
          </div>
          <div className="bg-[#4a5568] text-gray-200 rounded-lg p-3">Choose an available date:</div>
          {loading && <div className="text-gray-400 mt-2">Loading available dates...</div>}
          {error && <div className="text-red-400 mt-2">{error}</div>}
          {availableDates.length > 0 ? (
            <div className="date-carousel">
              {availableDates.map(date => (
                <button
                  key={date.date}
                  className={`date-card bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-20 transition-all duration-200 flex flex-col items-center justify-center border-2 focus:outline-none ${
                    selectedDate === date.date
                      ? 'border-[#B87333] bg-[#B87333] bg-opacity-20'
                      : 'border-transparent hover:border-[#B87333]'
                  }`}
                  onClick={() => handleDateSelect(date.date)}
                >
                  <div className="text-lg font-medium text-gray-300 mb-1">{date.dayOfWeek}</div>
                  <div className="text-2xl font-bold text-[#B87333] mb-1">{date.day}</div>
                  <div className="text-xs text-gray-400">{date.month}</div>
                </button>
              ))}
            </div>
          ) : !loading && <div className="text-gray-400 mt-2">No dates available.</div>}
        </div>
      )}

      {step === 'time' && (
        <div className="space-y-4 w-full">
          <div className="bg-[#4a5568] text-gray-200 rounded-lg p-3">Available times for {selectedDate && selectedDate.split('-').reverse().join('/')}:</div>
          {loading && <div className="text-gray-400 mt-2">Loading schedules...</div>}
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
          ) : !loading && <div className="text-gray-400 mt-2">No times available.</div>}
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="bg-[#4a5568] text-gray-200 rounded-lg p-3">Scheduling Summary:</div>
          <ul className="mb-4 space-y-1 text-gray-200">
            <li><b>Nome:</b> {name}</li>
            <li><b>Service:</b> {selectedService?.name}</li>
            <li><b>Barber:</b> {selectedBarber ? (selectedBarber.name || selectedBarber.user?.name) : 'No preference'}</li>
            <li><b>Data:</b> {selectedDate && selectedDate.split('-').reverse().join('/')}</li>
            <li><b>Time:</b> {selectedTime}</li>
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
          <div className="bg-[#4a5568] text-gray-200 rounded-lg p-3">Scheduling details:</div>
          <ul className="mb-4 space-y-1 text-gray-200">
            <li><b>Name:</b> {appointmentDetails.user?.name || name}</li>
            <li><b>Service:</b> {appointmentDetails.services?.[0]?.name || selectedService?.name || 'No preference'}</li>
            <li><b>Barber:</b> {appointmentDetails.barber?.name || selectedBarber?.name || 'No preference'}</li>
            <li>
              <b>Data:</b>
              {
                (() => {
                  const dateString = appointmentDetails.date.split('T')[0];
                  const [year, month, day] = dateString.split('-');
                  const displayDate = `${day}/${month}/${year}`;
                  console.log("Data para exibição (corrigida):", displayDate);
                  return displayDate;
                })()
              }
            </li>
            <li><b>Time:</b> {appointmentDetails.startTime} - {appointmentDetails.endTime}</li>
          </ul>
          <div className="text-gray-400 mb-4 text-sm">You will receive a reminder closer to your appointment time..</div>
          {cancelMsg && <div className="text-red-400 font-bold mt-2">{cancelMsg}</div>}
</div>
)}
</div>
</div>
);
}
