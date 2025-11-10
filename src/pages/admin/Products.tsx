//
// === CÓDIGO COMPLETO CORRIGIDO PARA: src/pages/admin/Products.tsx ===
//
import { Navbar } from "@/components/Navbar";
import { Button, buttonVariants } from "@/components/ui/button"; // Importe buttonVariants
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, ArrowLeft, Edit, Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchAllProducts, deleteProduct } from "@/lib/api";
import { Product } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

// Formata o preço de centavos (ex: 799900) para R$ (ex: R$ 7.999,00)
const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
};

export const AdminProducts = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [productToDelete, setProductToDelete] = useState<Product | null>(
        null
    );

    // Query para buscar os produtos
    const {
        data: products,
        isLoading,
        isError,
    } = useQuery<Product[]>({
        queryKey: ["adminProducts"],
        queryFn: fetchAllProducts,
    });

    // Mutação para deletar o produto
    const deleteMutation = useMutation({
        mutationFn: (product: Product) => deleteProduct(product),
        onSuccess: () => {
            toast({
                title: "Sucesso!",
                description: "Produto excluído com sucesso.",
            });
            queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
            setProductToDelete(null);
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Erro ao excluir produto",
                description: error.message,
            });
            setProductToDelete(null);
        },
    });

    const handleDeleteClick = (product: Product) => {
        setProductToDelete(product);
    };

    const handleConfirmDelete = () => {
        if (productToDelete) {
            deleteMutation.mutate(productToDelete);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container py-8">
                {/* Cabeçalho da Página */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="mb-2"
                        >
                            <Link to="/admin">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar ao Painel
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-bold text-foreground">
                            Gerenciar Produtos
                        </h1>
                    </div>
                    <Button asChild>
                        <Link to="/admin/products/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Novo
                        </Link>
                    </Button>
                </div>

                {/* Tabela de Produtos */}
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">
                                    Imagem
                                </TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Preço</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[100px]">
                                    Ações
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading &&
                                // Skeleton (Carregamento)
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <Skeleton className="h-12 w-12 rounded-md" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-5 w-3/4" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-5 w-1/4" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-5 w-1/2" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                        </TableCell>
                                        <TableCell className="flex gap-2">
                                            <Skeleton className="h-8 w-8" />
                                            <Skeleton className="h-8 w-8" />
                                        </TableCell>
                                    </TableRow>
                                ))}

                            {/*
                AQUI ESTÁ A CORREÇÃO!
                O comentário foi substituído pelo JSX correto.
              */}
                            {isError && (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center text-destructive"
                                    >
                                        <AlertTriangle className="mr-2 inline h-4 w-4" />
                                        Erro ao carregar os produtos.
                                    </TableCell>
                                </TableRow>
                            )}

                            {!isLoading &&
                                !isError &&
                                products?.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <img
                                                src={
                                                    product.images?.[0] ||
                                                    "/placeholder.svg"
                                                }
                                                alt={product.name}
                                                className="h-12 w-12 rounded-md object-cover"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {product.name}
                                        </TableCell>
                                        <TableCell>
                                            {formatPrice(product.price)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {product.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {product.isPromotion ? (
                                                <Badge variant="destructive">
                                                    Promoção
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    Normal
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="flex gap-2">
                                            {/* Link de Edição */}
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                asChild
                                            >
                                                <Link
                                                    to={`/admin/products/edit/${product.id}`}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            {/* Botão de Excluir */}
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                    handleDeleteClick(product)
                                                }
                                                disabled={
                                                    deleteMutation.isPending
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </div>

                {!isLoading && !isError && products?.length === 0 && (
                    <div className="py-20 text-center text-muted-foreground">
                        Nenhum produto cadastrado ainda.
                    </div>
                )}
            </main>

            {/* Diálogo de Confirmação de Exclusão */}
            <AlertDialog
                open={!!productToDelete}
                onOpenChange={(open) => {
                    if (!open) {
                        setProductToDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso irá excluir
                            permanentemente o produto
                            <span className="font-medium">
                                {" "}
                                "{productToDelete?.name}"{" "}
                            </span>
                            e remover suas imagens.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className={buttonVariants({
                                variant: "destructive",
                            })}
                            onClick={handleConfirmDelete}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending
                                ? "Excluindo..."
                                : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminProducts;
