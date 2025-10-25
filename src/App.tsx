import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import Dashboard from "./pages/Dashboard";
import ManualControl from "./pages/ManualControl";
import Missions from "./pages/Missions";
import Navigation from "./pages/Navigation";
import SystemStatus from "./pages/SystemStatus";
import Configuration from "./pages/Configuration";
import Logs from "./pages/Logs";
import VDA5050 from "./pages/VDA5050";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const handleEmergencyStop = () => {
    console.log("Emergency stop triggered!");
    // Emergency stop logic will be handled here
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background">
              <AppSidebar />
              <div className="flex-1 flex flex-col">
                <Header onEmergencyStop={handleEmergencyStop} />
                <main className="flex-1 overflow-auto">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/control" element={<ManualControl />} />
                    <Route path="/missions" element={<Missions />} />
                    <Route path="/navigation" element={<Navigation />} />
                    <Route path="/status" element={<SystemStatus />} />
                    <Route path="/config" element={<Configuration />} />
                    <Route path="/logs" element={<Logs />} />
                    <Route path="/vda5050" element={<VDA5050 />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
