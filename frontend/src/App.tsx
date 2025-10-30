import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Loader2 } from "lucide-react";
import Navbar from "./components/NavBar";
import Home from "./pages/Home";
import ArtworkDetail from "./pages/ArtworkDetail";
import Upload from "./pages/Upload";
import Gallery from "./pages/Gallery";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Test from "./pages/Test";
import Explore from "./pages/Explore";
import Marketplace from "./pages/MarketPlace";
import Reports from "./pages/Admin/Reports";
import Community from "./pages/Community";
import About from "./pages/About";
import AIImageModifier from "./pages/AiImageModifier";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import Evaluation from "./pages/Evaluation";
import TechniqueEncyclopedia from "./pages/TechniqueEncyclopedia";
import MyListings from "./pages/MyListings";
const queryClient = new QueryClient();

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center liquid-bg">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/artwork/:id" element={<ArtworkDetail />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/test" element={<Test />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/community" element={<Community />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/ai-image-modifier" element={<AIImageModifier />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/adminDashboard" element={<AdminDashboard />} />
        <Route path="/evaluation" element={<Evaluation />} />
        <Route path="/technique-encyclopedia" element={<TechniqueEncyclopedia />} />
        <Route path="/my-listings" element={<MyListings />} />

        
      </Routes>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;