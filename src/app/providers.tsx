import { Toaster } from "@/shared/components/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";
import { UIProvider } from "../context/UIContext";
import { DataProvider } from "../context/DataContext";

const queryClient = new QueryClient();

export const AppProviders = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UIProvider>
        <DataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {children}
          </TooltipProvider>
        </DataProvider>
      </UIProvider>
    </AuthProvider>
  </QueryClientProvider>
);
