import { IndexHeader } from '../components/indexHeader';
import { Recursos } from '../components/resourcesIndex';
import { IndexFooter } from '../components/indexfooter';
import { Contact } from '../components/contactUsIndex';

export  default function Index() {
  return (
    <div className="bg-white text-[#36454F] min-h-screen font-sans">
      <IndexHeader />


      <section className="bg-[#36454F] py-20 px-4">
        <div className="container mx-auto max-w-7xl flex flex-col md:flex-row items-center gap-12">
          
          <div className="md:w-1/2 text-left">
            <span className="text-[#B87333] font-semibold text-lg">System for Barber Shops</span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-white mb-4">
              The Best Way to Manage Your Barber Shop
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8">
              Appointments, finances, and clients all in one place. Easy, fast, and 100% online.
            </p>
            <div className="flex gap-4">
              <a 
                href="/register"
                className="bg-[#B87333] text-white py-3 px-8 rounded-lg font-medium text-lg hover:bg-[#a66a30] shadow-lg transition-transform transform hover:scale-105"
              >
                Free Trial
              </a>
            </div>
          </div>
        </div>
      </section>

    <Recursos/>

      <section className="bg-[#36454F] py-20 text-center text-white">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to modernize your barbershop?</h2>
        <a 
          href="/register"
          className="bg-[#B87333] text-white py-3 px-8 rounded-lg font-medium text-lg hover:bg-[#a66a30] shadow-lg transition-transform transform hover:scale-105"
        >
          Start Now
        </a>
      </section>

    <div className="bg-white text-[#36454F] min-h-screen font-sans">
      <section className="bg-white py-16">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">About us</h2>
          <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
            Aparato was created to help barbers and barbershop owners gain more control and organization in their daily operations.
            Our mission is to simplify your business management with accessible, hassle-free technology.
          </p>
        </div>
      </section>

      <section className="bg-gray-50 py-16" id="planos">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Single plan, all inclusive</h2>
          <p className="text-lg text-gray-600 mb-12">Only R$30.00 per month — no hidden fees.</p>
          <div className="bg-white p-8 rounded-lg shadow-lg inline-block">
            <h3 className="text-2xl font-bold mb-4">Apparatus Plan</h3>
            <p className="text-5xl font-extrabold text-[#B87333] mb-6">
              $30 <span className="text-xl text-gray-500">/month </span>
            </p>
            <ul className="text-left mb-6 space-y-2">
              <li>✔ Unlimited appointments</li>
              <li>✔ Complete financial control</li>
              <li>✔ Customer history</li>
              <li>✔ Support via WhatsApp</li>
            </ul>
            <a 
              href="/register"
              className="bg-[#B87333] text-white py-3 px-8 rounded-lg font-medium text-lg hover:bg-[#a66a30] shadow-lg transition-transform transform hover:scale-105"
            >
              Subscribe now
            </a>
          </div>
        </div>
      </section>


      <section className="bg-[#36454F] py-20 text-center text-white">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to modernize your barbershop?</h2>
        <a 
          href="/register"
          className="bg-[#B87333] text-white py-3 px-8 rounded-lg font-medium text-lg hover:bg-[#a66a30] shadow-lg transition-transform transform hover:scale-105"
        >
          Start Now
        </a>
      </section>
      <Contact/>
      <IndexFooter/>
    </div>
</div>
  );
}
