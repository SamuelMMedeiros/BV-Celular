/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { AuthContext } from "@/contexts/AuthContext";
import { useContext } from "react";
import {
    fetchProducts,
    fetchClients,
    fetchStores,
    createOrder,
    fetchClientAddresses,
} from "@/lib/api";
import {
    Product,
    CustomerProfile,
    Store,
    OrderCartItem,
    Address,
} from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
    Check,
    ChevronsUpDown,
    Plus,
    Trash2,
    ShoppingCart,
    User,
    Search,
    Loader2,
    Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const AdminNewSale = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { employeeProfile } = useContext(AuthContext)!; // Pega quem está logado (Vendedor)

    // Estados de Busca
    const [clientOpen, setClientOpen] = useState(false);
    const [productOpen, setProductOpen] = useState(false);
    const [clientQuery, setClientQuery] = useState("");
    const [productQuery, setProductQuery] = useState("");

    // Estados da Venda
    const [selectedClient, setSelectedClient] =
        useState<CustomerProfile | null>(null);
    const [cart, setCart] = useState<OrderCartItem[]>([]);

    // Estados do Checkout
    const [selectedStoreId, setSelectedStoreId] = useState<string>("");
    const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">(
        "pickup"
    );
    const [selectedAddressId, setSelectedAddressId] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<
        "credit_card" | "pix" | "cash"
    >("credit_card");
    const [isSaving, setIsSaving] = useState(false);

    // Queries
    const { data: products } = useQuery({
        queryKey: ["productsSearch", productQuery],
        queryFn: () => fetchProducts({ q: productQuery }),
    });

    const { data: clients } = useQuery({
        queryKey: ["clientsSearch", clientQuery],
        queryFn: () => fetchClients(clientQuery),
    });

    const { data: stores } = useQuery({
        queryKey: ["stores"],
        queryFn: fetchStores,
    });

    const { data: addresses } = useQuery({
        queryKey: ["clientAddresses", selectedClient?.id],
        queryFn: () =>
            selectedClient
                ? fetchClientAddresses(selectedClient.id)
                : Promise.resolve([]),
        enabled: !!selectedClient,
    });

    // Ações do Carrinho
    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((p) => p.id === product.id);
            if (existing) {
                return prev.map((p) =>
                    p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
                );
            }
            return [
                ...prev,
                {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: 1,
                    category: product.category as "aparelho" | "acessorio",
                },
            ];
        });
        setProductOpen(false);
        toast({ title: "Produto adicionado" });
    };

    const removeFromCart = (id: string) => {
        setCart((prev) => prev.filter((item) => item.id !== id));
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart((prev) =>
            prev.map((item) => {
                if (item.id === id) {
                    const newQty = Math.max(1, item.quantity + delta);
                    return { ...item, quantity: newQty };
                }
                return item;
            })
        );
    };

    const total = cart.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
    );

    // Finalizar Venda
    const handleFinishSale = async () => {
        if (!selectedClient)
            return toast({
                variant: "destructive",
                title: "Selecione um cliente",
            });
        if (cart.length === 0)
            return toast({ variant: "destructive", title: "Carrinho vazio" });
        if (!selectedStoreId)
            return toast({ variant: "destructive", title: "Selecione a loja" });
        if (deliveryType === "delivery" && !selectedAddressId)
            return toast({
                variant: "destructive",
                title: "Selecione o endereço de entrega",
            });

        setIsSaving(true);
        try {
            await createOrder({
                client_id: selectedClient.id,
                store_id: selectedStoreId,
                total_price: total,
                items: cart,
                status: "completed", // Venda balcão já nasce concluída ou pendente? Vamos por completed se for presencial
                employee_id: employeeProfile?.id || null,
                delivery_type: deliveryType,
                address_id:
                    deliveryType === "delivery" ? selectedAddressId : null,
                payment_method: paymentMethod,
                // delivery_fee: 0, // Pode adicionar lógica de taxa manual aqui se quiser
            });

            toast({ title: "Venda realizada com sucesso!" });
            // Reset
            setCart([]);
            setSelectedClient(null);
            setSelectedStoreId("");
            navigate("/admin/orders"); // Vai para lista de pedidos
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.message,
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* COLUNA ESQUERDA: SELEÇÃO */}
                <div className="lg:col-span-2 space-y-8">
                    {/* 1. SELECIONAR CLIENTE */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" /> Cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Popover
                                open={clientOpen}
                                onOpenChange={setClientOpen}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={clientOpen}
                                        className="w-full justify-between h-12 text-base"
                                    >
                                        {selectedClient
                                            ? selectedClient.name
                                            : "Buscar cliente..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0">
                                    <Command shouldFilter={false}>
                                        {" "}
                                        {/* Filtramos via API/State */}
                                        <CommandInput
                                            placeholder="Digite o nome do cliente..."
                                            onValueChange={setClientQuery}
                                        />
                                        <CommandList>
                                            <CommandEmpty>
                                                Nenhum cliente encontrado.
                                            </CommandEmpty>
                                            <CommandGroup>
                                                {clients?.map((client) => (
                                                    <CommandItem
                                                        key={client.id}
                                                        value={client.name}
                                                        onSelect={() => {
                                                            setSelectedClient(
                                                                client
                                                            );
                                                            setClientOpen(
                                                                false
                                                            );
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedClient?.id ===
                                                                    client.id
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span>
                                                                {client.name}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {client.phone} •{" "}
                                                                {client.email}
                                                            </span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {!selectedClient && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    Se o cliente não existe, cadastre-o na aba
                                    "Clientes" primeiro.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* 2. SELECIONAR PRODUTOS */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="h-5 w-5" /> Adicionar
                                Produtos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Popover
                                open={productOpen}
                                onOpenChange={setProductOpen}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={productOpen}
                                        className="w-full justify-between h-12 text-base"
                                    >
                                        Buscar produto para adicionar...
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Nome do produto..."
                                            onValueChange={setProductQuery}
                                        />
                                        <CommandList>
                                            <CommandEmpty>
                                                Nenhum produto encontrado.
                                            </CommandEmpty>
                                            <CommandGroup>
                                                {products?.map((product) => (
                                                    <CommandItem
                                                        key={product.id}
                                                        value={product.name}
                                                        onSelect={() =>
                                                            addToCart(product)
                                                        }
                                                    >
                                                        <div className="flex justify-between w-full items-center">
                                                            <div className="flex flex-col">
                                                                <span>
                                                                    {
                                                                        product.name
                                                                    }
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {
                                                                        product.storage
                                                                    }{" "}
                                                                    •{" "}
                                                                    {
                                                                        product.colors
                                                                    }
                                                                </span>
                                                            </div>
                                                            <span className="font-bold">
                                                                {formatCurrency(
                                                                    product.price
                                                                )}
                                                            </span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>

                            {/* LISTA DE ITENS */}
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produto</TableHead>
                                            <TableHead>Qtd</TableHead>
                                            <TableHead>Preço</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cart.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
                                                    className="text-center py-8 text-muted-foreground"
                                                >
                                                    Carrinho vazio.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            cart.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        {item.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                size="icon"
                                                                variant="outline"
                                                                className="h-6 w-6"
                                                                onClick={() =>
                                                                    updateQuantity(
                                                                        item.id,
                                                                        -1
                                                                    )
                                                                }
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </Button>
                                                            <span>
                                                                {item.quantity}
                                                            </span>
                                                            <Button
                                                                size="icon"
                                                                variant="outline"
                                                                className="h-6 w-6"
                                                                onClick={() =>
                                                                    updateQuantity(
                                                                        item.id,
                                                                        1
                                                                    )
                                                                }
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatCurrency(
                                                            item.price
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-bold">
                                                        {formatCurrency(
                                                            item.price *
                                                                item.quantity
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="text-destructive h-8 w-8"
                                                            onClick={() =>
                                                                removeFromCart(
                                                                    item.id
                                                                )
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
                        </CardContent>
                    </Card>
                </div>

                {/* COLUNA DIREITA: CHECKOUT */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-24 border-primary/20 shadow-lg">
                        <CardHeader className="bg-muted/20 border-b pb-4">
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" /> Finalizar
                                Venda
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            {/* LOJA */}
                            <div className="space-y-2">
                                <Label>Saindo da Loja:</Label>
                                <Select
                                    value={selectedStoreId}
                                    onValueChange={setSelectedStoreId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stores?.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* TIPO DE ENTREGA */}
                            <div className="space-y-2">
                                <Label>Entrega/Retirada:</Label>
                                <RadioGroup
                                    value={deliveryType}
                                    onValueChange={(v: any) =>
                                        setDeliveryType(v)
                                    }
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="pickup"
                                            id="pickup"
                                        />
                                        <Label htmlFor="pickup">Retirada</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="delivery"
                                            id="delivery"
                                        />
                                        <Label htmlFor="delivery">
                                            Entrega
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* ENDEREÇO (Se entrega) */}
                            {deliveryType === "delivery" && (
                                <div className="space-y-2 border p-3 rounded bg-muted/30">
                                    <Label>Endereço do Cliente:</Label>
                                    {addresses && addresses.length > 0 ? (
                                        <Select
                                            value={selectedAddressId}
                                            onValueChange={setSelectedAddressId}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione endereço" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {addresses.map((a) => (
                                                    <SelectItem
                                                        key={a.id}
                                                        value={a.id}
                                                    >
                                                        {a.name} - {a.street}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <p className="text-xs text-destructive">
                                            O cliente não tem endereços
                                            cadastrados.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* PAGAMENTO */}
                            <div className="space-y-2">
                                <Label>Pagamento:</Label>
                                <Select
                                    value={paymentMethod}
                                    onValueChange={(v: any) =>
                                        setPaymentMethod(v)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="credit_card">
                                            Cartão Crédito/Débito
                                        </SelectItem>
                                        <SelectItem value="pix">Pix</SelectItem>
                                        <SelectItem value="cash">
                                            Dinheiro
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-muted-foreground">
                                        Total:
                                    </span>
                                    <span className="text-2xl font-bold text-primary">
                                        {formatCurrency(total)}
                                    </span>
                                </div>
                                <Button
                                    className="w-full h-12 text-lg"
                                    onClick={handleFinishSale}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <Loader2 className="animate-spin mr-2" />
                                    ) : (
                                        <Check className="mr-2" />
                                    )}
                                    Confirmar Venda
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default AdminNewSale;
