import { X, ShoppingCart, MessageCircle } from "lucide-react";
import { useEffect } from "react";
import { Product, formatPrice, PLACEHOLDER_IMAGE } from "@/contexts/StoreContext";

export default function ProductDetailsModal({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (product) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [product]);

  if (!product) return null;

  const whatsappHref =
    product.whatsappLink ||
    `https://wa.me/5571981971680?text=${encodeURIComponent(
      `Olá! Tenho interesse no produto: ${product.name} (${formatPrice(
        product.price
      )})`
    )}`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="slime-card relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-[#39ff14]/40 bg-black/70 text-white/80 transition-colors hover:text-[#39ff14]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Image */}
          <div className="aspect-square overflow-hidden bg-[#1a1a1a] md:rounded-l-3xl">
            <img
              src={product.image || PLACEHOLDER_IMAGE}
              alt={product.name}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
              }}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col p-6 md:py-8 md:pr-8">
            <span className="mb-3 inline-flex w-fit rounded-full border border-[#39ff14]/40 px-3 py-1 text-[11px] font-semibold slime-neon">
              {product.category}
            </span>
            <h2 className="text-2xl font-extrabold text-white md:text-3xl">
              {product.name}
            </h2>
            <p className="mt-3 text-3xl font-extrabold slime-neon">
              {formatPrice(product.price)}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              {product.description}
            </p>

            {/* Purchase area */}
            <div className="mt-7 space-y-3">
              <a
                href={product.shopeeLink || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff5722] px-6 py-3.5 font-bold text-white transition-all hover:shadow-[0_0_22px_rgba(255,87,34,0.5)]"
              >
                <ShoppingCart className="h-5 w-5" /> Comprar Online (Shopee)
              </a>
              <p className="text-xs text-white/40">
                Para sua segurança, ao clicar acima você será redirecionado para
                a nossa loja oficial na plataforma Shopee para finalizar o
                pagamento e envio.
              </p>

              <div className="flex items-center gap-3 py-2">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-xs font-semibold text-white/50">OU</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 font-bold text-black transition-all hover:shadow-[0_0_22px_rgba(37,211,102,0.5)]"
              >
                <MessageCircle className="h-5 w-5" /> Comprar e Retirar (WhatsApp)
              </a>
              <p className="text-xs text-white/40">
                Fale com nossa equipe para negociar e retirar o produto
                presencialmente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
