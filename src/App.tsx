import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './index.css';
import Chatbot from './components/Chatbot';
import BarberPanel from './components/BarberPanel';
import { AuthProvider } from './context/AuthContext';
import RegisterForm from "./components/Register.tsx"
import BarberAgenda from "../src/components/BarberAgenda.tsx"
import BarberAvailability from './components/BarberAvailability.tsx';
import BarberBarbers from './components/BarberBarbers.tsx'; 
import BarberClients from './components/BarberClients.tsx';
import BarberDashboard from './components/BarberDashboard.tsx';
import BarberFinancial from './components/BarberFinancial.tsx';
import BarberProducts from './components/BarberProducts.tsx';
import BarberServices from './components/BarberServices.tsx';
import NotificationPanel from './components/NotificationPanel.tsx';
import ServiceForm from './components/ServiceForm.tsx';
import UnitSelector from './components/UnitSelector.tsx';




function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow p-4 flex gap-4">
            <Link to="/" className="font-bold text-blue-600">Agendamento</Link>
            <Link to="/barber" className="font-bold text-green-600">Painel do Barbeiro</Link>
          </nav>
          <main className="p-4">
            <Routes>
              <Route path="/" element={<Chatbot />} />
              <Route path="/barber/*" element={<BarberPanel />} />
               <Route path='/Register' element={<RegisterForm/>}/>
               <Route path='/BarberAgenda' element={<BarberAgenda/>}/>
               <Route path='/BarberAvailability' element={<BarberAvailability/>}/>
               <Route path='/BarberBarbers' element={<BarberBarbers/>}/>
               <Route path='/BarberClients' element={<BarberClients/>}/>
               <Route path='/BarberDashboard' element={<BarberDashboard/>}/>
               <Route path='/BarberFinancial' element={<BarberFinancial/>}/>
               <Route path='/BarberProducts' element={<BarberProducts/>}/>
               <Route path='/BarberServices' element={<BarberServices/>}/>
               <Route path='/NotificationPanel' element={<NotificationPanel/>}/>
               <Route path='/ServiceForm' element={<ServiceForm/>}/>
               <Route path='/UnitSelector' element={<UnitSelector/>}/>

            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
