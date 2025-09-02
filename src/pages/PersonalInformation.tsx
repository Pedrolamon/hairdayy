import { useAuth } from "../hooks/use-auth";
import {SquareScissors} from "lucide-react"
//icons
import{CircleUser,AtSign, Phone, BadgeInfo } from "lucide-react"


export default function PersonalInformation() {

    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div>Carregando informações do usuário...</div>;
    }

    if (!user) {
        return <div>Você precisa estar logado para ver esta página.</div>;
    }

    return (
           <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">
        Informações Pessoais
      </h1>

      <div className="bg-white dark:bg-gray-800 p-6 f rounded-2xl shadow-lg w-full space-y-6 flex flex-wrap justify-between ">
       
        <div className="flex items-center gap-3">
          <CircleUser className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 dark:text-gray-400">Nome</span>
            <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {user.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AtSign className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
            <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {user.email}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <BadgeInfo className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 dark:text-gray-400">Função</span>
            <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {user.role}
            </span>
          </div>
        </div>

        {user.phone && (
          <div className="flex items-center gap-3">
            <Phone className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 dark:text-gray-400">Telefone</span>
              <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {user.phone}
              </span>
            </div>
          </div>
        )}
      </div>
      
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full flex items-end gap-3 mt-6">
  <SquareScissors className="h-6 w-6 text-gray-500 dark:text-gray-400 mb-13" />
  
  <div className="flex flex-col flex-1">
    <label htmlFor="barber-name" className="text-lg mb-2 font-medium text-gray-700 dark:text-gray-300">
      Nome da Barbearia
    </label>
    <input
      type="text"
      id="barber-name"
      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
      placeholder="Ex: Corte Certo"
    />
  </div>
  
  <button
    type="button"
    className="bg-blue-500 text-white px-3 py-2 rounded-xl font-semibold hover:bg-blue-600 transition"
    onClick={() => {}}
  >
    Salvar
  </button>
</div>

<div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full mt-6">
  <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
    Controle de Expediente
  </h2>
  <div className="flex flex-col md:flex-row gap-4 items-center">
    <div className="flex-1">
      <label htmlFor="startWork" className="text-sm font-medium text-gray-500 dark:text-gray-400">
        Início
      </label>
      <input
        type="time"
        id="startWork"
        className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
      />
    </div>
    <div className="flex-1">
      <label htmlFor="endWork" className="text-sm font-medium text-gray-500 dark:text-gray-400">
        Fim
      </label>
      <input
        type="time"
        id="endWork"
        className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
      />
    </div>
    <button
      type="button"
      className="bg-blue-500 text-white px-4 py-2 mt-4 md:mt-6 rounded-xl font-semibold hover:bg-blue-600 transition self-end w-full md:w-auto"
      onClick={() => {}}
    >
      Salvar
    </button>
  </div>
  <div className="">
      <label htmlFor="startWork" className="text-sm font-medium text-gray-500 dark:text-gray-400">
        Dias disponiveis para agendamento
      </label>
      <input
        type="text"
        placeholder="30"
        id="workDays"
        className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
      />
    </div>

    <div className="flex flex-col">
  <label className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
    Dias da semana disponíveis para agendamento
  </label>
  <div className="flex flex-wrap gap-2 sm:gap-4">
    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
      <div key={day} className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={`day-${day}`}
          name={`day-${day}`}
          className="peer relative h-4 w-4 shrink-0 appearance-none rounded-sm border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 checked:bg-blue-600 checked:border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
        />
        <label htmlFor={`day-${day}`} className="text-sm text-gray-700 dark:text-gray-200 cursor-pointer select-none">
          {day}
        </label>
        <svg
          className="pointer-events-none absolute hidden h-4 w-4 peer-checked:block text-white"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
    ))}
  </div>
</div>
</div>

<div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full mt-6 flex items-center justify-between">
  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
    Forma de Pagamento
  </h2>
  <a
    href="/changePayment"
    className="bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-600 transition"
  >
    Mudar Forma de Pagamento
  </a>
</div>
    </div>

  );
}