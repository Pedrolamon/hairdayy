import { api } from "../lib/api";
import type {
  PersonalInformation,
  PersonalInformationRequest,
  PersonalInformationResponse
} from "../types/personalInformation";

// Buscar nome da empresa (público)
export async function getBusinessName(): Promise<string> {
  const { data } = await api.get<{ businessname: string }>("/personalInformation/business");
  return data.businessname;
}

// Buscar informações pessoais do usuário autenticado
export async function getPersonalInformation(): Promise<PersonalInformation> {
  const { data } = await api.get<PersonalInformation>("/personalInformation");
  return data;
}

// Criar ou atualizar informações pessoais do usuário autenticado
export async function updatePersonalInformation(
  personalInfo: PersonalInformationRequest
): Promise<PersonalInformationResponse> {
  const { data } = await api.put<PersonalInformationResponse>(
    "/personalInformation",
    personalInfo
  );
  return data;
}

// Atualizar apenas o nome da barbearia
export async function updateBusinessName(businessname: string): Promise<PersonalInformationResponse> {
  return updatePersonalInformation({ businessname });
}

// Atualizar apenas a mensagem do WhatsApp
export async function updateWhatsAppMessage(menssage: string): Promise<PersonalInformationResponse> {
  return updatePersonalInformation({ menssage });
}

// Atualizar apenas o horário de trabalho
export async function updateWorkSchedule(
  startTime: string,
  endTime: string,
  workDays?: number,
  availableDays?: string[]
): Promise<PersonalInformationResponse> {
  return updatePersonalInformation({
    startTime,
    endTime,
    workDays,
    availableDays
  });
}

// Buscar datas disponíveis para um barbeiro
export async function getAvailableDates(barberId: string): Promise<AvailableDate[]> {
  const { data } = await api.get<AvailableDate[]>(`/chatbot/available-dates`, {
    params: { barberId }
  });
  return data;
}

// Tipo para as datas disponíveis
export interface AvailableDate {
  date: string; 
  dayOfWeek: string; 
  day: number; 
  month: string; 
  fullDate: string; 
}
