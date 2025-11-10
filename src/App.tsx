//
// === CÓDIGO COMPLETO PARA: src/App.tsx ===
//
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
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
// 1. Importe a nova página de Funcionários
import AdminEmployees from "./pages/admin/Employees";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Rotas Públicas */}
                        <Route path="/" element={<Index />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/aparelhos" element={<Aparelhos />} />
                        <Route path="/promocoes" element={<Promocoes />} />

                        {/* Rotas Protegidas */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/admin" element={<Admin />} />
                            {/* Produtos */}
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
                            {/* Lojas */}
                            <Route
                                path="/admin/stores"
                                element={<AdminStores />}
                            />
                            {/* 2. Adicione a nova rota para Funcionários */}
                            <Route
                                path="/admin/employees"
                                element={<AdminEmployees />}
                            />
                        </Route>

                        {/* Rota de "Não Encontrado" */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
