import { createFileRoute } from "@tanstack/react-router";

<<<<<<< HEAD
// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
=======
>>>>>>> 793a301c084990342cd27e8ac0e544ca409cd308
export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
<<<<<<< HEAD
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        SlimeCodeLanHouse
      </h1>
=======
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          Projeto em branco
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Comece a construir sua aplicação aqui.
        </p>
      </div>
>>>>>>> 793a301c084990342cd27e8ac0e544ca409cd308
    </div>
  );
}
