import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Trash2, Ticket, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

export function CartDrawer() {
    const {
        cartItems,
        removeFromCart,
        updateQuantity,
        totalPrice,
        itemCount,
        discount,
        applyCoupon,
        coupon,
        removeCoupon,
    } = useCart();

    const [couponInput, setCouponInput] = useState("");

    const handleApplyCoupon = () => {
        if (!couponInput) return;
        applyCoupon(couponInput);
        setCouponInput(""); // Limpa o input após tentar aplicar
    };

    const subtotal = cartItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
    );

    // Gera a mensagem do WhatsApp
    const createWhatsAppMessage = () => {
        const header =
            "Olá! Gostaria de finalizar meu pedido na BV Celular:\n\n";
        const items = cartItems
            .map(
                (item) =>
                    `• ${item.quantity}x ${item.name} - ${formatCurrency(
                        item.price
                    )}`
            )
            .join("\n");

        let totals = `\n\nSubtotal: ${formatCurrency(subtotal)}`;
        if (coupon)
            totals += `\nDesconto (${coupon}): -${formatCurrency(discount)}`;
        totals += `\n*Total Final: ${formatCurrency(totalPrice)}*`;

        return encodeURIComponent(header + items + totals);
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {itemCount > 0 && (
                        <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                            {itemCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Seu Carrinho ({itemCount})</SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 -mx-6 px-6 my-4">
                    {cartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-muted-foreground">
                            <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
                            <p>Seu carrinho está vazio</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {cartItems.map((item) => (
                                <div key={item.id} className="flex gap-4 py-2">
                                    <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                        <img
                                            src={item.images[0]}
                                            alt={item.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-col flex-1 justify-between">
                                        <div className="flex justify-between gap-2">
                                            <h4 className="font-medium text-sm line-clamp-2">
                                                {item.name}
                                            </h4>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                onClick={() =>
                                                    removeFromCart(item.id)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="font-bold text-sm">
                                                {formatCurrency(item.price)}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.id,
                                                            item.quantity - 1
                                                        )
                                                    }
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-4 text-center text-sm">
                                                    {item.quantity}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.id,
                                                            item.quantity + 1
                                                        )
                                                    }
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {cartItems.length > 0 && (
                    <div className="space-y-4 pt-4 border-t">
                        {/* ÁREA DE CUPOM */}
                        <div className="flex gap-2">
                            <Input
                                placeholder="Cupom de desconto"
                                value={couponInput}
                                onChange={(e) => setCouponInput(e.target.value)}
                                disabled={!!coupon} // Desabilita se já tiver cupom
                            />
                            {coupon ? (
                                <Button
                                    variant="destructive"
                                    onClick={removeCoupon}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    variant="secondary"
                                    onClick={handleApplyCoupon}
                                >
                                    <Ticket className="h-4 w-4 mr-2" /> Aplicar
                                </Button>
                            )}
                        </div>

                        {/* RESUMO FINANCEIRO */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Subtotal
                                </span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>

                            {discount > 0 && (
                                <div className="flex justify-between text-sm text-green-600 font-medium">
                                    <span>Desconto ({coupon})</span>
                                    <span>- {formatCurrency(discount)}</span>
                                </div>
                            )}

                            <Separator className="my-2" />

                            <div className="flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span>{formatCurrency(totalPrice)}</span>
                            </div>

                            {/* REMOVIDO: A mensagem "Entrega em até 5 dias úteis" foi retirada daqui */}
                        </div>

                        <SheetFooter>
                            <SheetClose asChild>
                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={() =>
                                        window.open(
                                            `https://wa.me/5534999999999?text=${createWhatsAppMessage()}`,
                                            "_blank"
                                        )
                                    }
                                >
                                    Finalizar no WhatsApp
                                </Button>
                            </SheetClose>
                        </SheetFooter>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
