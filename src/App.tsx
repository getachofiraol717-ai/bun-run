import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavProvider } from "@/contexts/NavContext";
import { WellbeingProvider } from "@/contexts/WellbeingContext";
import Navbar from "@/components/Navbar";
import AdminGuard from "@/components/AdminGuard";
import AuthGuard from "@/components/AuthGuard";
import LanguageSync from "@/components/LanguageSync";
import RouteSEO from "@/components/RouteSEO";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useSessionTracker } from "@/hooks/useSessionTracker";
import { useAuth } from "@/contexts/AuthContext";
import { GlobalAccessibilityLayer } from "@/components/accessibility/GlobalAccessibilityLayer";

// Pages — static
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import AITutor from "./pages/AITutor";
import Quiz from "./pages/Quiz";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";
import AdminAccess from "./pages/AdminAccess";
import AdminLogin from "./pages/AdminLogin";
import Logout from "./pages/Logout";
import Wellbeing from "./pages/Wellbeing";
import StudyAnalytics from "./pages/StudyAnalytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Pages — lazy (heavy 3D / large bundles)
const GalaxyExplorer = React.lazy(() => import("./pages/GalaxyExplorer"));
const LearningWorlds = React.lazy(() => import("./pages/LearningWorlds"));
const Guilds         = React.lazy(() => import("./pages/Guilds"));
const QuizBattles    = React.lazy(() => import("./pages/QuizBattles"));
const StudyRooms     = React.lazy(() => import("./pages/StudyRooms"));
const GalaxyPathways = React.lazy(() => import("./pages/GalaxyPathways"));
const ClassroomMode  = React.lazy(() => import("./pages/ClassroomMode"));
const CreatorHub        = React.lazy(() => import("./pages/creator/CreatorHub"));
const CreatorWorkspace  = React.lazy(() => import("./pages/creator/CreatorWorkspace"));
const CreatorGenerator  = React.lazy(() => import("./pages/creator/CreatorGenerator"));
const CreatorAcademy    = React.lazy(() => import("./pages/creator/CreatorAcademy"));
const CreatorProjects   = React.lazy(() => import("./pages/creator/CreatorProjects"));
const CreatorMarketplace= React.lazy(() => import("./pages/creator/CreatorMarketplace"));
const CreatorLab        = React.lazy(() => import("./pages/creator/CreatorLab"));
const CreatorCollab     = React.lazy(() => import("./pages/creator/CreatorCollab"));
const CreatorRoadmap    = React.lazy(() => import("./pages/creator/CreatorRoadmap"));
const Communication = React.lazy(() => import("./pages/Communication"));
const MargeOSShell      = React.lazy(() => import("./plugins/margeos/MargeOSShell"));

const Lazy = ({ children }: { children: React.ReactNode }) => (
  <React.Suspense fallback={
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-primary font-orbitron text-lg neon-text animate-pulse">🌌 Loading...</div>
    </div>
  }>{children}</React.Suspense>
);

const GlobalSystems = () => {
  return (
    <>
      <GlobalAccessibilityLayer />
    </>
  );
};

const AppContent = () => {
  useSessionTracker();
  return (
    <>
      <RouteSEO />
      <LanguageSync />
      <Navbar />
      <GlobalSystems />
      <Routes>
        {/* Core */}
        <Route path="/"               element={<Index />} />
        <Route path="/index"          element={<Index />} />
        <Route path="/home"           element={<Index />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/register"       element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard"      element={<AuthGuard><Dashboard /></AuthGuard>} />
        <Route path="/library"    element={<AuthGuard><Library /></AuthGuard>} />
        <Route path="/ai-tutor"   element={<AuthGuard><AITutor /></AuthGuard>} />
        <Route path="/quiz"       element={<AuthGuard><Quiz /></AuthGuard>} />
        <Route path="/pricing"    element={<AuthGuard><Pricing /></AuthGuard>} />
        <Route path="/contact"    element={<AuthGuard><Contact /></AuthGuard>} />
        <Route path="/settings"   element={<AuthGuard><Settings /></AuthGuard>} />
        <Route path="/wellbeing"  element={<AuthGuard><Wellbeing /></AuthGuard>} />
        <Route path="/analytics"  element={<AuthGuard><StudyAnalytics /></AuthGuard>} />
        <Route path="/logout"     element={<Logout />} />

        {/* Admin */}
        <Route path="/admin-access" element={<AdminAccess />} />
        <Route path="/admin-login"  element={<AdminLogin />} />
        <Route path="/admin"        element={<AdminGuard><Admin /></AdminGuard>} />

        {/* Galaxy */}
        <Route path="/galaxy"    element={<AuthGuard><Lazy><GalaxyExplorer /></Lazy></AuthGuard>} />

        {/* Task 5 — World + Network */}
        <Route path="/worlds"    element={<AuthGuard><Lazy><LearningWorlds /></Lazy></AuthGuard>} />
        <Route path="/guilds"    element={<AuthGuard><Lazy><Guilds /></Lazy></AuthGuard>} />
        <Route path="/battles"   element={<AuthGuard><Lazy><QuizBattles /></Lazy></AuthGuard>} />
        <Route path="/rooms"     element={<AuthGuard><Lazy><StudyRooms /></Lazy></AuthGuard>} />
        <Route path="/pathways"  element={<AuthGuard><Lazy><GalaxyPathways /></Lazy></AuthGuard>} />
        <Route path="/classroom" element={<AuthGuard><Lazy><ClassroomMode /></Lazy></AuthGuard>} />

        {/* Creator Ecosystem (Phase 5) */}
        <Route path="/creator"             element={<AuthGuard><Lazy><CreatorHub /></Lazy></AuthGuard>} />
        <Route path="/creator/workspace"   element={<AuthGuard><Lazy><CreatorWorkspace /></Lazy></AuthGuard>} />
        <Route path="/creator/workspace/:projectId" element={<AuthGuard><Lazy><CreatorWorkspace /></Lazy></AuthGuard>} />
        <Route path="/creator/generator"   element={<AuthGuard><Lazy><CreatorGenerator /></Lazy></AuthGuard>} />
        <Route path="/creator/academy"     element={<AuthGuard><Lazy><CreatorAcademy /></Lazy></AuthGuard>} />
        <Route path="/creator/projects"    element={<AuthGuard><Lazy><CreatorProjects /></Lazy></AuthGuard>} />
        <Route path="/creator/marketplace" element={<AuthGuard><Lazy><CreatorMarketplace /></Lazy></AuthGuard>} />
        <Route path="/creator/lab"         element={<AuthGuard><Lazy><CreatorLab /></Lazy></AuthGuard>} />
        <Route path="/creator/collab"      element={<AuthGuard><Lazy><CreatorCollab /></Lazy></AuthGuard>} />
        <Route path="/creator/roadmap"     element={<AuthGuard><Lazy><CreatorRoadmap /></Lazy></AuthGuard>} />

        {/* MargeOS — AI Operating System layer */}
        <Route path="/communication" element={<AuthGuard><Lazy><Communication /></Lazy></AuthGuard>} />
        <Route path="/margeos" element={<AuthGuard><Lazy><MargeOSShell /></Lazy></AuthGuard>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <NavProvider>
            <WellbeingProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ErrorBoundary>
                    <AppContent />
                  </ErrorBoundary>
                </BrowserRouter>
              </TooltipProvider>
            </WellbeingProvider>
          </NavProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
