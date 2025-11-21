import { Facebook, Instagram, Twitter, Phone, Mail, Smartphone, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom"; // <-- Importar Link

export const Footer = () => {
    return (
        <footer className="bg-card border-t text-card-foreground pt-12 pb-6 mt-auto">
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Coluna 1: Sobre */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <Smartphone className="h-5 w-5" />
                            </div>
                            <span className="text-xl font-bold">BV Celular</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Sua loja de confiança para smartphones e acessórios. 
                            Trazendo tecnologia de ponta com os melhores preços da região.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Coluna 2: Links Rápidos */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Navegação</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link to="/" className="hover:text-primary transition-colors">Início</Link></li>
                            <li><Link to="/aparelhos" className="hover:text-primary transition-colors">Aparelhos</Link></li>
                            <li><Link to="/acessorios" className="hover:text-primary transition-colors">Acessórios</Link></li>
                            <li><Link to="/promocoes" className="hover:text-primary transition-colors">Promoções</Link></li>
                            <li><Link to="/minha-conta" className="hover:text-primary transition-colors">Minha Conta</Link></li>
                        </ul>
                    </div>

                    {/* Coluna 3: Categorias */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Categorias</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link to="/aparelhos" className="hover:text-primary transition-colors">iPhones</Link></li>
                            <li><Link to="/aparelhos" className="hover:text-primary transition-colors">Androids</Link></li>
                            <li><Link to="/acessorios" className="hover:text-primary transition-colors">Capinhas</Link></li>
                            <li><Link to="/acessorios" className="hover:text-primary transition-colors">Carregadores</Link></li>
                            <li><Link to="/acessorios" className="hover:text-primary transition-colors">Fones de Ouvido</Link></li>
                        </ul>
                    </div>

                    {/* Coluna 4: Contato */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Contato</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                {/* LINK NOVO PARA O AGREGADOR */}
                                <Link to="/links" className="flex items-center gap-3 hover:text-primary transition-colors group">
                                    <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
                                        <Phone className="h-4 w-4 text-primary" />
                                    </div>
                                    <span>Fale Conosco / Localização</span>
                                </Link>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <Mail className="h-4 w-4 text-primary" />
                                </div>
                                <span>contato@bvcelular.com.br</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <Separator className="my-8" />

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} BV Celular. Todos os direitos reservados.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-primary">Termos de Uso</a>
                        <a href="#" className="hover:text-primary">Privacidade</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};