import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface AppointmentActionsProps {
  appointmentDetails: any;
  serviceToken: string | null;
  onUpdate: (updated: any) => void;
  onCancel: () => void;
}

export default function AppointmentActions({
  appointmentDetails,
  serviceToken,
  onUpdate,
  onCancel
}: AppointmentActionsProps) {
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleTimes, setRescheduleTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  useEffect(() => {
    if (isRescheduling && rescheduleDate && appointmentDetails?.services?.[0] && appointmentDetails?.barber) {
      (async () => {
        setLoading(true);
        try {
          const res = await api.get('/chatbot/open', {
            params: {
              serviceId: appointmentDetails.services[0].id,
              barberId: appointmentDetails.barber.id,
              date: rescheduleDate
            }
          });
          setRescheduleTimes(res.data);
        } catch {
          setError('Erro ao buscar horários para reagendamento.');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [isRescheduling, rescheduleDate, appointmentDetails]);

  const handleCancel = async () => {
    if (!appointmentDetails?.id || !serviceToken) return;
    setLoading(true);
    try {
      await api.delete(`/chatbot/${appointmentDetails.id}`);
      onCancel();
    } catch {
      setError('Erro ao cancelar agendamento.');
    } finally {
      setLoading(false);
    }
  };


  const handleRescheduleConfirm = async () => {
    if (!appointmentDetails?.id || !rescheduleDate || !rescheduleTime || !serviceToken) return;

    setLoading(true);
    try {
      const duration = appointmentDetails.services?.[0]?.duration || 30;
      const startDate = new Date(`${rescheduleDate}T${rescheduleTime}`);
      const endDate = new Date(startDate.getTime() + duration * 60000);
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

      const res = await api.put(`/chatbot/${appointmentDetails.id}`, {
        date: rescheduleDate,
        startTime: rescheduleTime,
        endTime,
        serviceToken
      });

      onUpdate(res.data);
      setIsRescheduling(false);
    } catch {
      setError('Erro ao remarcar agendamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
     <div className='min-h-screen w-full flex flex-col items-center justify-center bg-[#36454F] text-white p-8 font-sans'>
   <a href="/chatbot" className='p-2 bg-[#B87333] text-white rounded-lg absolute top-4 right-4 hover:bg-[#d88f4c]'>Novo agendamento</a>

      <div className="grid grid-cols-1 sm:grid-cols-3 items-start justify-center w-full max-w-6xl gap-8 mt-7">
        
        <div className="col-span-1 sm:col-span-2 bg-gray-800 rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 border-[#B87333]">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-200">Resumo do Agendamento</h2>
          <ul className="space-y-6 text-xl">
            <li className="flex flex-col">
              <span className="font-medium text-gray-400 uppercase tracking-wide">Nome:</span>
              <span className="font-semibold text-gray-100">{appointmentDetails?.user?.name}</span>
            </li>
            <li className="flex flex-col">
              <span className="font-medium text-gray-400 uppercase tracking-wide">Serviço:</span>
              <span className="font-semibold text-gray-100">{appointmentDetails?.services?.[0]?.name}</span>
            </li>
            <li className="flex flex-col">
              <span className="font-medium text-gray-400 uppercase tracking-wide">Barbeiro:</span>
              <span className="font-semibold text-gray-100">{appointmentDetails?.barber?.name}</span>
            </li>
            <li className="flex flex-col">
              <span className="font-medium text-gray-400 uppercase tracking-wide">Data:</span>
              <span className="font-semibold text-gray-100">
                {appointmentDetails?.date
                  ? new Date(appointmentDetails.date).toLocaleDateString('pt-BR')
                  : ''}
              </span>
            </li>
            <li className="flex flex-col">
              <span className="font-medium text-gray-400 uppercase tracking-wide">Horário:</span>
              <span className="font-semibold text-gray-100">{appointmentDetails?.startTime} - {appointmentDetails?.endTime}</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons Block */}
        <div className="col-span-1 flex flex-col items-center justify-start sm:justify-center w-full h-full gap-6">
          <div className="bg-gray-800 rounded-2xl p-6 w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 border-[#B87333]">
            <h2 className="text-2xl font-bold mb-6 text-center text-[#B87333]">Reagendar</h2>
            <button
              className="w-full bg-gradient-to-r from-[#B87333] to-[#dc9048] text-gray-900 font-extrabold py-5 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4"
              onClick={() => setIsRescheduling(true)}
            >
              Reagendar
            </button>
          </div>
          
          <div className="bg-gray-800 rounded-2xl p-6 w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 border-[#B87333]">
            <h2 className="text-2xl font-bold mb-6 text-center text-[#B87333]">Cancelar</h2>
            <button
              className="w-full bg-gradient-to-r from-[#B87333] to-[#B87333] text-gray-900 font-extrabold py-5 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4"
              onClick={handleCancel}
              disabled={loading}
            >
              {loading ? 'Cancelando...' : 'Cancelar'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Rescheduling Form - Renders below the main blocks */}
      {isRescheduling && (
        <div className="mt-8 p-8 bg-gray-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-2xl space-y-6 border-[#B87333]">
          <h3 className="text-2xl font-bold text-center text-[#B87333]">Escolha um novo horário</h3>
          <input
            type="date"
            value={rescheduleDate}
            onChange={(e) => setRescheduleDate(e.target.value)}
            className="w-full bg-gray-900 border-2 border-[#B87333] p-4 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#B87333]"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
            {rescheduleTimes.map((time) => (
              <button
                key={time}
                className={`
                  w-full px-4 py-3 rounded-xl font-semibold shadow-md transition-all transform hover:scale-105
                  ${rescheduleTime === time
                    ? 'bg-gradient-to-r from-[#B87333] to-[#B87333] text-gray-900'
                    : 'bg-gray-900 text-gray-200 border border-gray-700 hover:bg-gray-700'
                  }
                `}
                onClick={() => setRescheduleTime(time)}
              >
                {time}
              </button>
            ))}
          </div>
          <button
            onClick={handleRescheduleConfirm}
            disabled={loading || !rescheduleDate || !rescheduleTime}
            className={`
              w-full font-bold py-5 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105
              ${loading || !rescheduleDate || !rescheduleTime
                ? 'bg-[#B87333] text-gray-950 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-[0_15px_30px_rgba(34,197,94,0.5)] focus:outline-none focus:ring-4 focus:ring-green-500'
              }
            `}
          >
            {loading ? 'Reagendando...' : 'Confirmar novo horário'}
          </button>
        </div>
      )}
      {error && (
        <div className="text-red-500 mt-4 text-center p-4 rounded-xl bg-red-900 border border-red-500 shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
};
