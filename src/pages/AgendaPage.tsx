import React, { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from "../hooks/use-auth"

import { Calendar, CalendarClock, CalendarDays, BarChart, Trash2, Edit, X, Plus, Clock, Users, Tag, Check, Filter, Bell, AlertCircle } from 'lucide-react';


const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ATTENDED: 'ATTENDED',
  NO_SHOW: 'NO_SHOW',
} as const;

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: typeof AppointmentStatus[keyof typeof AppointmentStatus];
  client: { name: string } | null;
  barber: { user: { name: string } | null } | null;
  services: { service: Service }[];
  clientName: string;
}

interface NewAppointmentForm {
  date: string;
  serviceId: string;
  startTime: string;
  clientName: string;
}

interface EditAppointmentForm {
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  serviceIds: string[];
}

 export  default function Agenda(){

  const { user } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [showNewForm, setShowNewForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);


  const [newForm, setNewForm] = useState<NewAppointmentForm>({ date: '', serviceId: '', startTime: '', clientName: '' });
  const [newFormLoading, setNewFormLoading] = useState(false);
  const [newFormError, setNewFormError] = useState('');

  const [editForm, setEditForm] = useState<EditAppointmentForm>({ date: '', startTime: '', endTime: '', clientName: '', serviceIds: [] });
  const [editFormLoading, setEditFormLoading] = useState(false);
  const [editFormError, setEditFormError] = useState('');


  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState<'all' | 'today' | 'week' | 'month' | 'specific'>('today');


  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);


  const dateInputRef = useRef<HTMLInputElement>(null);


  const [dailyCount, setDailyCount] = useState(0);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [monthlyCount, setMonthlyCount] = useState(0);


  useEffect(() => {
    if (showNewForm && dateInputRef.current) {
      dateInputRef.current.focus();
    }
  }, [showNewForm]);


  useEffect(() => {
  }, [newForm]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchAppointmentCounts = useCallback(async () => {
    try {
      const dailyRes = await api.get('/appointments/count', { params: { period: 'day' } });
      const weeklyRes = await api.get('/appointments/count', { params: { period: 'week' } });
      const monthlyRes = await api.get('/appointments/count', { params: { period: 'month' } });

      setDailyCount(dailyRes.data.count);
      setWeeklyCount(weeklyRes.data.count);
      setMonthlyCount(monthlyRes.data.count);
    } catch (e) {
    }
  }, [user]);


  const fetchAppointments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const params: any = {};

      if (filterType === 'specific') {
        params.date = filterDate;
      } else {
        params.period = filterType;
      }
      console.log('[FRONT] Buscando appointments com params:', params);
      const res = await api.get('/appointments', { params });
      console.log('[FRONT] Resposta recebida de /appointments:', res.data);
      setAppointments(res.data);
    } catch (e: any) {
      console.error('[FRONT] Erro ao buscar appointments:', e);
      setError(e.message);
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, filterDate, filterType]);

  const fetchServices = useCallback(async () => {
    if (!user) return
    try {
      const res = await api.get('/services');
      setServices(res.data);
    } catch (e: any) {
      showToast('Erro ao buscar serviços.', 'error');
    }
  }, [user]);

   useEffect(() => {
    if (user) {
      fetchServices();
      fetchAppointments();
      fetchAppointmentCounts();
    }
  }, [user, fetchServices, fetchAppointments, fetchAppointmentCounts])

  const fetchAvailableSlots = useCallback(async () => {
    const { date, serviceId } = newForm;
    if (!date || !serviceId || !user) {
      setAvailableSlots([]);
      return;
    }
    try {
      const res = await api.get('/appointments/available', {
        params: {
          serviceId: serviceId,
          date: date,
          barberId: user.id
        }
      });
      setAvailableSlots(res.data);
    } catch (e: any) {
      console.error('Erro ao buscar horários disponíveis:', e.message);
      setAvailableSlots([]);
    }
  }, [newForm, user]);

  useEffect(() => {
    fetchAvailableSlots();
  }, [newForm.date, newForm.serviceId, fetchAvailableSlots]);

  const fetchAppointmentDetails = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/appointments/${id}`);
      setSelectedAppointment(res.data);
      setShowDetailsModal(true);
    } catch (e: any) {
      setError(e.message);
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (id: string, status: typeof AppointmentStatus[keyof typeof AppointmentStatus]) => {
    setActionLoading(id);
    setError('');
    try {
      await api.put(`/appointments/${id}`, { status }); 
      fetchAppointments();
      showToast('Status do agendamento atualizado!', 'success');
    } catch (e: any) {
      setError(e.message);
      showToast(e.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!appointmentToDelete) return;
    setActionLoading(appointmentToDelete.id);
    setError('');
    try {
      await api.delete(`/appointments/${appointmentToDelete.id}`,);
      fetchAppointments();
      showToast('Agendamento deletado com sucesso!', 'success');
      setShowDeleteModal(false);
    } catch (e: any) {
      setError(e.message);
      showToast(e.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleNewFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newForm.date || !newForm.serviceId || !newForm.startTime) {
      setNewFormError('Por favor, preencha todos os campos obrigatórios.');
      showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }
    setNewFormLoading(true);
    setNewFormError('');

    try {
      const selectedService = services.find(s => s.id === newForm.serviceId);
      if (!selectedService) throw new Error('Serviço inválido.');

      const [startHour, startMinute] = newForm.startTime.split(':').map(Number);
      const startDate = new Date(`${newForm.date}T${newForm.startTime}:00`);
      const endDate = new Date(startDate.getTime() + selectedService.duration * 60000);

      const endHour = endDate.getHours();
      const endMinute = endDate.getMinutes();

      const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

      const requestBody = {
        date: newForm.date,
        startTime: newForm.startTime,
        endTime,
        serviceIds: [newForm.serviceId],
        clientName: newForm.clientName,
      };

      await api.post('/appointments', requestBody,);
      console.log('[FRONT] Enviando novo agendamento:', requestBody);
      setShowNewForm(false);
      setNewForm({ date: '', serviceId: '', startTime: '', clientName: '' });
      fetchAppointments();
      showToast('Agendamento criado com sucesso!', 'success');
    } catch (e: any) {
      setNewFormError(e.message);
      showToast(e.message, 'error');
    } finally {
      setNewFormLoading(false);
    }
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value, type } = target;

    if (type === 'checkbox') {
      const checkboxTarget = target as HTMLInputElement;
      const serviceId = value;
      setEditForm(prev => {
        const isSelected = prev.serviceIds.includes(serviceId);
        const newServiceIds = isSelected
          ? prev.serviceIds.filter(id => id !== serviceId)
          : [...prev.serviceIds, serviceId];
        return { ...prev, serviceIds: newServiceIds };
      });
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment || !editForm.date || !editForm.startTime || !editForm.endTime) return;
    setEditFormLoading(true);
    setEditFormError('');

    try {
      const requestBody = {
        date: editForm.date,
        startTime: editForm.startTime,
        endTime: editForm.endTime,
        serviceIds: editForm.serviceIds,
        clientName: editForm.clientName,
      };

      await api.put(`/appointments/${selectedAppointment.id}`, requestBody);
      setShowEditModal(false);
      setShowDetailsModal(false);
      fetchAppointments();
      showToast('Agendamento atualizado com sucesso!', 'success');
    } catch (e: any) {
      setEditFormError(e.message);
      showToast(e.message, 'error');
    } finally {
      setEditFormLoading(false);
    }
  };

  const openEditModal = () => {
    if (!selectedAppointment) return;
    const initialServiceIds = selectedAppointment.services.map(s => s.service.id);
    setEditForm({
      date: new Date(selectedAppointment.date).toISOString().split('T')[0],
      startTime: selectedAppointment.startTime,
      endTime: selectedAppointment.endTime,
      serviceIds: initialServiceIds,
      clientName: selectedAppointment.clientName || '',
    });
    setShowEditModal(true);
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="grid grid-cols-6 gap-4 p-4 border-b border-gray-200">
          <div className="h-4 bg-gray-200 rounded col-span-1"></div>
          <div className="h-4 bg-gray-200 rounded col-span-1"></div>
          <div className="h-4 bg-gray-200 rounded col-span-1"></div>
          <div className="h-4 bg-gray-200 rounded col-span-2"></div>
          <div className="h-4 bg-gray-200 rounded col-span-1"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-4 bg-gray-50 min-h-screen font-sans">

      {toastMessage && (
        <div className={`fixed top-4 right-4 z-[100] p-4 rounded-lg shadow-xl text-white flex items-center gap-2 transition-transform duration-300 transform ${toastMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toastMessage.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          <span>{toastMessage.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto bg-white p-6 rounded-xl shadow-lg">

        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-200 flex items-center gap-4">
            <CalendarClock className="text-blue-600 h-8 w-8"/>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">{dailyCount}</h3>
              <p className="text-sm text-gray-600">Agendamentos Hoje</p>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-200 flex items-center gap-4">
            <CalendarDays className="text-green-600 h-8 w-8"/>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">{weeklyCount}</h3>
              <p className="text-sm text-gray-600">Agendamentos na Semana</p>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg shadow-sm border border-purple-200 flex items-center gap-4">
            <BarChart className="text-purple-600 h-8 w-8"/>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">{monthlyCount}</h3>
              <p className="text-sm text-gray-600">Agendamentos no Mês</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white p-6 rounded-xl shadow-lg mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-4 gap-2 sm:gap-4">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2 mb-2 sm:mb-0"><Calendar className="h-7 w-7 text-gray-600"/> Agenda</h1>
          <button
            className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 flex items-center justify-center gap-2"
            onClick={() => setShowNewForm(!showNewForm)}
          >
            <Plus className="h-5 w-5" />
            {showNewForm ? 'Fechar' : 'Novo Agendamento'}
          </button>
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-500"/>
            <span className="text-sm font-medium text-gray-700 mr-2">Filtrar por:</span>
            
            <button
              onClick={() => {
                setFilterType('today');
                setFilterDate(new Date().toISOString().split('T')[0]);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-200 ${
                filterType === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setFilterType('week')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-200 ${
                filterType === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Esta Semana
            </button>
            <button
              onClick={() => setFilterType('month')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-200 ${
                filterType === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Este Mês
            </button>
            <button
              onClick={() => setFilterType('specific')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-200 ${
                filterType === 'specific'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Data Específica
            </button>
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-200 ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todos
            </button>
          </div>

          {filterType === 'specific' && (
            <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg w-full max-w-sm">
              <Calendar className="h-5 w-5 text-gray-500"/>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-gray-700 w-full"
              />
            </div>
          )}
        </div>

        {showNewForm && (
          <div className="bg-gray-100 p-6 rounded-xl mb-6 shadow-inner animate-fade-in">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Criar Novo Agendamento</h2>
            <form onSubmit={handleNewFormSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input
                  ref={dateInputRef}
                  name="date"
                  type="date"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newForm.date}
                  onChange={e => setNewForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serviço</label>
                <select
                  name="serviceId"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newForm.serviceId}
                  onChange={e => setNewForm(prev => ({ ...prev, serviceId: e.target.value }))}
                  required
                >
                  <option value="">Selecione um serviço</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
                <input
                  name="clientName"
                  type="text"
                  placeholder="Nome do Cliente"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newForm.clientName}
                  onChange={e => setNewForm(prev => ({ ...prev, clientName: e.target.value }))}
                  required
                />
              </div>

              <div className="flex items-end gap-2 col-span-1 md:col-span-2 lg:col-span-1">
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-green-700 transition duration-300"
                  disabled={newFormLoading}
                >
                  {newFormLoading ? 'Salvando...' : 'Criar'}
                </button>
              </div>
            </form>
            {newFormError && <div className="text-red-500 mt-4 text-sm">{newFormError}</div>}
            
              <div className="col-span-1 md:col-span-2 lg:col-span-1">
                {newForm.date && newForm.serviceId && (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Horários Disponíveis</label>
                    <div className="flex flex-wrap gap-2">
                      {availableSlots.length > 0 ? (
                        availableSlots.map(slot => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setNewForm(prev => ({ ...prev, startTime: slot.split('-')[0] }))}
                            className={`px-3 py-1 text-sm rounded-full transition duration-200
                              ${newForm.startTime === slot.split('-')[0] ? 'bg-blue-600 text-white' : 'bg-white border border-blue-600 text-blue-600 hover:bg-blue-50'}`}
                          >
                            {slot.split('-')[0]} - {slot.split('-')[1]}
                          </button>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">Nenhum horário disponível para a data e serviço.</span>
                      )}
                    </div>
                  </>
                )}
              </div>
          </div>
          
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="text-center text-red-500 text-lg p-8 rounded-lg bg-red-50 border border-red-200">{error}</div>
        ) : appointments.length > 0 ? (
          <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr className="text-left text-sm text-gray-600 uppercase">
                  <th className="py-3 px-4 font-semibold">Data</th>
                  <th className="py-3 px-4 font-semibold">Horário</th>
                  <th className="py-3 px-4 font-semibold">Cliente</th>
                  <th className="py-3 px-4 font-semibold">Serviços</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(app => (
                  <tr key={app.id} className="border-t hover:bg-gray-50 transition duration-150">
                    <td className="py-3 px-4 text-sm text-gray-800">{new Date(app.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{app.startTime} - {app.endTime}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{app.clientName || app.client?.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{app.services.map(s => s.service.name).join(', ')}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${app.status === AppointmentStatus.SCHEDULED ? 'bg-blue-100 text-blue-800' : ''}
                        ${app.status === AppointmentStatus.COMPLETED ? 'bg-green-100 text-green-800' : ''}
                        ${app.status === AppointmentStatus.CANCELLED ? 'bg-red-100 text-red-800' : ''}
                        ${app.status === AppointmentStatus.ATTENDED ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${app.status === AppointmentStatus.NO_SHOW ? 'bg-gray-100 text-gray-800' : ''}
                      `}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800 text-center">
                      <div className="flex justify-center items-center gap-2">
                        {app.status === AppointmentStatus.SCHEDULED && (
                          <>
                            <button title="Marcar como Concluído" onClick={() => handleStatus(app.id, AppointmentStatus.COMPLETED)} disabled={actionLoading === app.id} className="text-green-600 hover:text-green-800 transition"><Check size={18} /></button>
                            <button title="Marcar como Cancelado" onClick={() => handleStatus(app.id, AppointmentStatus.CANCELLED)} disabled={actionLoading === app.id} className="text-red-600 hover:text-red-800 transition"><X size={18} /></button>
                          </>
                        )}
                        <button title="Ver Detalhes/Editar" onClick={() => fetchAppointmentDetails(app.id)} className="text-blue-600 hover:text-blue-800 transition"><Edit size={18} /></button>
                        <button title="Deletar Agendamento" onClick={() => { setAppointmentToDelete(app); setShowDeleteModal(true); }} disabled={actionLoading === app.id} className="text-gray-400 hover:text-red-500 transition"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-500 text-lg mt-8 p-8 border border-dashed rounded-lg bg-gray-50">Nenhum agendamento encontrado para a data selecionada.</div>
        )}
      </div>

      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-2xl relative">
            <button onClick={() => setShowDetailsModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"><X size={24} /></button>
            <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Detalhes do Agendamento</h2>

            {showEditModal ? (
              <form onSubmit={handleEditFormSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                    <input name="date" type="date" value={editForm.date} onChange={handleEditFormChange} className="w-full border-gray-300 rounded-lg shadow-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horário de Início</label>
                    <input name="startTime" type="time" value={editForm.startTime} onChange={handleEditFormChange} className="w-full border-gray-300 rounded-lg shadow-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horário de Término</label>
                    <input name="endTime" type="time" value={editForm.endTime} onChange={handleEditFormChange} className="w-full border-gray-300 rounded-lg shadow-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Serviços</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {services.map(s => (
                        <div key={s.id} className="relative flex items-center">
                          <input
                            id={`edit-service-${s.id}`}
                            type="checkbox"
                            name="serviceIds"
                            value={s.id}
                            checked={editForm.serviceIds.includes(s.id)}
                            onChange={handleEditFormChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor={`edit-service-${s.id}`} className="ml-2 text-sm text-gray-700">{s.name}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {editFormError && <div className="text-red-500 text-sm mb-4">{editFormError}</div>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition">Cancelar</button>
                  <button type="submit" disabled={editFormLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition">
                    {editFormLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <p className="flex items-center text-sm text-gray-700"><Users size={16} className="mr-2 text-gray-500" /> <span className="font-semibold text-gray-900">Cliente:</span> {selectedAppointment.clientName || selectedAppointment.client?.name}</p>
                  <p className="flex items-center text-sm text-gray-700"><Calendar size={16} className="mr-2 text-gray-500" /> <span className="font-semibold text-gray-900">Data:</span> {new Date(selectedAppointment.date).toLocaleDateString()}</p>
                  <p className="flex items-center text-sm text-gray-700"><Clock size={16} className="mr-2 text-gray-500" /> <span className="font-semibold text-gray-900">Horário:</span> {selectedAppointment.startTime} - {selectedAppointment.endTime}</p>
                  <p className="flex items-center text-sm text-gray-700"><Tag size={16} className="mr-2 text-gray-500" /> <span className="font-semibold text-gray-900">Serviços:</span> {selectedAppointment.services.map(s => s.service.name).join(', ')}</p>
                </div>
                <div className="mt-4">
                  <p className="flex items-center text-sm text-gray-700"><Bell size={16} className="mr-2 text-gray-500" /> <span className="font-semibold text-gray-900">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold
                      ${selectedAppointment.status === AppointmentStatus.SCHEDULED ? 'bg-blue-100 text-blue-800' : ''}
                      ${selectedAppointment.status === AppointmentStatus.COMPLETED ? 'bg-green-100 text-green-800' : ''}
                      ${selectedAppointment.status === AppointmentStatus.CANCELLED ? 'bg-red-100 text-red-800' : ''}
                      ${selectedAppointment.status === AppointmentStatus.ATTENDED ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${selectedAppointment.status === AppointmentStatus.NO_SHOW ? 'bg-gray-100 text-gray-800' : ''}
                    `}>
                      {selectedAppointment.status}
                    </span>
                  </p>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button onClick={openEditModal} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition">
                    <Edit size={16} className="inline-block mr-1" /> Editar
                  </button>
                  <button onClick={() => setShowDetailsModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition">Fechar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showDeleteModal && appointmentToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm relative">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Confirmar Deleção</h2>
            <p className="text-gray-700 mb-6">Tem certeza que deseja deletar o agendamento de <span className="font-semibold">{appointmentToDelete.client?.name}</span> em <span className="font-semibold">{new Date(appointmentToDelete.date).toLocaleDateString()}</span> às <span className="font-semibold">{appointmentToDelete.startTime}</span>? Esta ação é irreversível.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition">Cancelar</button>
              <button onClick={handleDelete} disabled={actionLoading === appointmentToDelete.id} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition">
                {actionLoading === appointmentToDelete.id ? 'Deletando...' : 'Deletar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
