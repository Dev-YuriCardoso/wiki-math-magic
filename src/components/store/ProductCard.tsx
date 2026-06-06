import { Product, formatPrice, PLACEHOLDER_IMAGE } from "@/contexts/StoreContext";

export default function ProductCard({
  product,
  onView,
}: {
  product: Product;
  onView: (product: Product) => void;
}) {
  return (
    <div className="slime-card group flex flex-col overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-1">
      <div className="relative aspect-square overflow-hidden bg-[#1a1a1a]">
        <img
          src={product.image || PLACEHOLDER_IMAGE}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full border border-[#39ff14]/40 bg-black/70 px-3 py-1 text-[10px] font-semibold slime-neon backdrop-blur">
          {product.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-bold text-white">
          {product.name}
        </h3>
        <p className="mt-2 text-xl font-extrabold slime-neon">
          {formatPrice(product.price)}
        </p>
        <button
          onClick={() => onView(product)}
          className="mt-4 w-full rounded-xl border border-[#39ff14] px-4 py-2.5 text-sm font-bold text-[#39ff14] transition-all hover:bg-[#39ff14]/10 hover:shadow-[0_0_18px_rgba(57,255,20,0.45)]"
        >
          Ver Detalhes
        </button>
      </div>
    </div>
  );
}
