
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Reader from "./pages/Reader";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/layout/Navbar";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Create a new QueryClient instance
const queryClient = new QueryClient();

// Define a global variable to disable the Lovable badge
// This will be detected by the Lovable platform and hide the badge
(window as Window).__LOVABLE_HIDE_BADGE = true;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Reader />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
