import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ProductCategory =
  | "Camisas Personalizadas"
  | "Mochilas"
  | "Mouse Pads"
  | "PCs Montados";

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Camisas Personalizadas",
  "Mochilas",
  "Mouse Pads",
  "PCs Montados",
];

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  image: string;
  shopeeLink: string;
  whatsappLink?: string;
  description: string;
}

const STORAGE_KEY = "slime_store_products";

const generateId = () => Math.random().toString(36).substring(2, 9);

const PLACEHOLDER =
  "https://placehold.co/600x600/1a1a1a/39ff14?text=Slime+Code";

const defaultProducts: Product[] = [
  {
    id: "prod-1",
    name: "Camisa Gamer Slime Code Neon",
    category: "Camisas Personalizadas",
    price: 89.9,
    image: "https://placehold.co/600x600/1a1a1a/39ff14?text=Camisa+Gamer",
    shopeeLink: "https://shopee.com.br",
    description:
      "Camisa 100% algodão com estampa exclusiva Slime Code em verde neon. Tecido premium, confortável e ideal para o dia a dia gamer. Disponível em vários tamanhos.",
  },
  {
    id: "prod-2",
    name: "Mochila Tech Anti-Furto",
    category: "Mochilas",
    price: 249.9,
    image: "https://placehold.co/600x600/1a1a1a/39ff14?text=Mochila+Tech",
    shopeeLink: "https://shopee.com.br",
    description:
      "Mochila resistente à água com compartimento acolchoado para notebook até 17\", porta USB externa e fecho anti-furto. Perfeita para levar seu setup com estilo.",
  },
  {
    id: "prod-3",
    name: "Mouse Pad Speed XL RGB",
    category: "Mouse Pads",
    price: 119.9,
    image: "https://placehold.co/600x600/1a1a1a/39ff14?text=Mouse+Pad+RGB",
    shopeeLink: "https://shopee.com.br",
    description:
      "Mouse pad gamer estendido (90x40cm) com iluminação RGB nas bordas, base antiderrapante e superfície de alta precisão para máxima performance nos games.",
  },
  {
    id: "prod-4",
    name: "PC Gamer Slime Ultra RTX",
    category: "PCs Montados",
    price: 6499.0,
    image: "https://placehold.co/600x600/1a1a1a/39ff14?text=PC+Gamer",
    shopeeLink: "https://shopee.com.br",
    description:
      "PC Gamer completo: Ryzen 7, 32GB RAM, SSD 1TB NVMe, placa de vídeo RTX dedicada e gabinete com iluminação RGB. Montado e testado pela equipe Slime Code.",
  },
];

interface StoreContextType {
  products: Product[];
  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  resetProducts: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(defaultProducts);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) setProducts(parsed);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const persist = (next: Product[]) => {
    setProducts(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addProduct = (p: Omit<Product, "id">) =>
    persist([{ ...p, id: generateId() }, ...products]);

  const updateProduct = (id: string, p: Partial<Product>) =>
    persist(products.map((prod) => (prod.id === id ? { ...prod, ...p } : prod)));

  const deleteProduct = (id: string) =>
    persist(products.filter((prod) => prod.id !== id));

  const resetProducts = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProducts(defaultProducts);
  };

  return (
    <StoreContext.Provider
      value={{ products, addProduct, updateProduct, deleteProduct, resetProducts }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export const PLACEHOLDER_IMAGE = PLACEHOLDER;

export const formatPrice = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
