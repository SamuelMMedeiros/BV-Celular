import { Navbar } from "@/components/Navbar";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ProductCard";
import { motion } from "framer-motion";

// Mock data - será substituído por dados reais do backend
const mockProducts = [
  {
    id: "1",
    name: "iPhone 14 Pro",
    storage: "256GB",
    ram: "6GB",
    colors: ["Roxo Profundo", "Dourado", "Prateado"],
    price: 7999,
    stores: ["Loja Centro", "Loja Shopping"],
    images: ["https://images.unsplash.com/photo-1678685888221-cda773a3dcdb"],
    description: "O iPhone 14 Pro apresenta a Dynamic Island, uma nova forma mágica de interagir com seu iPhone."
  },
  {
    id: "2",
    name: "Samsung Galaxy S23",
    storage: "128GB",
    ram: "8GB",
    colors: ["Preto Fantasma", "Branco Fantasma"],
    price: 4999,
    stores: ["Loja Centro"],
    images: ["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c"],
    description: "Galaxy S23 com câmera de 50MP e processador Snapdragon 8 Gen 2."
  }
];

const Aparelhos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold text-foreground">Aparelhos</h1>
          
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome ou modelo..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">Nenhum aparelho encontrado.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Aparelhos;
