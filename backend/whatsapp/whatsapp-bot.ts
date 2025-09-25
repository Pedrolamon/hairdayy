

import qrcode from 'qrcode-terminal';
import { Client, LocalAuth, Message, Chat } from 'whatsapp-web.js';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';

const prisma = new PrismaClient();

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: path.resolve(__dirname, '../.wwebjs_auth') })
});

client.on('ready', () => {
  console.log('Cliente do WhatsApp está pronto e conectado!');
  checkAndSendReminders();
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  console.log('Por favor, escaneie o QR Code acima para autenticar.');
});

// Evento: mensagem recebida
client.on('message', async (message: Message) => {
  const chat: Chat = await message.getChat();
  const contactId = message.from;
  const today = new Date();
  const body = message.body.toLowerCase();

  const greetings = ['bom dia', 'boa tarde', 'boa noite', 'agendar', 'marcar'];

  if (greetings.some(greeting => body.includes(greeting))) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: `${contactId}@example.com` }, 
        include: { personalInfo: true }
      });

      if (!user) {
        await chat.sendMessage("Olá! Parece que você não está no meu sistema. Entre em contato com o administrador para ser cadastrado.");
        return;
      }
      
      const lastGreetingDate = user.lastGreetingDate; 
      const hasGreetedToday = lastGreetingDate && lastGreetingDate.toDateString() === today.toDateString();

      if (!hasGreetedToday && user.personalInfo && user.personalInfo.menssage) {
        await chat.sendMessage(user.personalInfo.menssage);
        
        // Atualiza a data da última saudação no banco de dados para evitar repetições no mesmo dia
        await prisma.user.update({
          where: { id: user.id },
          data: { lastGreetingDate: today }
        });

        console.log(`Resposta de saudação enviada para o usuário ${user.name}.`);
      } else if (hasGreetedToday) {
        console.log(`Saudação já respondida hoje para ${user.name}. Ignorando.`);
      }
    } catch (error) {
      console.error('Erro ao processar mensagem de saudação:', error);
    }
  }
});

// Lógica de agendamento e lembretes
async function checkAndSendReminders() {
  console.log('Verificando agendamentos para lembretes...');
  const now = new Date();
  const twelveHoursInAdvance = new Date(now.getTime() + 12 * 60 * 60 * 1000);

  try {
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        AND: [
          { date: { gte: now } },
          { date: { lte: twelveHoursInAdvance } },
          { reminderSent: false }
        ]
      },
      include: {
        client: {
          select: { name: true, phone: true }
        }
      }
    });
    
    for (const appointment of upcomingAppointments) {
      const formattedDate = appointment.date.toLocaleString('pt-BR');
      const formattedTime = appointment.startTime;
      const clientName = appointment.client?.name || appointment.clientName;
      const clientPhone = appointment.client?.phone || appointment.phone;

      if (clientPhone) {
        const reminderMessage = `Olá ${clientName}! Lembrete do seu agendamento. Data: ${formattedDate} às ${formattedTime}. Por favor, confirme a sua presença.`;
        
        try {
          await client.sendMessage(`55${clientPhone}@c.us`, reminderMessage); // Formato `55<DDD><NUMERO>`
          
          // Marca o lembrete como enviado no banco de dados
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { reminderSent: true }
          });
          
          console.log(`Lembrete enviado para ${clientName} em ${clientPhone}.`);
        } catch (error) {
          console.error(`Falha ao enviar lembrete para ${clientName}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Erro ao buscar ou processar agendamentos:', error);
  } finally {
    // Agenda a próxima verificação para daqui a 10 minutos
    setTimeout(checkAndSendReminders, 10 * 60 * 1000);
  }
}

client.initialize();