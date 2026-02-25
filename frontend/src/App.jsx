import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPatientPage from './pages/RegisterPatientPage';
import RegisterDoctorPage from './pages/RegisterDoctorPage';
import RegisterStaffPage from './pages/RegisterStaffPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminPatientProfile from './pages/AdminPatientProfile';
import PatientDashboard from './pages/PatientDashboard';
import PatientProfile from './pages/PatientProfile';
import FinanceDashboard from './pages/FinanceDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import BookAppointmentPage from './pages/BookAppointmentPage';
import MedicalRecordsPage from './pages/MedicalRecordsPage';
import AddMedicalRecordPage from './pages/AddMedicalRecordPage';
import AddVitalsPage from './pages/AddVitalsPage';
import FeedbackPage from './pages/FeedbackPage';
import AdminFeedbackPage from './pages/AdminFeedbackPage';
import AdminAnnouncementPage from './pages/AdminAnnouncementPage';
import StaffDashboard from './pages/StaffDashboard';
import ChatbotIcon from './components/ChatbotIcon';

const AnimatedRoutes = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
                <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
                <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
                <Route path="/register" element={<PageTransition><RegisterPatientPage /></PageTransition>} />
                <Route path="/register/patient" element={<PageTransition><RegisterPatientPage /></PageTransition>} />
                <Route path="/register/doctor" element={<PageTransition><RegisterDoctorPage /></PageTransition>} />
                <Route path="/register/staff" element={<PageTransition><RegisterStaffPage /></PageTransition>} />
                <Route path="/admin/dashboard" element={<PageTransition><AdminDashboard /></PageTransition>} />
                <Route path="/admin/patient/:id" element={<PageTransition><AdminPatientProfile /></PageTransition>} />
                <Route path="/admin/feedback" element={<PageTransition><AdminFeedbackPage /></PageTransition>} />
                <Route path="/admin/announcements" element={<PageTransition><AdminAnnouncementPage /></PageTransition>} />
                <Route path="/patients/dashboard" element={<PageTransition><PatientDashboard /></PageTransition>} />
                <Route path="/patients/profile" element={<PageTransition><PatientProfile /></PageTransition>} />
                <Route path="/finance/dashboard" element={<PageTransition><FinanceDashboard /></PageTransition>} />
                <Route path="/doctor/dashboard" element={<PageTransition><DoctorDashboard /></PageTransition>} />
                <Route path="/staff/dashboard" element={<PageTransition><StaffDashboard /></PageTransition>} />
                <Route path="/appointments/add" element={<PageTransition><BookAppointmentPage /></PageTransition>} />
                <Route path="/appointments/patient/edit/:id" element={<PageTransition><BookAppointmentPage /></PageTransition>} />
                <Route path="/medical-records/patient/:id" element={<PageTransition><MedicalRecordsPage /></PageTransition>} />
                <Route path="/vitals/patient/:id" element={<PageTransition><MedicalRecordsPage initialTab="trends" /></PageTransition>} />
                <Route path="/medical-records/add/:id" element={<PageTransition><AddMedicalRecordPage /></PageTransition>} />
                <Route path="/vitals/add/:id" element={<PageTransition><AddVitalsPage /></PageTransition>} />
                <Route path="/feedback/my-feedbacks" element={<PageTransition><FeedbackPage /></PageTransition>} />
                <Route path="/feedback/add/:appointmentId" element={<PageTransition><FeedbackPage /></PageTransition>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AnimatePresence>
    );
};

function App() {
    return (
        <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', minHeight: '100vh', width: '100%' }}>
            <Router>
                <AnimatedRoutes />
                <ChatbotIcon />
            </Router>
        </div>
    );
}

export default App;

