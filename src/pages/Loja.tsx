import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowLeft, ShieldCheck, Store as StoreIcon } from "lucide-react";
import { useLMS } from "@/contexts/LMSContext";
import { useStore, PRODUCT_CATEGORIES, Product } from "@/contexts/StoreContext";
import ProductCard from "@/components/store/ProductCard";
import ProductDetailsModal from "@/components/store/ProductDetailsModal";
import AdminStorePanel from "@/components/store/AdminStorePanel";

const PILLS = ["Todos", ...PRODUCT_CATEGORIES] as const;

export default function Loja() {
  const { currentUser } = useLMS();
  const { products } = useStore();
  const isAdmin = currentUser?.role === "admin";

  const [activeCat, setActiveCat] = useState<string>("Todos");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [adminMode, setAdminMode] = useState(false);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCat === "Todos" || p.category === activeCat;
      const matchQuery = p.name.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [products, activeCat, query]);

  return (
    <div className="slime-scanlines slime-font min-h-screen text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#39ff14]/20 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#39ff14] font-extrabold text-black">
              S
            </span>
            <span className="hidden text-lg font-extrabold tracking-wide sm:inline">
              SLIME <span className="slime-neon">CODE</span>
            </span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm font-medium text-white/70 transition-colors hover:text-[#39ff14]"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao site
          </Link>
        </div>
      </header>

      {/* Title */}
      <section className="mx-auto max-w-7xl px-4 pt-10 md:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-extrabold md:text-4xl">
              LOJA <span className="slime-neon">SLIME CODE</span>
            </h1>
            <p className="mt-2 text-white/60">
              Produtos gamer e tech com a identidade Slime Code.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setAdminMode((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-[#39ff14] px-4 py-2.5 text-sm font-bold text-[#39ff14] transition-all hover:bg-[#39ff14]/10"
            >
              {adminMode ? (
                <>
                  <StoreIcon className="h-4 w-4" /> Ver Vitrine
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Admin Store
                </>
              )}
            </button>
          )}
        </div>
      </section>

      {adminMode && isAdmin ? (
        <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
          <AdminStorePanel />
        </section>
      ) : (
        <>
          {/* Secondary header: search + pills */}
          <section className="mx-auto max-w-7xl px-4 pt-8 md:px-8">
            <div className="relative mb-6 max-w-md">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar produtos..."
                className="slime-input w-full rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/40"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {PILLS.map((pill) => {
                const active = activeCat === pill;
                return (
                  <button
                    key={pill}
                    onClick={() => setActiveCat(pill)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                      active
                        ? "border-[#39ff14] bg-[#39ff14] text-black shadow-[0_0_18px_rgba(57,255,20,0.4)]"
                        : "border-[#39ff14]/30 text-white/70 hover:border-[#39ff14] hover:text-[#39ff14]"
                    }`}
                  >
                    {pill}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Product grid */}
          <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
            {filtered.length === 0 ? (
              <p className="py-20 text-center text-white/50">
                Nenhum produto encontrado.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} onView={setSelected} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <ProductDetailsModal product={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
