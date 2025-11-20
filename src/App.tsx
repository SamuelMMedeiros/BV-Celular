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
import AdminLogistics from "./pages/admin/Logistics"; // <-- IMPORTAR AQUI

import DriverDashboard from "./pages/driver/Dashboard";
import DriverLogin from "./pages/DriverLogin";

import Acessorios from "./pages/Acessorios";
import CustomerLogin from "./pages/CustomerLogin";
import MinhaConta from "./pages/MinhaConta";
import ProductDetails from "./pages/ProductDetails";
import WarrantyPage from "./pages/Warranty";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});

const EmployeeTracker = () => {
    const [searchParams] = useSearchParams();
    useEffect(() => {
        const ref = searchParams.get("ref");
        if (ref) {
            localStorage.setItem("bv_employee_ref", ref);
            console.log("Referência de funcionário capturada:", ref);
        }
    }, [searchParams]);
    return null;
};

const PublicLayout = () => (
    <CustomerAuthProvider>
        <CartProvider>
            <EmployeeTracker />
            <Outlet />
        </CartProvider>
    </CustomerAuthProvider>
);

const AdminLayout = () => (
    <AuthProvider>
        <CustomerAuthProvider>
            <CartProvider>
                <Outlet />
            </CartProvider>
        </CustomerAuthProvider>
    </AuthProvider>
);

const DriverLayout = () => (
    <div className="bg-slate-50 min-h-screen">
        <Outlet />
    </div>
);

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <ThemeProvider defaultTheme="system" storageKey="bv-celular-theme">
                <BrowserRouter>
                    <Routes>
                        {/* Rotas Públicas */}
                        <Route element={<PublicLayout />}>
                            <Route path="/" element={<Index />} />
                            <Route path="/login" element={<CustomerLogin />} />
                            <Route
                                path="/admin-login"
                                element={<AdminLoginPage />}
                            />
                            <Route path="/aparelhos" element={<Aparelhos />} />
                            <Route path="/promocoes" element={<Promocoes />} />
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

                            <Route path="*" element={<NotFound />} />
                        </Route>

                        {/* Rotas de Admin */}
                        <Route path="/admin" element={<AdminLayout />}>
                            <Route element={<ProtectedRoute />}>
                                <Route index element={<Admin />} />
                                <Route
                                    path="products"
                                    element={<AdminProducts />}
                                />
                                <Route
                                    path="products/new"
                                    element={<AdminProductForm />}
                                />
                                <Route
                                    path="products/edit/:productId"
                                    element={<AdminProductForm />}
                                />
                                <Route
                                    path="stores"
                                    element={<AdminStores />}
                                />
                                <Route
                                    path="employees"
                                    element={<AdminEmployees />}
                                />
                                <Route
                                    path="drivers"
                                    element={<AdminDrivers />}
                                />
                                <Route
                                    path="clients"
                                    element={<AdminClients />}
                                />
                                <Route
                                    path="orders"
                                    element={<AdminOrders />}
                                />
                                <Route
                                    path="banners"
                                    element={<AdminBanners />}
                                />
                                <Route
                                    path="warranties"
                                    element={<AdminWarranties />}
                                />
                                <Route
                                    path="coupons"
                                    element={<AdminCoupons />}
                                />
                                <Route
                                    path="logistics"
                                    element={<AdminLogistics />}
                                />{" "}
                                {/* <-- ROTA NOVA */}
                            </Route>
                        </Route>

                        {/* Rotas de Entregador */}
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
            </ThemeProvider>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
