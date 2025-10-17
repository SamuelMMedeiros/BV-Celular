import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { motion } from "framer-motion";
import { Percent } from "lucide-react";

// Mock data de promoções
const mockPromotions = [
  {
    id: "3",
    name: "iPad Air",
    storage: "64GB",
    ram: "8GB",
    colors: ["Azul", "Rosa"],
    price: 3999,
    originalPrice: 4999,
    stores: ["Loja Shopping"],
    images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0"],
    description: "iPad Air com chip M1 e tela Liquid Retina de 10,9 polegadas.",
    isPromotion: true
  }
];

const Promocoes = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
            <Percent className="h-6 w-6 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Promoções</h1>
            <p className="text-sm text-muted-foreground">
              Aproveite nossas ofertas especiais
            </p>
          </div>
        </div>

        {/* Promotions Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mockPromotions.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>

        {mockPromotions.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">
              Nenhuma promoção disponível no momento.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Promocoes;
