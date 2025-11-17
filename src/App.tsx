import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom"; // Importe o Outlet

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
import Acessorios from "./pages/Acessorios";
import CustomerLogin from "./pages/CustomerLogin";
import MinhaConta from "./pages/MinhaConta"; // <-- IMPORTAR A NOVA PÁGINA

const queryClient = new QueryClient();

/*
  Layout Público
  - Carrega a autenticação de Cliente e o Carrinho.
  - NÃO carrega o AuthProvider (Admin), evitando o conflito no reload.
*/
const PublicLayout = () => (
    <CustomerAuthProvider>
        <CartProvider>
            <Outlet />{" "}
            {/* Renderiza as rotas filhas (Index, Aparelhos, etc.) */}
        </CartProvider>
    </CustomerAuthProvider>
);

/*
  Layout de Admin
  - Carrega TODOS os contextos (Admin, Cliente e Carrinho).
  - O AuthProvider (Admin) é necessário aqui para o ProtectedRoute funcionar.
*/
const AdminLayout = () => (
    <AuthProvider>
        <CustomerAuthProvider>
            <CartProvider>
                <Outlet />{" "}
                {/* Renderiza as rotas filhas (Admin, AdminProducts, etc.) */}
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
                    {/* Rotas Públicas usam o PublicLayout */}
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

                        {/* --- NOVA ROTA ADICIONADA --- */}
                        <Route path="/minha-conta" element={<MinhaConta />} />

                        {/* A Rota NotFound agora fica aqui para pegar erros 404 públicos */}
                        <Route path="*" element={<NotFound />} />
                    </Route>

                    {/* Rotas de Admin usam o AdminLayout (que inclui o AuthProvider) */}
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route element={<ProtectedRoute />}>
                            {/* /admin agora é a rota "index" deste grupo */}
                            <Route index element={<Admin />} />

                            {/* /admin/products */}
                            <Route
                                path="products"
                                element={<AdminProducts />}
                            />

                            {/* /admin/products/new */}
                            <Route
                                path="products/new"
                                element={<AdminProductForm />}
                            />

                            {/* /admin/products/edit/:productId */}
                            <Route
                                path="products/edit/:productId"
                                element={<AdminProductForm />}
                            />

                            {/* /admin/stores */}
                            <Route path="stores" element={<AdminStores />} />

                            {/* /admin/employees */}
                            <Route
                                path="employees"
                                element={<AdminEmployees />}
                            />

                            {/* /admin/clients */}
                            <Route path="clients" element={<AdminClients />} />
                        </Route>
                    </Route>

                    {/* Nota: A rota "NotFound" foi movida para dentro do PublicLayout 
                      para garantir que qualquer rota não-admin seja tratada por ele.
                    */}
                </Routes>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
