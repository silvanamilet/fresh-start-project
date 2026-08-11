import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatarDataHora, type Exercicio, type Pergunta } from "@/lib/programa";

export const Route = createFileRoute("/_authenticated/terapeuta/$participanteId")({
  head: () => ({
    meta: [
      { title: "Registros da participante | Harmonizando Corpo e Mente" },
      {
        name: "description",
        content: "Veja todos os registros de uma participante, do mais recente ao mais antigo.",
      },
      { property: "og:title", content: "Registros da participante" },
      { property: "og:description", content: "Respostas detalhadas por exercício e data." },
    ],
  }),
  component: DetalheParticipante,
});

type RegistroLinha = {
  id: string;
  criado_em: string;
  respostas: Record<string, string | string[]>;
  exercicio_id: string;
};

function DetalheParticipante() {
  const { participanteId } = Route.useParams();
  const [pessoa, setPessoa] = useState<{ nome: string; email: string } | null>(null);
  const [registros, setRegistros] = useState<RegistroLinha[]>([]);
  const [exercicios, setExercicios] = useState<Record<string, Exercicio>>({});
  const [semana, setSemana] = useState<number | "todas">("todas");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    void (async () => {
      const [{ data: p }, { data: regs }, { data: exs }] = await Promise.all([
        supabase.from("usuarios").select("nome, email").eq("id", participanteId).maybeSingle(),
        supabase
          .from("registros")
          .select("id, criado_em, respostas, exercicio_id")
          .eq("usuario_id", participanteId)
          .order("criado_em", { ascending: false }),
        supabase.from("exercicios").select("*"),
      ]);

      setPessoa(p ?? null);
      setRegistros((regs ?? []) as unknown as RegistroLinha[]);
      const mapa: Record<string, Exercicio> = {};
      ((exs ?? []) as unknown as Exercicio[]).forEach((e) => (mapa[e.id] = e));
      setExercicios(mapa);
      setCarregando(false);
    })();
  }, [participanteId]);

  const semanas = Array.from(new Set(Object.values(exercicios).map((e) => e.semana))).sort();
  const filtrados = registros.filter(
    (r) => semana === "todas" || exercicios[r.exercicio_id]?.semana === semana,
  );

  const rotuloPergunta = (ex: Exercicio | undefined, chave: string) =>
    ex?.perguntas?.find((p: Pergunta) => p.id === chave)?.texto ?? chave;

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 pb-16 pt-6">
      <Link to="/terapeuta" className="mb-5 inline-flex items-center gap-1.5 text-sm text-oliva">
        <ArrowLeft size={16} /> Participantes
      </Link>

      <h1 className="font-serif text-3xl text-vinho">{pessoa?.nome ?? "Participante"}</h1>
      <p className="text-sm text-muted-foreground">{pessoa?.email}</p>

      <div className="mt-6 mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSemana("todas")}
          className={`rounded-full px-4 py-2 text-sm ${semana === "todas" ? "bg-oliva text-secondary-foreground" : "bg-white text-oliva shadow-suave"}`}
        >
          Todas as semanas
        </button>
        {semanas.map((s) => (
          <button
            key={s}
            onClick={() => setSemana(s)}
            className={`rounded-full px-4 py-2 text-sm ${semana === s ? "bg-oliva text-secondary-foreground" : "bg-white text-oliva shadow-suave"}`}
          >
            Semana {s}
          </button>
        ))}
      </div>

      {carregando ? (
        <div className="h-40 rounded-3xl bg-white/60" />
      ) : filtrados.length === 0 ? (
        <p className="rounded-2xl bg-card p-6 text-sm shadow-suave">Nenhum registro encontrado.</p>
      ) : (
        <ul className="space-y-4">
          {filtrados.map((r) => {
            const ex = exercicios[r.exercicio_id];
            return (
              <li key={r.id} className="fade-in-up rounded-2xl bg-card p-5 shadow-suave">
                <p className="font-semibold text-vinho">{ex?.titulo ?? "Exercício"}</p>
                <p className="text-xs text-muted-foreground">
                  {ex ? `Semana ${ex.semana} · Dia ${ex.dia} · ` : ""}
                  {formatarDataHora(r.criado_em)}
                </p>
                <dl className="mt-4 space-y-3">
                  {Object.entries(r.respostas).map(([chave, valor]) => (
                    <div key={chave}>
                      <dt className="text-xs font-medium text-oliva">
                        {rotuloPergunta(ex, chave)}
                      </dt>
                      <dd className="text-sm">
                        {Array.isArray(valor) ? valor.join(", ") : valor || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
