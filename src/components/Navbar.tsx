import { Link, useLocation } from "react-router-dom";
import { Smartphone, Tag, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
            <Smartphone className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">BV Celular</span>
        </Link>
        
        <div className="flex items-center gap-2">
          <Button
            variant={isActive("/aparelhos") ? "default" : "ghost"}
            size="sm"
            asChild
          >
            <Link to="/aparelhos" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">Aparelhos</span>
            </Link>
          </Button>
          
          <Button
            variant={isActive("/promocoes") ? "default" : "ghost"}
            size="sm"
            asChild
          >
            <Link to="/promocoes" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Promoções</span>
            </Link>
          </Button>
          
          <Button
            variant={isActive("/admin") ? "default" : "ghost"}
            size="sm"
            asChild
          >
            <Link to="/admin" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};
