import { AppDataSource } from '../data-source';
import { Appointment } from '../entity/Appointment';
import { User } from '../entity/User';
import cron from 'node-cron';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || 'SENDGRID_API_KEY');
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'remetente@hairday.com';

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || 'TWILIO_SID';
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'TWILIO_TOKEN';
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
const twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN);

// Rodar a cada 5 minutos
cron.schedule('*/5 * * * *', async () => {
  const repo = AppDataSource.getRepository(Appointment);
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
  // Buscar agendamentos para daqui 1h, status scheduled, que ainda não receberam lembrete
  const appointments = await repo.find({
    where: {
      status: 'scheduled',
      date: inOneHour.toISOString().slice(0, 10),
      startTime: inOneHour.toTimeString().slice(0, 5),
      reminderSent: false,
    },
    relations: ['user', 'barber', 'services'],
  });
  for (const app of appointments) {
    const user = app.user as User;
    // Enviar e-mail se permitido
    if ((app.reminderChannel === 'email' || app.reminderChannel === 'both') && user.email) {
      const msg = {
        to: user.email,
        from: SENDER_EMAIL,
        subject: 'Lembrete de agendamento - Hairday',
        text: `Olá ${user.name}, seu agendamento é às ${app.startTime} em ${app.date}.`,
        html: `<p>Olá <b>${user.name}</b>,<br/>Seu agendamento é às <b>${app.startTime}</b> em <b>${app.date}</b>.</p>`,
      };
      try {
        await sgMail.send(msg);
        console.log(`Lembrete enviado para ${user.email}`);
      } catch (err) {
        console.error('Erro ao enviar e-mail:', err);
      }
    }
    // Enviar WhatsApp se permitido
    if ((app.reminderChannel === 'whatsapp' || app.reminderChannel === 'both') && user.phone) {
      try {
        await twilioClient.messages.create({
          from: TWILIO_WHATSAPP_FROM,
          to: `whatsapp:${user.phone}`,
          body: `Olá ${user.name}, seu agendamento é às ${app.startTime} em ${app.date}.`,
        });
        console.log(`WhatsApp enviado para ${user.phone}`);
      } catch (err) {
        console.error('Erro ao enviar WhatsApp:', err);
      }
    }
    if (app.reminderChannel === 'none') {
      console.log(`Lembrete não enviado para ${user.name} (optou por não receber).`);
    }
    app.reminderSent = true;
    await repo.save(app);
  }
}); 