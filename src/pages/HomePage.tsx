import { IndexHeader } from '../components/indexHeader';
import { Recursos } from '../components/resourcesIndex';
import { IndexFooter } from '../components/indexfooter';
import { Contact } from '../components/contactUsIndex';

export function Index() {
  return (
    <div className="bg-white text-[#36454F] min-h-screen font-sans">
      <IndexHeader />

      {/* 2. Hero */}
      <section className="bg-[#36454F] py-20 px-4">
        <div className="container mx-auto max-w-7xl flex flex-col md:flex-row items-center gap-12">
          
          {/* Texto */}
          <div className="md:w-1/2 text-left">
            <span className="text-[#B87333] font-semibold text-lg">Sistema para Barbearias</span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-white mb-4">
              O Melhor jeito de gerenciar sua barbearia
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8">
              Agendamentos, finanças e clientes em um só lugar. Fácil, rápido e 100% online.
            </p>
            <div className="flex gap-4">
              <a 
                href="/register"
                className="bg-[#B87333] text-white py-3 px-8 rounded-lg font-medium text-lg hover:bg-[#a66a30] shadow-lg transition-transform transform hover:scale-105"
              >
                Teste Grátis
              </a>
              <a 
                href="#demo"
                className="bg-transparent border border-white py-3 px-8 rounded-lg font-medium text-lg text-white hover:bg-white hover:text-[#36454F] transition-colors"
              >
                Ver Demonstração
              </a>
            </div>
          </div>
        </div>
      </section>

    <Recursos/>

      <section className="bg-[#36454F] py-20 text-center text-white">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Pronto para modernizar sua barbearia?</h2>
        <a 
          href="/register"
          className="bg-[#B87333] text-white py-3 px-8 rounded-lg font-medium text-lg hover:bg-[#a66a30] shadow-lg transition-transform transform hover:scale-105"
        >
          Começar Agora
        </a>
      </section>
    {/*Sobre nós*/}
    <div className="bg-white text-[#36454F] min-h-screen font-sans">
      <section className="bg-white py-16">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Sobre nós</h2>
          <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
            O Aparato nasceu para ajudar barbeiros e donos de barbearia a terem mais controle e organização no dia a dia. 
            Nossa missão é simplificar a gestão do seu negócio com tecnologia acessível, sem complicação.
          </p>
        </div>
      </section>
    {/*planos*/}
      <section className="bg-gray-50 py-16" id="planos">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Plano único, tudo incluso</h2>
          <p className="text-lg text-gray-600 mb-12">Apenas R$30,00 por mês — sem taxas escondidas.</p>
          <div className="bg-white p-8 rounded-lg shadow-lg inline-block">
            <h3 className="text-2xl font-bold mb-4">Plano Aparato</h3>
            <p className="text-5xl font-extrabold text-[#B87333] mb-6">
              R$30 <span className="text-xl text-gray-500">/ mês</span>
            </p>
            <ul className="text-left mb-6 space-y-2">
              <li>✔ Agendamentos ilimitados</li>
              <li>✔ Controle financeiro completo</li>
              <li>✔ Histórico de clientes</li>
              <li>✔ Suporte via WhatsApp</li>
            </ul>
            <a 
              href="/register"
              className="bg-[#B87333] text-white py-3 px-8 rounded-lg font-medium text-lg hover:bg-[#a66a30] shadow-lg transition-transform transform hover:scale-105"
            >
              Assinar agora
            </a>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-[#36454F] py-20 text-center text-white">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Pronto para modernizar sua barbearia?</h2>
        <a 
          href="/register"
          className="bg-[#B87333] text-white py-3 px-8 rounded-lg font-medium text-lg hover:bg-[#a66a30] shadow-lg transition-transform transform hover:scale-105"
        >
          Começar Agora
        </a>
      </section>
      <Contact/>
      <IndexFooter/>
    </div>
</div>
  );
}
