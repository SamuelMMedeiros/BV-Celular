/**
 * @title src/App.tsx
 * @collapsible
 */
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
    BrowserRouter,
    Routes,
    Route,
    Outlet,
    useSearchParams,
} from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { CustomerAuthProvider } from "@/contexts/CustomerAuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";

import AdminLoginPage from "./pages/Login";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";

import Index from "./pages/Index";
import Aparelhos from "./pages/Aparelhos";
import Promocoes from "./pages/Promocoes";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

import AdminProducts from "./pages/admin/Products";
import AdminProductForm from "./pages/admin/ProductForm";
import AdminStores from "./pages/admin/Stores";
import AdminEmployees from "./pages/admin/Employees";
import AdminDrivers from "./pages/admin/Drivers";
import AdminClients from "./pages/admin/Clients";
import AdminOrders from "./pages/admin/Orders";
import AdminBanners from "./pages/admin/Banners";
import AdminWarranties from "./pages/admin/Warranties";
import AdminCoupons from "./pages/admin/Coupons";
import AdminLogistics from "./pages/admin/Logistics";
import AdminWholesale from "./pages/admin/Wholesale";
import AdminLinks from "./pages/admin/Links";
import AdminNewSale from "./pages/admin/NewSale";

import DriverDashboard from "./pages/driver/Dashboard";
import DriverLogin from "./pages/DriverLogin";

import Acessorios from "./pages/Acessorios";
import CustomerLogin from "./pages/CustomerLogin";
import WholesaleLogin from "./pages/WholesaleLogin";
import MinhaConta from "./pages/MinhaConta";
import ProductDetails from "./pages/ProductDetails";
import WarrantyPage from "./pages/Warranty";
import LinksPage from "./pages/LinksPage";
import CheckoutSuccess from "./pages/CheckoutSuccess";

// NOVO: Importar o Widget de Chat
import AIChatWidget from "@/components/AIChatWidget";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});

// --- TRACKER DE FUNCIONÁRIO ---
const EmployeeTracker = () => {
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const ref = searchParams.get("ref");
        if (ref) {
            localStorage.setItem("bv_employee_ref", ref);
        }
    }, [searchParams]);

    return null;
};

// Layouts agora são apenas containers visuais (divs), sem lógica de contexto
const MainLayout = () => (
    <>
        <EmployeeTracker />
        <Outlet />
        {/* NOVO: Adicionar o Widget de Chat */}
        <AIChatWidget />
    </>
);

const DriverLayout = () => (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
        <Outlet />
    </div>
);

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <ThemeProvider defaultTheme="system" storageKey="bv-celular-theme">
                {/* AQUI ESTÁ A CORREÇÃO: 
                    Os Providers agora envolvem TODA a aplicação.
                    Eles não são recriados na troca de rotas.
                */}
                <AuthProvider>
                    <CustomerAuthProvider>
                        <CartProvider>
                            <BrowserRouter>
                                <Routes>
                                    {/* ROTAS PÚBLICAS (Protegidas contra Admin) */}
                                    <Route element={<MainLayout />}>
                                        <Route element={<PublicRoute />}>
                                            <Route
                                                path="/"
                                                element={<Index />}
                                            />
                                            <Route
                                                path="/login"
                                                element={<CustomerLogin />}
                                            />
                                            <Route
                                                path="/atacado-login"
                                                element={<WholesaleLogin />}
                                            />
                                            <Route
                                                path="/admin-login"
                                                element={<AdminLoginPage />}
                                            />

                                            <Route
                                                path="/aparelhos"
                                                element={<Aparelhos />}
                                            />
                                            <Route
                                                path="/promocoes"
                                                element={<Promocoes />}
                                            />
                                            <Route
                                                path="/acessorios"
                                                element={<Acessorios />}
                                            />
                                            <Route
                                                path="/minha-conta"
                                                element={<MinhaConta />}
                                            />
                                            <Route
                                                path="/produto/:productId"
                                                element={<ProductDetails />}
                                            />
                                            <Route
                                                path="/garantia"
                                                element={<WarrantyPage />}
                                            />
                                            <Route
                                                path="/links"
                                                element={<LinksPage />}
                                            />
                                            <Route
                                                path="/success"
                                                element={<CheckoutSuccess />}
                                            />
                                        </Route>

                                        {/* Rota 404 fica fora do PublicRoute para não redirecionar admin perdido */}
                                        <Route
                                            path="*"
                                            element={<NotFound />}
                                        />
                                    </Route>

                                    {/* ROTAS ADMIN (Protegidas) */}
                                    <Route path="/admin">
                                        <Route element={<ProtectedRoute />}>
                                            <Route index element={<Admin />} />
                                            <Route
                                                path="produtos"
                                                element={<AdminProducts />}
                                            />
                                            <Route
                                                path="produtos/novo"
                                                element={<AdminProductForm />}
                                            />
                                            <Route
                                                path="produtos/editar/:productId"
                                                element={<AdminProductForm />}
                                            />
                                            <Route
                                                path="lojas"
                                                element={<AdminStores />}
                                            />
                                            <Route
                                                path="funcionarios"
                                                element={<AdminEmployees />}
                                            />
                                            <Route
                                                path="entregadores"
                                                element={<AdminDrivers />}
                                            />
                                            <Route
                                                path="clientes"
                                                element={<AdminClients />}
                                            />
                                            <Route
                                                path="atacado"
                                                element={<AdminWholesale />}
                                            />
                                            <Route
                                                path="pedidos"
                                                element={<AdminOrders />}
                                            />
                                            <Route
                                                path="banners"
                                                element={<AdminBanners />}
                                            />
                                            <Route
                                                path="garantias"
                                                element={<AdminWarranties />}
                                            />
                                            <Route
                                                path="cupons"
                                                element={<AdminCoupons />}
                                            />
                                            <Route
                                                path="logistica"
                                                element={<AdminLogistics />}
                                            />
                                            <Route
                                                path="links"
                                                element={<AdminLinks />}
                                            />
                                            <Route
                                                path="venda-nova"
                                                element={<AdminNewSale />}
                                            />
                                        </Route>
                                    </Route>

                                    {/* ROTAS ENTREGADOR */}
                                    <Route element={<DriverLayout />}>
                                        <Route
                                            path="/driver-login"
                                            element={<DriverLogin />}
                                        />
                                        <Route
                                            path="/entregador"
                                            element={<DriverDashboard />}
                                        />
                                    </Route>
                                </Routes>
                            </BrowserRouter>
                        </CartProvider>
                    </CustomerAuthProvider>
                </AuthProvider>
            </ThemeProvider>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
