import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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
import AdminClients from "./pages/admin/Clients"; // 1. Importa a nova página
import Acessorios from "./pages/Acessorios";
import CustomerLogin from "./pages/CustomerLogin";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <AuthProvider>
                <CartProvider>
                    <CustomerAuthProvider>
                        <BrowserRouter>
                            <Routes>
                                {/* Rotas Públicas */}
                                <Route path="/" element={<Index />} />
                                <Route
                                    path="/login"
                                    element={<CustomerLogin />}
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

                                {/* Rotas Protegidas (Admin) */}
                                <Route element={<ProtectedRoute />}>
                                    <Route path="/admin" element={<Admin />} />
                                    <Route
                                        path="/admin/products"
                                        element={<AdminProducts />}
                                    />
                                    <Route
                                        path="/admin/products/new"
                                        element={<AdminProductForm />}
                                    />
                                    <Route
                                        path="/admin/products/edit/:productId"
                                        element={<AdminProductForm />}
                                    />
                                    <Route
                                        path="/admin/stores"
                                        element={<AdminStores />}
                                    />
                                    <Route
                                        path="/admin/employees"
                                        element={<AdminEmployees />}
                                    />
                                    <Route
                                        path="/admin/clients"
                                        element={<AdminClients />}
                                    />{" "}
                                    {/* 2. Rota de Clientes */}
                                </Route>

                                {/* Rota de "Não Encontrado" */}
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </BrowserRouter>
                    </CustomerAuthProvider>
                </CartProvider>
            </AuthProvider>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
