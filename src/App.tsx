import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext"; // 1. Importa o CartProvider
import Login from "./pages/Login";
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
import Acessorios from "./pages/Acessorios";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <AuthProvider>
                {/* 3. Envolve o BrowserRouter com o CartProvider */}
                <CartProvider>
                    <BrowserRouter>
                        <Routes>
                            {/* Rotas Públicas */}
                            <Route path="/" element={<Index />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/aparelhos" element={<Aparelhos />} />
                            <Route path="/promocoes" element={<Promocoes />} />
                            <Route
                                path="/acessorios"
                                element={<Acessorios />}
                            />{" "}
                            {/* 4. Nova Rota */}
                            {/* Rotas Protegidas */}
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
                            </Route>
                            {/* Rota de "Não Encontrado" */}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </BrowserRouter>
                </CartProvider>
            </AuthProvider>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
