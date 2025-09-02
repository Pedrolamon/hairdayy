import React, { useState } from 'react';
import {DollarSign, Calendar} from "lucide-react"



interface Account {
  type: 'payable' | 'receivable';
  description: string;
  amount: number;
  date: Date;
}


export default function FinancialCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [newAccount, setNewAccount] = useState({
    type: 'payable', 
    description: '',
    amount: '',
    date: selectedDate.toISOString().slice(0, 10)
  });

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setShowCalendar(false); 
    setNewAccount({ ...newAccount, date: date.toISOString().slice(0, 10) });
  };

  
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAccount.description && newAccount.amount) {
        if (newAccount.type === 'payable' || newAccount.type === 'receivable') {
        const accountToAdd: Account = {
          type: newAccount.type,
          description: newAccount.description,
          amount: parseFloat(newAccount.amount), 
          date: new Date(newAccount.date)
        };
        setAccounts([...accounts, accountToAdd]);
        setNewAccount({
          type: 'payable',
          description: '',
          amount: '',
          date: selectedDate.toISOString().slice(0, 10)
        });
      }
    }
  };


  const renderCalendar = () => {
    const days = [];
    const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const firstDayIndex = date.getDay(); 


    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="w-16 h-16"></div>);
    }

    while (date.getMonth() === selectedDate.getMonth()) {
      const day = new Date(date);
      const isToday = day.toDateString() === new Date().toDateString();
      const isSelected = day.toDateString() === selectedDate.toDateString();
      const hasPayable = accounts.some(acc => acc.type === 'payable' && acc.date.toDateString() === day.toDateString());
      const hasReceivable = accounts.some(acc => acc.type === 'receivable' && acc.date.toDateString() === day.toDateString());

      days.push(
        <button
          key={day.toISOString()}
          onClick={() => handleDateChange(day)}
          className={`
            relative w-16 h-16 flex flex-col items-center justify-center rounded-lg text-lg font-medium transition duration-200
            ${isToday ? 'bg-blue-500 text-white' : ''}
            ${isSelected && !isToday ? 'bg-blue-200 text-blue-800' : 'text-gray-900'}
            ${!isToday && !isSelected ? 'hover:bg-gray-100' : ''}
          `}
        >
          {day.getDate()}
          {hasPayable && <div className="absolute bottom-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>}
          {hasReceivable && <div className="absolute bottom-1 left-1 w-2 h-2 bg-green-500 rounded-full"></div>}
        </button>
      );
      date.setDate(date.getDate() + 1);
    }

    return (
      <div className="bg-white p-6 rounded-lg shadow-xl w-full">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xl font-bold">
            {selectedDate.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-7 text-center text-sm font-semibold text-gray-500 mb-2">
          <div>Dom</div>
          <div>Seg</div>
          <div>Ter</div>
          <div>Qua</div>
          <div>Qui</div>
          <div>Sex</div>
          <div>Sáb</div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100  items-center justify-center p-8 font-sans ">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          
          <h2 className="text-3xl font-bold mb-6 text-gray-900 flex items-center gap-2"><DollarSign className="w-8 h-8" /> Nova Conta</h2>
          
          <form onSubmit={handleAddAccount} className="flex flex-wrap justify-between">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Tipo de Conta</label>
              <select
                value={newAccount.type}
                onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="payable">Conta a Pagar</option>
                <option value="receivable">Conta a Receber</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Descrição</label>
              <input
                type="text"
                value={newAccount.description}
                onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Renda, Salário, etc."
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Valor (R$)</label>
              <input
                type="number"
                value={newAccount.amount}
                onChange={(e) => setNewAccount({ ...newAccount, amount: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Data</label>
              <input
                type="date"
                value={newAccount.date}
                onChange={(e) => setNewAccount({ ...newAccount, date: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full mt-6 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition duration-300 shadow-md"
           onClick={() => setShowCalendar(!showCalendar)}
           >
              Adicionar Conta
            </button>
          </form>
        
      <div className="w-full max-w-screem">
              <label className="flex text-gray-700 font-bold text-3xl mt-4"><Calendar className='mt-2'/>Calendário</label>
        <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="w-full bg-blue-600 mt-2 text-white py-2 px-4 rounded-xl font-semibold  hover:bg-blue-700 transition duration-300 shadow-lg"
          >
            {selectedDate.toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </button>
          {showCalendar && renderCalendar()}
        </div>
</div>
        

        <div className="bg-white p-6 rounded-lg shadow-2xl w-full mt-8">
          <h2 className="text-2xl font-bold mb-4">Resumo das Contas</h2>
          {accounts.length === 0 ? (
            <p className="text-gray-500">Nenhuma conta registada ainda.</p>
          ) : (
            <ul className="space-y-4">
              {accounts.map((account, index) => (
                <li
                  key={index}
                  className={`p-4 rounded-lg shadow-md ${account.type === 'payable' ? 'bg-red-100 border-l-4 border-red-500' : 'bg-green-100 border-l-4 border-green-500'}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-bold text-lg">{account.description}</p>
                      <p className="text-sm text-gray-600">
                        {account.type === 'payable' ? 'A Pagar' : 'A Receber'} - {account.date.toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                    <span className={`font-bold text-lg ${account.type === 'payable' ? 'text-red-600' : 'text-green-600'}`}>
                      {account.amount.toFixed(2)} R$
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
  
  );
};


