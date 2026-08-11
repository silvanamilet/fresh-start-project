import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatarDataHora } from "@/lib/programa";

export const Route = createFileRoute("/_authenticated/terapeuta/")({
  head: () => ({
    meta: [
      { title: "Painel da terapeuta | Harmonizando Corpo e Mente" },
      {
        name: "description",
        content: "Acompanhe os registros das participantes do programa Harmonizando Corpo e Mente.",
      },
      { property: "og:title", content: "Painel da terapeuta | Harmonizando Corpo e Mente" },
      { property: "og:description", content: "Acompanhamento dos registros das participantes." },
    ],
  }),
  component: PainelTerapeuta,
});

type Linha = { id: string; nome: string; email: string; ultimo: string | null };

function PainelTerapeuta() {
  const navigate = useNavigate();
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [autorizada, setAutorizada] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: papel } = await supabase
        .from("papeis_usuario")
        .select("role")
        .eq("user_id", auth.user.id)
        .eq("role", "terapeuta")
        .maybeSingle();
      if (!papel) {
        setAutorizada(false);
        setCarregando(false);
        return;
      }

      const [{ data: pessoas }, { data: regs }] = await Promise.all([
        supabase.from("usuarios").select("id, nome, email").order("nome"),
        supabase.from("registros").select("usuario_id, criado_em").order("criado_em", {
          ascending: false,
        }),
      ]);

      const ultimoPor = new Map<string, string>();
      (regs ?? []).forEach((r) => {
        if (!ultimoPor.has(r.usuario_id)) ultimoPor.set(r.usuario_id, r.criado_em);
      });

      setLinhas(
        (pessoas ?? []).map((p) => ({
          id: p.id,
          nome: p.nome,
          email: p.email,
          ultimo: ultimoPor.get(p.id) ?? null,
        })),
      );
      setCarregando(false);
    })();
  }, []);

  const sair = async () => {
    await supabase.auth.signOut();
    void navigate({ to: "/", replace: true });
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 pb-16 pt-10">
      <header className="fade-in-up mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-vinho">Painel da terapeuta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Participantes e seus registros</p>
        </div>
        <button
          onClick={sair}
          aria-label="Sair"
          className="rounded-full bg-white p-2.5 text-oliva shadow-suave"
        >
          <LogOut size={18} />
        </button>
      </header>

      {!autorizada ? (
        <p className="rounded-2xl bg-card p-6 text-sm shadow-suave">
          Esta área é exclusiva da terapeuta responsável.
        </p>
      ) : carregando ? (
        <div className="h-40 rounded-3xl bg-white/60" />
      ) : (
        <ul className="space-y-3">
          {linhas.map((p) => (
            <li key={p.id}>
              <Link
                to="/terapeuta/$participanteId"
                params={{ participanteId: p.id }}
                className="fade-in-up flex items-center gap-4 rounded-2xl bg-card p-5 shadow-suave"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.nome || "Sem nome"}</p>
                  <p className="truncate text-sm text-muted-foreground">{p.email}</p>
                  <p className="mt-1 text-xs text-oliva">
                    {p.ultimo ? `Último registro: ${formatarDataHora(p.ultimo)}` : "Sem registros"}
                  </p>
                </div>
                <ChevronRight size={18} className="text-dourado" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
