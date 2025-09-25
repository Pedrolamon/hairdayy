import { CalendarDays, DollarSign, Users, Package, FileText, BarChart3, CreditCard, ClipboardList } from "lucide-react";

export function Recursos() {
  const recursos = [
    {
      icon: <CalendarDays className="w-10 h-10 text-[#B87333]" />,
      title: "Smart Scheduling",
      desc: "Chatbot for scheduling, calendar synchronized between mobile and computer, colors, blocks and recurrence."
    },
    {
      icon: <ClipboardList className="w-10 h-10 text-[#B87333]" />,
      title: "Digital Commands",
      desc: "Real-time order control and integration with cash register and sales history."
    },
    {
      icon: <DollarSign className="w-10 h-10 text-[#B87333]" />,
      title: "Complete Financial Management",
      desc: "Cash flow, accounts payable/receivable, POS, discounts, gift cards and invoice issuance."
    },
    {
      icon: <Package className="w-10 h-10 text-[#B87333]" />,
      title: "Inventory and Supplier Control",
      desc: "Minimum stock alerts, product registration and supplier history."
    },
    {
      icon: <Users className="w-10 h-10 text-[#B87333]" />,
      title: "Customer Registration",
      desc: "Detailed customer history for loyalty and service personalization."
    },
    {
      icon: <CreditCard className="w-10 h-10 text-[#B87333]" />,
      title: "Pacotes & Assinaturas",
      desc: "service packages and subscription programs to increase revenue."
    },
    {
      icon: <BarChart3 className="w-10 h-10 text-[#B87333]" />,
      title: "Reports and Analysis",
      desc: "Automatic sales reports, commissions, dashboards for data analysis."
    },
    {
      icon: <FileText className="w-10 h-10 text-[#B87333]" />,
      title: "Employee Management",
      desc: "Individual agenda, own login and personalized configuration of days and times."
    }
  ];

  return (
    <section id="recursos" className="bg-white py-16">
      <div className="container mx-auto max-w-6xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          Features that make your barbershop grow
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
