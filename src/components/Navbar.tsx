// src/components/Navbar.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, User, LogOut, Home, ShoppingBag, Settings, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button"; 

// Componente Navbar principal
export function Navbar() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async (e: React.MouseEvent) => {
    // Previne qualquer comportamento padrão do botão
    e.preventDefault();
    
    console.log("🔴 [Navbar] 1. Botão clicado");

    try {
      console.log("🔴 [Navbar] 2. Chamando signOut do contexto...");
      
      // Adicionei um await explícito aqui
      await signOut();
      
      console.log("🔴 [Navbar] 3. SignOut finalizado com sucesso. Navegando...");
      navigate("/login");
      
    } catch (err) {
      console.error("🔴 [Navbar] Erro ao sair:", err);
    }
  };

  return (
    <nav className="bg-gray-900 text-white px-4 py-3 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="font-bold text-xl tracking-tight text-white hover:text-blue-200 transition">
          BV Celular
        </Link>

        {/* Botão Menu Mobile */}
        <button className="md:hidden block text-white" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>

        {/* Links de Navegação */}
        <div className={`${open ? "block" : "hidden"} md:flex md:items-center md:gap-6 absolute md:static bg-gray-900 md:bg-transparent left-0 right-0 top-14 md:top-0 px-6 py-6 md:p-0 shadow-xl md:shadow-none border-t md:border-none border-gray-800 z-40`}>
          
          <Link to="/" className="flex items-center gap-2 py-2 hover:text-blue-400 transition" onClick={() => setOpen(false)}>
            <Home size={18} /> Início
          </Link>
          
          <Link to="/produtos" className="flex items-center gap-2 py-2 hover:text-blue-400 transition" onClick={() => setOpen(false)}>
            <ShoppingBag size={18} /> Produtos
          </Link>
          
          <Link to="/servicos" className="flex items-center gap-2 py-2 hover:text-blue-400 transition" onClick={() => setOpen(false)}>
            <Settings size={18} /> Serviços
          </Link>

          {/* Link Admin Condicional */}
          {role === 'admin' && (
             <Link to="/admin" className="flex items-center gap-2 py-2 text-yellow-400 hover:text-yellow-300 transition" onClick={() => setOpen(false)}>
               <LayoutDashboard size={18} /> Painel
             </Link>
          )}

          {/* Área de Auth */}
          <div className="mt-4 md:mt-0 md:ml-4 flex flex-col md:flex-row items-start md:items-center gap-4">
            {loading ? (
              <span className="text-sm opacity-60">Carregando...</span>
            ) : user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                   <User size={16} />
                   <span className="truncate max-w-[150px]">{user.email}</span>
                   {role === 'wholesale' && <span className="text-xs bg-blue-800 px-2 py-0.5 rounded">Atacado</span>}
                </div>
                
                {/* TESTE: Se o componente Button falhar, tente descomentar a linha abaixo e usar o button nativo */}
                {/* <button onClick={handleLogout} className="bg-red-600 p-2 rounded text-white">SAIR (Teste)</button> */}

                <Button 
                  onClick={(e) => handleLogout(e)} 
                  variant="destructive" 
                  size="sm"
                  className="w-full md:w-auto flex items-center gap-2 cursor-pointer" // Forcei cursor-pointer
                >
                  <LogOut size={16} /> Sair
                </Button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)}>
                <Button variant="default" size="sm" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                  <User size={16} className="mr-2"/> Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
