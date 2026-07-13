import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          Projeto em branco
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Comece a construir sua aplicação aqui.
        </p>
      </div>
    </div>
  );
}
