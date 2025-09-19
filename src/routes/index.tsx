import { Route, Routes } from "react-router-dom";

// Helpers
import { AuthRoute } from "./helpers/AuthRoute";
import { GuestRoute } from "./helpers/GuestRoute";
//layout 
import BarberRoutesWithLayout from "../routes/RoutesWithLayout";

// Pages
import LoginPage from "../pages/LoginPage";
import Register from "../pages/Register";
import  Index  from "../pages/HomePage";
import Dashboard from "../pages/DashboardPage"
import Agenda from "../pages/AgendaPage"
import Availability from "../pages/AvailabilityPage"
import Chatbot from "../pages/Chatbot"
import Clients from "../pages/ClientsPage"
import Financial from "../pages/FinancialPage"
import NotificationPanel from "../pages/NotificationPanel"
import Products from "../pages/ProductsPage"
import Services from "../pages/BarberServices";
import PersonalInformation from "../pages/PersonalInformation";
import AdminDashboard from "../pages/adminPage";
import AppointmentActions from "../pages/clientappointments";
import Payment from "../pages/payment";
import AdminReferralPage from "../pages/AdminReferralPage";


const publicRoutes = [
  {
    path: "/login",
    element: <LoginPage />
  },
  {
  path: "/register",
  element: <Register/>
  },
  {
    path: "/",
    element: <Index/>
  },
  {
    path: "/Chatbot",
    element: <Chatbot/>
  },
    {
    path: "/clientAppointments",
    element: <AppointmentActions/>
  },
] as const;

const authRoutes = [
  {
    path: "/Dashboard",
    element: <Dashboard/>
  },
  {
    path: "/Agenda",
    element: <Agenda/>
  },
  {
    path: "/Availability",
    element: <Availability/>
  }, 
   {
    path: "/Services",
    element: <Services/>
  },  
  {
    path: "/Clients",
    element: <Clients/>
  },
   {
    path: "/Financial",
    element: <Financial/>
  },
  {
    path: "/Notification",
    element: <NotificationPanel/>
  },
  {
    path: "/Products",
    element: <Products/>
  },
 {
    path: "/Info",
    element: <PersonalInformation/>
  },
   {
    path: "/AdmPage",
    element: <AdminDashboard/>
  },
   {
    path: "/changePayment",
    element: <Payment/>
  },
  {
    path: "/admin-referrals",
    element: <AdminReferralPage/>
  },
  

] as const;

 

export function AppRoutes() {
  return (
    <Routes>
      {publicRoutes.map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={<GuestRoute>{element}</GuestRoute>}
        />
      ))}
      <Route
        element={
          <AuthRoute>
            <BarberRoutesWithLayout />
          </AuthRoute>
        }
      >
        {authRoutes.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Route>
    </Routes>
  );
}