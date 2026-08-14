import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AudioPlayer } from "@/components/AudioPlayer";
import { TituloExercicio, FraseComDestaque } from "@/components/TextoExercicio";
import type { Exercicio } from "@/lib/programa";
import capaAsset from "@/assets/capa-escovando.png.asset.json";

const capaExercicio = capaAsset.url;

export const Route = createFileRoute("/_authenticated/exercicio/$id")({
  head: () => ({
    meta: [
      { title: "Exercício de presença | Harmonizando Corpo e Mente" },
      {
        name: "description",
        content: "Viva um exercício guiado de presença e registre sua experiência.",
      },
      { property: "og:title", content: "Exercício de presença | Harmonizando Corpo e Mente" },
      { property: "og:description", content: "Exercício guiado de presença passo a passo." },
    ],
  }),
  component: ExercicioPage,
});

type Respostas = Record<string, string | string[]>;

function ExercicioPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [ex, setEx] = useState<Exercicio | null>(null);
  const [tela, setTela] = useState(1);
  const [respostas, setRespostas] = useState<Respostas>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [nome, setNome] = useState("");

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("exercicios").select("*").eq("id", id).maybeSingle();
      setEx(data as unknown as Exercicio | null);
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const { data: perfil } = await supabase
          .from("usuarios")
          .select("nome")
          .eq("id", auth.user.id)
          .maybeSingle();
        setNome(perfil?.nome ?? "");
      }
    })();
  }, [id]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tela]);

  if (!ex) return <div className="min-h-screen bg-marfim" />;

  const salvar = async () => {
    setErro(null);
    setSalvando(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada.");
      const { error } = await supabase.from("registros").insert({
        usuario_id: auth.user.id,
        exercicio_id: ex.id,
        respostas,
      });
      if (error) throw error;
      setTela(4);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg px-5 pb-16 pt-6">
      <button
        onClick={() => (tela > 1 && tela < 4 ? setTela(tela - 1) : navigate({ to: "/inicio" }))}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-oliva"
      >
        <ArrowLeft size={16} /> Voltar
      </button>

      {tela === 1 && (
        <section key="t1" className="fade-in-up">
          <img
            src={capaExercicio}
            alt="Ambiente sereno em tons de marfim e verde, convidando à presença"
            className="mb-6 h-52 w-full rounded-3xl object-cover shadow-suave"
            loading="lazy"
          />
          <h1 className="font-serif text-2xl leading-snug text-vinho font-semibold">
            {ex.titulo}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            <FraseComDestaque texto={ex.subtitulo ?? ""} peso={650} />
          </p>
          {ex.descricao_tela1 && (
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              <FraseComDestaque texto={ex.descricao_tela1} peso={700} pesoInicio={650} novaLinha={true} />
            </p>
          )}
          {ex.audio_url && (
            <div className="mt-6 rounded-2xl bg-card p-4 shadow-suave text-sm leading-relaxed text-muted-foreground">
              Antes de iniciar a prática, leia as orientações e depois ouça o áudio.
            </div>
          )}
          <button
            onClick={() => setTela(2)}
            className="mt-8 w-full rounded-full bg-vinho px-6 py-3.5 font-semibold text-primary-foreground transition active:scale-[0.98]"
          >
            Começar
          </button>
        </section>
      )}

      {tela === 2 && (
        <section key="t2" className="fade-in-up">
          <h1 className="font-serif text-3xl leading-snug text-vinho">Durante a prática, observe:</h1>
          <ul className="mt-6 space-y-3">
            {ex.itens_tela2.map((item, i) => (
              <li key={i} className="flex gap-3 rounded-2xl bg-card py-2.5 px-4 shadow-suave">
                <Circle size={16} className="mt-0.5 shrink-0 text-dourado" />
                <span className="text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
          {ex.destaque_tela2 && (() => {
            const partes = ex.destaque_tela2.split(/\?\s+/);
            return (
              <div className="mt-6 rounded-2xl border border-dourado bg-marfim2 p-5">
                {partes.length > 1 ? (
                  <>
                    <p className="font-serif text-xl font-semibold leading-snug text-vinho">
                      {partes[0].trim()}?
                    </p>
                    <p className="mt-2 font-serif text-xl font-semibold leading-snug text-oliva">
                      {partes[1]}
                    </p>
                  </>
                ) : (
                  <p className="font-serif text-lg font-semibold leading-snug text-oliva">
                    {ex.destaque_tela2}
                  </p>
                )}
              </div>
            );
          })()}
          {ex.audio_url && (
            <div className="mt-6">
              <AudioPlayer src={ex.audio_url} />
            </div>
          )}
          <button
            onClick={() => setTela(3)}
            className="mt-8 w-full rounded-full bg-vinho px-6 py-3.5 font-semibold text-primary-foreground transition active:scale-[0.98]"
          >
            Registrar minha experiência
          </button>
        </section>
      )}

      {tela === 3 && (
        <section key="t3" className="fade-in-up">
          <h1 className="font-serif text-3xl leading-snug text-vinho">Meu registro</h1>
          <form
            className="mt-6 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              void salvar();
            }}
          >
            {ex.perguntas.filter((p) => !p.texto.toLowerCase().startsWith("sua mente se")).map((p) => (
              <div key={p.id} className="rounded-2xl bg-card p-5 shadow-suave">
                <p className="mb-4 text-sm font-semibold leading-snug">{p.texto}</p>

                {p.tipo === "radio" &&
                  p.opcoes?.map((op) => (
                    <label key={op} className="mb-2 flex items-center gap-3 text-sm">
                      <input
                        type="radio"
                        name={p.id}
                        value={op}
                        checked={respostas[p.id] === op}
                        onChange={() => setRespostas((r) => ({ ...r, [p.id]: op }))}
                        className="h-4 w-4 accent-[var(--vinho)]"
                      />
                      {op}
                    </label>
                  ))}

                {p.tipo === "checkbox" &&
                  p.opcoes?.map((op) => {
                    const atual = (respostas[p.id] as string[]) ?? [];
                    return (
                      <label key={op} className="mb-2 flex items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={atual.includes(op)}
                          onChange={() =>
                            setRespostas((r) => ({
                              ...r,
                              [p.id]: atual.includes(op)
                                ? atual.filter((v) => v !== op)
                                : [...atual, op],
                            }))
                          }
                          className="h-4 w-4 accent-[var(--vinho)]"
                        />
                        {op}
                      </label>
                    );
                  })}

                {p.tipo === "texto" && (
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={(respostas[p.id] as string) ?? ""}
                    onChange={(e) => setRespostas((r) => ({ ...r, [p.id]: e.target.value }))}
                    className="w-full rounded-xl border border-input bg-white px-4 py-3 text-sm outline-none focus:border-dourado"
                  />
                )}
              </div>
            ))}

            {erro && <p className="text-sm text-destructive">{erro}</p>}

            <button
              type="submit"
              disabled={salvando}
              className="w-full rounded-full bg-vinho px-6 py-3.5 font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
            >
              {"Enviar registro"}
            </button>
          </form>
        </section>
      )}

      {tela === 4 && (
        <section key="t4" className="fade-in-up pt-6 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-verde text-white">
            <Check size={28} />
          </div>
          <h1 className="font-serif text-3xl leading-snug text-vinho">
            {nome ? `Obrigada, ${nome}.` : "Registro concluído."}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{ex.mensagem_final}</p>
          {ex.perola && (
            <div className="mt-8 rounded-3xl border border-dourado bg-marfim2 p-6">
              <p className="text-xs font-semibold tracking-widest text-oliva uppercase">
                Pérola da Semana
              </p>
              <p className="mt-3 font-serif text-3xl leading-snug text-vinho italic text-center">{ex.perola}</p>
            </div>
          )}
          <button
            onClick={() => navigate({ to: "/inicio" })}
            className="mt-8 w-full rounded-full bg-oliva px-6 py-3.5 font-semibold text-secondary-foreground transition active:scale-[0.98]"
          >
            Voltar
          </button>
        </section>
      )}
    </main>
  );
}
