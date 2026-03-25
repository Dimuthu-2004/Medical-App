import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
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
import AdminReportsPage from './pages/AdminReportsPage';
import StaffDashboard from './pages/StaffDashboard';
import PharmacyDashboard from './pages/PharmacyDashboard';
import PrescriptionOcrPage from './pages/PrescriptionOcrPage';
import BillPage from './pages/BillPage';
import PaymentPage from './pages/PaymentPage';
import ChatbotIcon from './components/ChatbotIcon';
import SymptomAnalyzerPage from './pages/SymptomAnalyzerPage';
import PatientPrescriptionsPage from './pages/PatientPrescriptionsPage';
import SkinScan from './components/SkinScan';

const ScrollToTop = () => {
    const location = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [location.pathname]);

    return null;
};

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
                <Route path="/admin/reports" element={<PageTransition><AdminReportsPage /></PageTransition>} />
                <Route path="/patients/dashboard" element={<PageTransition><PatientDashboard /></PageTransition>} />
                <Route path="/patients/profile" element={<PageTransition><PatientProfile /></PageTransition>} />
                <Route path="/patients/prescriptions" element={<PageTransition><PatientPrescriptionsPage /></PageTransition>} />
                <Route path="/finance/dashboard" element={<PageTransition><FinanceDashboard /></PageTransition>} />
                <Route path="/doctor/dashboard" element={<PageTransition><DoctorDashboard /></PageTransition>} />
                <Route path="/staff/dashboard" element={<PageTransition><StaffDashboard /></PageTransition>} />
                <Route path="/pharmacy/dashboard" element={<PageTransition><PharmacyDashboard /></PageTransition>} />
                <Route path="/ocr" element={<PageTransition><PrescriptionOcrPage /></PageTransition>} />
                <Route path="/patients/prescription-ocr" element={<PageTransition><PrescriptionOcrPage /></PageTransition>} />
                <Route path="/appointments/add" element={<PageTransition><BookAppointmentPage /></PageTransition>} />
                <Route path="/appointments/patient/edit/:id" element={<PageTransition><BookAppointmentPage /></PageTransition>} />
                <Route path="/medical-records/patient/:id" element={<PageTransition><MedicalRecordsPage /></PageTransition>} />
                <Route path="/vitals/patient/:id" element={<PageTransition><MedicalRecordsPage initialTab="trends" /></PageTransition>} />
                <Route path="/medical-records/add/:id" element={<PageTransition><AddMedicalRecordPage /></PageTransition>} />
                <Route path="/vitals/add/:id" element={<PageTransition><AddVitalsPage /></PageTransition>} />
                <Route path="/feedback/my-feedbacks" element={<PageTransition><FeedbackPage /></PageTransition>} />
                <Route path="/feedback/add/:appointmentId" element={<PageTransition><FeedbackPage /></PageTransition>} />
                <Route path="/finance/bill/:id" element={<PageTransition><BillPage /></PageTransition>} />
                <Route path="/payment/checkout" element={<PageTransition><PaymentPage /></PageTransition>} />
                <Route path="/payment/success" element={<PageTransition><PaymentPage /></PageTransition>} />
                <Route path="/payment/cancel" element={<PageTransition><PaymentPage /></PageTransition>} />
                <Route path="/ai/symptoms" element={<PageTransition><SymptomAnalyzerPage /></PageTransition>} />
                <Route path="/skin-scan" element={<PageTransition><SkinScan /></PageTransition>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AnimatePresence>
    );
};

function App() {
    return (
        <div style={{ background: 'transparent', minHeight: '100vh', width: '100%' }}>
            <Router>
                <ScrollToTop />
                <AnimatedRoutes />
                <ChatbotIcon />
            </Router>
        </div>
    );
}

export default App;

