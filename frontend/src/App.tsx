import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import UserPage from "./pages/UserPage";
import MerchantPage from "./pages/MerchantPage";
import SimpleDashboard from "./pages/SimpleDashboard";
import AuthTypePage from "./pages/AuthTypePage";
import SupabaseAuthPage from "./pages/SupabaseAuthPage";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "./components/ui/button";



// Layout component that includes the Navbar
const Layout = () => {
  const location = useLocation();
  const hideNavbarRoutes = ['/auth', '/reset-password'];
  // Also hide Navbar on dashboard pages
  const dashboardRoutes = [
    '/user-dashboard',
    '/merchant-dashboard',
    '/enhanced-user-dashboard',
    '/enhanced-merchant-dashboard'
  ];
  const shouldShowNavbar = !hideNavbarRoutes.some(route => location.pathname.startsWith(route)) &&
    !dashboardRoutes.some(route => location.pathname.startsWith(route));

  return (
    <div className="min-h-screen bg-background">
      {shouldShowNavbar && <Navbar />}
      <main className="w-full h-full">
        <Outlet />
      </main>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }: { children: JSX.Element, allowedRoles?: string[] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If specific roles are required, check if user has any of them
  if (allowedRoles.length > 0) {
    const userRole = user.account_type || 'individual';
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

// Public route that redirects to dashboard if user is already authenticated
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user) {
    const accountType = user.account_type || 'individual';
    const dashboard = accountType === 'merchant' ? '/merchant-dashboard' : '/user-dashboard';
    const from = location.state?.from?.pathname || dashboard;
    return <Navigate to={from} replace />;
  }

  return children;
};

const AppContent = () => {
  const { user } = useAuth();
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<Layout />}>
        <Route path="/" element={
          user ? (
            (() => {
              // Allow logged-in users to access the landing page at /
              // They can still be redirected to dashboard via other means
              return <LandingPage />;
            })()
          ) : (
            <LandingPage />
          )
        } />
        {/* Landing page route that all users can access */}
        <Route path="/home" element={<LandingPage />} />
        <Route path="/market" element={<Index />} />
        {/* Make /user and /merchant public routes */}
        <Route path="/user" element={<UserPage />} />
        <Route path="/merchant" element={<MerchantPage />} />
        {/* Auth routes */}
        <Route element={<PublicRoute><Outlet /></PublicRoute>}>
          <Route path="/auth" element={<SupabaseAuthPage />} />
          <Route path="/auth-type" element={<AuthTypePage />} />
        </Route>
        {/* Protected routes */}
        <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
          {/* Dashboard routes */}
          <Route path="/user-dashboard" element={
            <ProtectedRoute allowedRoles={['user', 'individual']}>
              <SimpleDashboard />
            </ProtectedRoute>
          } />
          <Route path="/merchant-dashboard" element={
            <ProtectedRoute allowedRoles={['merchant']}>
              <SimpleDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <SimpleDashboard />
            </ProtectedRoute>
          } />
        </Route>
        {/* 404 route */}
        <Route path="*" element={
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p className="text-xl mb-6">Page not found</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        } />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner position="top-right" />
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  );
};
export default App;
