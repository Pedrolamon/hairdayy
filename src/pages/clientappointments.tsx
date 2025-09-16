import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

interface AppointmentActionsProps {
  appointmentDetails?: any;
  serviceToken?: string | null;
  onUpdate?: (updated: any) => void;
  onCancel?: () => void;
}

export default function AppointmentActions({
  appointmentDetails: propAppointmentDetails,
  serviceToken: propServiceToken,
  onUpdate,
  onCancel
}: AppointmentActionsProps) {
  const [searchParams] = useSearchParams();
  const phone = searchParams.get('phone');
 
  const storedAppointment = localStorage.getItem('lastAppointment');
  const initialAppointmentState = storedAppointment ? JSON.parse(storedAppointment) : propAppointmentDetails;

  const [appointmentDetails, setAppointmentDetails] = useState<any>(propAppointmentDetails || null);
  const [serviceToken, setServiceToken] = useState<string | null>(propServiceToken || null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  useEffect(() => {
    if (phone && !appointmentDetails) {
      (async () => {
        setLoading(true);
        try {
          const res = await api.get('/chatbot/by-phone', {
            params: { phone }
          });
          if (res.data.length > 0) {
            const latestAppointment = res.data[0];
            setAppointmentDetails(res.data[0]); // Get the latest
            setServiceToken(res.data[0].serviceToken);
            localStorage.setItem('lastAppointment', JSON.stringify(latestAppointment));
          } else {
            setError('Nenhum agendamento encontrado para este telefone.');
          }
        } catch (error) {
          setError('Erro ao buscar agendamento.');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [phone, appointmentDetails]);



  const handleCancel = async () => {
    if (!appointmentDetails?.id) {
      return;
    }
    setLoading(true);
    try {
      const response = await api.delete(`/chatbot/${appointmentDetails.id}`);
      onCancel?.();
      localStorage.removeItem('lastAppointment');
      // Redirect to chatbot after successful cancel
      window.location.href = '/Chatbot';
    } catch (error) {
      setError('Erro ao cancelar agendamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
     <div className='min-h-screen w-full flex flex-col items-center justify-center bg-[#36454F] text-white p-8 font-sans'>
   <a href="/Chatbot" className='p-2 bg-[#B87333] text-white rounded-lg absolute top-4 right-4 hover:bg-[#d88f4c]'>Novo agendamento</a>

      <div className="grid grid-cols-1 sm:grid-cols-3 items-start justify-center w-full max-w-6xl gap-8 mt-7">
        
        <div className="col-span-1 sm:col-span-2 bg-gray-800 rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 border-[#B87333]">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-200">Resumo do Agendamento</h2>
          <ul className="space-y-6 text-xl">
            <li className="flex flex-col">
              <span className="font-medium text-gray-400 uppercase tracking-wide">Nome:</span>
              <span className="font-semibold text-gray-100">{appointmentDetails?.client?.name || appointmentDetails?.clientName}</span>
            </li>
            <li className="flex flex-col">
              <span className="font-medium text-gray-400 uppercase tracking-wide">Serviço:</span>
              <span className="font-semibold text-gray-100">{appointmentDetails?.services?.[0]?.service?.name || appointmentDetails?.services?.[0]?.name}</span>
            </li>
            <li className="flex flex-col">
              <span className="font-medium text-gray-400 uppercase tracking-wide">Barbeiro:</span>
              <span className="font-semibold text-gray-100">{appointmentDetails?.barber?.user?.name || appointmentDetails?.barber?.name}</span>
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
        <div className="col-span-1 flex flex-col items-center justify-center w-full h-full gap-6">
          <div className="bg-gray-800 rounded-2xl p-6 w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 border-[#B87333]">
            <h2 className="text-2xl font-bold mb-6 text-center text-[#B87333]">Cancelar Agendamento</h2>
            <button
              className="w-full bg-gradient-to-r from-[#B87333] to-[#B87333] text-gray-900 font-extrabold py-5 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4"
              onClick={handleCancel}
              disabled={loading}
            >
              {loading ? 'Cancelando...' : 'Cancelar Agendamento'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-red-500 mt-4 text-center p-4 rounded-xl bg-red-900 border border-red-500 shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
};
