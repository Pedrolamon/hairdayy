import { CalendarDays, DollarSign, Users, Package, FileText, BarChart3, CreditCard, ClipboardList } from "lucide-react";

export function Recursos() {
  const recursos = [
    {
      icon: <CalendarDays className="w-10 h-10 text-[#B87333]" />,
      title: "Agendamento Inteligente",
      desc: "Chatbot para agendamentos, agenda sincronizada entre celular e computador, cores, bloqueios e recorrência."
    },
    {
      icon: <ClipboardList className="w-10 h-10 text-[#B87333]" />,
      title: "Comandas Digitais",
      desc: "Controle de pedidos em tempo real e integração com caixa e histórico de vendas."
    },
    {
      icon: <DollarSign className="w-10 h-10 text-[#B87333]" />,
      title: "Gestão Financeira Completa",
      desc: "Fluxo de caixa, contas a pagar/receber, POS, descontos, gift cards e emissão de notas."
    },
    {
      icon: <Package className="w-10 h-10 text-[#B87333]" />,
      title: "Controle de Estoque & Fornecedores",
      desc: "Alertas de estoque mínimo, registro de produtos e histórico de fornecedores."
    },
    {
      icon: <Users className="w-10 h-10 text-[#B87333]" />,
      title: "Cadastro de Clientes",
      desc: "Histórico detalhado de clientes para fidelização e personalização de serviços."
    },
    {
      icon: <CreditCard className="w-10 h-10 text-[#B87333]" />,
      title: "Pacotes & Assinaturas",
      desc: "Crie pacotes de serviços e programas de assinatura para aumentar receita."
    },
    {
      icon: <BarChart3 className="w-10 h-10 text-[#B87333]" />,
      title: "Relatórios & Análises",
      desc: "Relatórios automáticos de vendas, comissões, exportação para Excel e dashboards."
    },
    {
      icon: <FileText className="w-10 h-10 text-[#B87333]" />,
      title: "Gestão de Colaboradores",
      desc: "Agenda individual, login próprio e configuração personalizada de dias e horários."
    }
  ];

  return (
    <section id="recursos" className="bg-white py-16">
      <div className="container mx-auto max-w-6xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          Recursos que fazem sua barbearia crescer
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {recursos.map((item, i) => (
            <div
              key={i}
              className="bg-gray-50 p-6 rounded-lg shadow hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left"
            >
              <div className="mb-4">{item.icon}</div>
              <h3 className="font-bold text-xl mb-2 text-[#36454F]">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
