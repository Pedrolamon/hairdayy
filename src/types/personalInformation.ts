// Tipos para PersonalInformation
export interface PersonalInformation {
  id: string;
  userId: string;
  businessname?: string;
  daysworked?: string;
  menssage?: string;
  startTime?: string;
  endTime?: string;
  workDays?: number;
  availableDays?: string[]; 
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos para as requisições da API
export interface PersonalInformationRequest {
  businessname?: string;
  daysworked?: string;
  menssage?: string;
  startTime?: string;
  endTime?: string;
  workDays?: number;
  availableDays?: string[];
  paymentMethod?: string;
}

export interface PersonalInformationResponse {
  message: string;
  personalInfo: PersonalInformation;
}

// Tipos para os dias da semana
export type WeekDay = 'Dom' | 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb';

export const WEEK_DAYS: WeekDay[] = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
