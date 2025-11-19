import {
    Facebook,
    Instagram,
    Twitter,
    MapPin,
    Phone,
    Mail,
    Smartphone,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const Footer = () => {
    return (
        <footer className="bg-card border-t text-card-foreground pt-12 pb-6">
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Coluna 1: Sobre */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <Smartphone className="h-5 w-5" />
                            </div>
                            <span className="text-xl font-bold">
                                BV Celular
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Sua loja de confiança para smartphones e acessórios.
                            Trazendo tecnologia de ponta com os melhores preços
                            da região.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a
                                href="#"
                                className="text-muted-foreground hover:text-primary transition-colors"
                            >
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a
                                href="#"
                                className="text-muted-foreground hover:text-primary transition-colors"
                            >
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a
                                href="#"
                                className="text-muted-foreground hover:text-primary transition-colors"
                            >
                                <Twitter className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Coluna 2: Links Rápidos */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Navegação</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <a
                                    href="/"
                                    className="hover:text-primary transition-colors"
                                >
                                    Início
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/aparelhos"
                                    className="hover:text-primary transition-colors"
                                >
                                    Aparelhos
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/acessorios"
                                    className="hover:text-primary transition-colors"
                                >
                                    Acessórios
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/promocoes"
                                    className="hover:text-primary transition-colors"
                                >
                                    Promoções
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/minha-conta"
                                    className="hover:text-primary transition-colors"
                                >
                                    Minha Conta
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Coluna 3: Categorias */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Categorias</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <a
                                    href="/aparelhos"
                                    className="hover:text-primary transition-colors"
                                >
                                    iPhones
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/aparelhos"
                                    className="hover:text-primary transition-colors"
                                >
                                    Androids
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/acessorios"
                                    className="hover:text-primary transition-colors"
                                >
                                    Capinhas
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/acessorios"
                                    className="hover:text-primary transition-colors"
                                >
                                    Carregadores
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/acessorios"
                                    className="hover:text-primary transition-colors"
                                >
                                    Fones de Ouvido
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Coluna 4: Contato */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Contato</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-primary shrink-0" />
                                <span>
                                    Av. Principal, 1000 - Centro
                                    <br />
                                    Uberlândia, MG
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-primary shrink-0" />
                                <span>(34) 99999-8888</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-primary shrink-0" />
                                <span>contato@bvcelular.com.br</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <Separator className="my-8" />

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                    <p>
                        &copy; {new Date().getFullYear()} BV Celular. Todos os
                        direitos reservados.
                    </p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-primary">
                            Termos de Uso
                        </a>
                        <a href="#" className="hover:text-primary">
                            Privacidade
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
