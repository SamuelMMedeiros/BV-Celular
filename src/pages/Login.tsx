/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Nome do arquivo: src/pages/Login.tsx
import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Login: React.FC = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
            variant: "destructive",
            title: "Erro no login",
            description: error.message || "Credenciais inválidas."
        });
      } else {
        // Sucesso - O AuthContext vai detectar a mudança e redirecionar se necessário,
        // mas aqui forçamos a ida para home ou dashboard.
        toast({
            title: "Login realizado!",
            description: "Bem-vindo de volta."
        });
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Tente novamente mais tarde."
      });
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Acessar Conta</h2>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                required 
                placeholder="seu@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                required 
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={localLoading} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-md font-semibold shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {localLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
              <p>Esqueceu a senha? Entre em contato com o suporte.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;