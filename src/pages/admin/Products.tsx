import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { fetchAllProducts, deleteProduct } from "@/lib/api";
import { Product } from "@/types";
import { Loader2, Plus, Trash2, Edit, Search } from "lucide-react";
import { Link } from "react-router-dom"; // Importante
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const AdminProducts = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");

    const { data: products, isLoading } = useQuery<Product[]>({
        queryKey: ["adminProducts"],
        queryFn: fetchAllProducts,
    });

    const deleteMutation = useMutation({
        mutationFn: (product: Product) => deleteProduct(product),
        onSuccess: () => {
            toast({ title: "Sucesso", description: "Produto removido." });
            queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.message,
            });
        },
    });

    const filteredProducts = products?.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = (product: Product) => {
        if (confirm("Tem certeza que deseja excluir este produto?")) {
            deleteMutation.mutate(product);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Produtos</h1>
                        <p className="text-muted-foreground">
                            Gerencie o catálogo da loja.
                        </p>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar produto..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {/* CORREÇÃO DA ROTA DO BOTÃO ADICIONAR */}
                        <Button asChild>
                            <Link to="/admin/produtos/novo">
                                <Plus className="mr-2 h-4 w-4" /> Novo Produto
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Preço</TableHead>
                                <TableHead>Estoque</TableHead>
                                <TableHead className="text-right">
                                    Ações
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-center py-8"
                                    >
                                        <Loader2 className="animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : !filteredProducts ||
                              filteredProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        Nenhum produto encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProducts.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <div className="font-medium">
                                                {product.name}
                                            </div>
                                            {product.isPromotion && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] h-5"
                                                >
                                                    Promoção
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="capitalize">
                                            {product.category}
                                        </TableCell>
                                        <TableCell>
                                            {formatCurrency(product.price)}
                                        </TableCell>
                                        <TableCell>
                                            {product.quantity}
                                            {product.has_variations && (
                                                <span className="text-xs text-muted-foreground ml-1">
                                                    (Variável)
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {/* CORREÇÃO DA ROTA DE EDIÇÃO */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                asChild
                                            >
                                                <Link
                                                    to={`/admin/produtos/editar/${product.id}`}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive"
                                                onClick={() =>
                                                    handleDelete(product)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </main>
        </div>
    );
};

export default AdminProducts;
