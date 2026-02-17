import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import PublicLayout from './layouts/PublicLayout';

import LoginPage from './pages/auth/LoginPage';
import DashboardHome from './pages/dashboard/DashboardHome';

import { ToastProvider } from './context/ToastContext';

// Pages
import LandingPage from './pages/public/LandingPage';
import ContactPage from './pages/public/ContactPage';
import Marketplace from './pages/public/Marketplace';
import Placeholder from './pages/Placeholder';

import PropertiesList from './pages/dashboard/PropertiesList';
import CreateProperty from './pages/dashboard/CreateProperty';
import EditProperty from './pages/dashboard/EditProperty';

// Initial placeholder pages - these will be replaced as we build them
import DocumentsList from './pages/dashboard/DocumentsList';
import UploadDocument from './pages/dashboard/UploadDocument';
import TicketsList from './pages/dashboard/TicketsList';
import TicketDetail from './pages/dashboard/TicketDetail';
import CreateTicket from './pages/dashboard/CreateTicket';

import ConstructionList from './pages/dashboard/ConstructionList';
import ConstructionDetail from './pages/dashboard/ConstructionDetail';
import CreateConstructionSite from './pages/dashboard/CreateConstructionSite';
import EditConstructionSite from './pages/dashboard/EditConstructionSite';
import ManageMilestones from './pages/dashboard/ManageMilestones';
import EditJournalEntry from './pages/dashboard/EditJournalEntry';

import ProfilePage from './pages/dashboard/ProfilePage';
import UsersList from './pages/dashboard/UsersList';
import CreateUser from './pages/dashboard/CreateUser';
import EditUser from './pages/dashboard/EditUser';
import ProjectsList from './pages/dashboard/ProjectsList';
import CreateProject from './pages/dashboard/CreateProject';
import EditProject from './pages/dashboard/EditProject';
import ProjectDetail from './pages/dashboard/ProjectDetail';

import PropertyDetail from './pages/dashboard/PropertyDetail';
import DashboardMarketplace from './pages/dashboard/DashboardMarketplace';

import FinanceHome from './pages/dashboard/FinanceHome';
import TransactionsList from './pages/dashboard/TransactionsList';
import AddTransaction from './pages/dashboard/AddTransaction';
import EditTransaction from './pages/dashboard/EditTransaction';

// The original file had TicketDetail imported twice. Assuming the second one was a copy-paste error and not intended to be a different component.
// import TicketDetail from './pages/dashboard/TicketDetail';

function App() {
  return (
    <Router>
      <ThemeProvider defaultTheme="system" storageKey="madis-ui-theme">
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/marketplace" element={<Marketplace />} />
              </Route>

              {/* Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>

              {/* Protected Dashboard Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<DashboardHome />} />

                {/* Properties */}
                <Route path="properties">
                  <Route index element={<PropertiesList />} />
                  <Route path="new" element={<CreateProperty />} />
                  <Route path=":id" element={<PropertyDetail />} />
                  <Route path=":id/edit" element={<EditProperty />} />
                </Route>

                {/* Documents */}
                <Route path="documents">
                  <Route index element={<DocumentsList />} />
                  <Route path="new" element={<UploadDocument />} />
                </Route>

                {/* Tickets */}
                <Route path="tickets">
                  <Route index element={<TicketsList />} />
                  <Route path="new" element={<CreateTicket />} />
                  <Route path=":id" element={<TicketDetail />} />
                </Route>

                {/* Construction */}
                <Route path="construction">
                  <Route index element={<ConstructionList />} />
                  <Route path="new" element={<CreateConstructionSite />} />
                  <Route path=":id" element={<ConstructionDetail />} />
                  <Route path=":id/edit" element={<EditConstructionSite />} />
                  <Route path=":id/milestones" element={<ManageMilestones />} />
                  <Route path="journal/:id/edit" element={<EditJournalEntry />} />
                </Route>

                {/* Users */}
                <Route path="users">
                  <Route index element={<UsersList />} />
                  <Route path="new" element={<CreateUser />} />
                  <Route path=":id/edit" element={<EditUser />} />
                </Route>

                <Route path="profile" element={<ProfilePage />} />
                <Route path="marketplace" element={<DashboardMarketplace />} />

                {/* Finance */}
                <Route path="finance">
                  <Route index element={<FinanceHome />} />
                  <Route path="transactions">
                    <Route index element={<TransactionsList />} />
                    <Route path="new" element={<AddTransaction />} />
                    <Route path=":id/edit" element={<EditTransaction />} />
                  </Route>
                </Route>

                {/* Projects */}
                <Route path="projects">
                  <Route index element={<ProjectsList />} />
                  <Route path="new" element={<CreateProject />} />
                  <Route path=":id" element={<ProjectDetail />} />
                  <Route path=":id/edit" element={<EditProject />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
