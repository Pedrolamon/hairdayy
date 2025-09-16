import { PrismaClient, AppointmentStatus } from '@prisma/client';
import cron from 'node-cron';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';


enum ReminderChannel {
    NONE = 'NONE',
    EMAIL = 'EMAIL',
    WHATSAPP = 'WHATSAPP',
    BOTH = 'BOTH',
}


const prisma = new PrismaClient();

// Configuração do SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || 'SENDGRID_API_KEY');
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'remetente@hairday.com';

// Configuração do Twilio para WhatsApp
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || 'TWILIO_SID';
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'TWILIO_TOKEN';
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
const twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN);

// Rodar a cada 5 minutos
cron.schedule('*/5 * * * *', async () => {
    try {
        // Objeto de data para a busca
        const now = new Date();
        const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
        
        // Formata o tempo de busca para o horário exato
        const timeString = inOneHour.toTimeString().slice(0, 5);

        // Buscar agendamentos com Prisma Client
        const appointments = await prisma.appointment.findMany({
            where: {
                status: AppointmentStatus.SCHEDULED, // Uso do enum
                date: inOneHour, // Busca pela data completa, mais segura
                startTime: timeString,
                reminderSent: false,
            },
            // Inclui o modelo 'client' (que é do tipo User) para ter acesso aos dados
            include: {
                client: true, 
            },
        });

        for (const app of appointments) {
            // Acessa o usuário através do campo 'client'
            const user = app.client;
            
            // Verificação de segurança caso o cliente não seja encontrado
            if (!user) {
                console.error(`Client not found for appointment ${app.id}`);
                continue;
            }

            // Enviar e-mail se permitido.
            // O código agora acessa o campo 'reminderChannel' que você precisa adicionar ao modelo User.
            if ((user.reminderChannel === ReminderChannel.EMAIL || user.reminderChannel === ReminderChannel.BOTH) && user?.email) {
                const msg = {
                    to: user.email,
                    from: SENDER_EMAIL,
                    subject: 'Lembrete de agendamento - Hairday',
                    text: `Olá ${user.name}, seu agendamento é às ${app.startTime} em ${app.date}.`,
                    html: `<p>Olá <b>${user.name}</b>,<br/>Seu agendamento é às <b>${app.startTime}</b> em <b>${app.date}</b>.</p>`,
                };
                try {
                    await sgMail.send(msg);
                } catch (err) {
                    console.error('Erro ao enviar e-mail:', err);
                }
            }
            
            // Enviar WhatsApp se permitido.
            if ((user.reminderChannel === ReminderChannel.WHATSAPP || user.reminderChannel === ReminderChannel.BOTH) && user?.phone) {
                try {
                    await twilioClient.messages.create({
                        from: TWILIO_WHATSAPP_FROM,
                        to: `whatsapp:${user.phone}`,
                        body: `Olá ${user.name}, seu agendamento é às ${app.startTime} em ${app.date}.`,
                    });
                } catch (err) {
                    console.error('Erro ao enviar WhatsApp:', err);
                }
            }
            
            // Lembrete não enviado
            if (user.reminderChannel === ReminderChannel.NONE) {
            }
            
            // Atualiza o registro no banco de dados com Prisma Client
            await prisma.appointment.update({
                where: { id: app.id },
                data: { reminderSent: true },
            });
        }
    } catch (err) {
        console.error("Erro na execução do cron job:", err);
    }
});

export default cron;
