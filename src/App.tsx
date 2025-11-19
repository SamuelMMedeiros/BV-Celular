import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { CustomerAuthProvider } from "@/contexts/CustomerAuthContext";

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
import AdminClients from "./pages/admin/Clients";
import AdminOrders from "./pages/admin/Orders";
import Acessorios from "./pages/Acessorios";
import CustomerLogin from "./pages/CustomerLogin";
import MinhaConta from "./pages/MinhaConta";
import ProductDetails from "./pages/ProductDetails";
import AdminWarranties from "./pages/admin/Warranties";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});

const PublicLayout = () => (
    <CustomerAuthProvider>
        <CartProvider>
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

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
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
                        <Route path="/acessorios" element={<Acessorios />} />
                        <Route path="/minha-conta" element={<MinhaConta />} />
                        <Route
                            path="/produto/:productId"
                            element={<ProductDetails />}
                        />
                        {/* <-- NOVA ROTA */}
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
                            <Route path="stores" element={<AdminStores />} />
                            <Route
                                path="employees"
                                element={<AdminEmployees />}
                            />
                            <Route path="clients" element={<AdminClients />} />
                            <Route path="orders" element={<AdminOrders />} />
                            <Route
                                path="warranties"
                                element={<AdminWarranties />}
                            />
                        </Route>
                    </Route>
                </Routes>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
