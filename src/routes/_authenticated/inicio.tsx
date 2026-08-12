import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Headphones, Sparkles, Check, Lock, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NOMES_DIAS, diaLiberado, type Exercicio } from "@/lib/programa";
import { TituloExercicio, FraseComDestaque } from "@/components/TextoExercicio";
import logo from "@/assets/logo-harmonizando.png.asset.json";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Minha semana | Harmonizando Corpo e Mente" },
      {
        name: "description",
        content: "Acompanhe os exercícios de presença da sua semana e registre suas experiências.",
      },
      { property: "og:title", content: "Minha semana | Harmonizando Corpo e Mente" },
      { property: "og:description", content: "Seus exercícios de presença da semana." },
    ],
  }),
  component: Inicio,
});

function iconeTipo(tipo: string) {
  if (tipo === "meditacao") return <Headphones size={16} />;
  if (tipo === "video") return <BookOpen size={16} />;
  return <Sparkles size={16} />;
}

function Inicio() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [inicioPrograma, setInicioPrograma] = useState<string | null>(null);
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [concluidos, setConcluidos] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;

      const [{ data: perfil }, { data: exs }, { data: regs }] = await Promise.all([
        supabase.from("usuarios").select("nome, criado_em").eq("id", uid).maybeSingle(),
        supabase.from("exercicios").select("*").eq("semana", 1).order("dia"),
        supabase.from("registros").select("exercicio_id").eq("usuario_id", uid),
      ]);

      setNome(perfil?.nome ?? "");
      setInicioPrograma(perfil?.criado_em ?? null);
      setExercicios((exs ?? []) as unknown as Exercicio[]);
      setConcluidos(new Set((regs ?? []).map((r) => r.exercicio_id)));
      setCarregando(false);
    })();
  }, []);

  const sair = async () => {
    await supabase.auth.signOut();
    void navigate({ to: "/", replace: true });
  };

  const doDia = exercicios.find(
    (e) => diaLiberado(e.dia, inicioPrograma) && !concluidos.has(e.id),
  );
  const destaque = doDia ?? exercicios[0];

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg px-5 pb-16 pt-6">
      <div className="fade-in-up mb-5 flex items-center gap-3">
        <img
          src={logo.url}
          alt="Logomarca Recuperando a Direção da Própria Vida"
          className="h-16 w-16 shrink-0 object-contain"
        />
        <p className="font-serif text-xl leading-tight text-vinho">
          Recuperando a Direção
          <br />
          da Própria Vida
        </p>
      </div>

      <header className="fade-in-up mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Olá,</p>
          <h1 className="font-serif text-3xl text-ocre">{nome || "seja bem-vinda"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Semana 1 — Presença</p>
        </div>
        <button
          onClick={sair}
          aria-label="Sair"
          className="rounded-full bg-white p-2.5 text-oliva shadow-suave"
        >
          <LogOut size={18} />
        </button>
      </header>

      {carregando ? (
        <div className="h-48 rounded-3xl bg-white/60" />
      ) : (
        destaque && (
          <section className="fade-in-up mb-9 rounded-3xl bg-card p-6 shadow-suave">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-marfim2 px-3 py-1 text-xs font-medium text-oliva">
              {iconeTipo(destaque.tipo)} do dia
            </span>
            <h2 className="mt-4 font-serif text-[28px] leading-snug text-vinho">
              <TituloExercicio titulo={destaque.titulo} />
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              <FraseComDestaque texto={destaque.subtitulo ?? ""} peso={550} />
            </p>
            <Link
              to="/exercicio/$id"
              params={{ id: destaque.id }}
              className="mt-6 inline-block rounded-full bg-vinho px-7 py-3 text-sm font-semibold text-primary-foreground transition active:scale-[0.98]"
            >
              {concluidos.has(destaque.id) ? "Revisitar" : "Começar"}
            </Link>
          </section>
        )
      )}

      <h3 className="mb-3 text-sm font-semibold tracking-wide text-oliva uppercase">
        Os 7 dias da Semana - 1
      </h3>
      <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-3">
        {NOMES_DIAS.map((nomeDia, i) => {
          const dia = i + 1;
          const ex = exercicios.find((e) => e.dia === dia);
          const liberado = diaLiberado(dia, inicioPrograma) && !!ex;
          const feito = ex ? concluidos.has(ex.id) : false;
          const conteudo = (
            <>
              <div className="flex items-center justify-between">
                <span className="font-serif text-2xl text-vinho">{dia}</span>
                {feito ? (
                  <Check size={16} className="text-verde" />
                ) : liberado ? (
                  <span className="text-oliva">{iconeTipo(ex?.tipo ?? "exercicio")}</span>
                ) : (
                  <Lock size={15} className="text-muted-foreground" />
                )}
              </div>
              <p className="mt-3 text-xs leading-snug font-semibold">{nomeDia}</p>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {feito ? "Concluído" : liberado ? "Disponível" : "Bloqueado"}
              </p>
            </>
          );
          const classe = `w-36 shrink-0 snap-start rounded-2xl p-4 text-left shadow-suave transition ${
            liberado ? "bg-card" : "bg-white/50 opacity-70"
          } ${feito ? "border border-verde/40" : ""}`;

          return liberado && ex ? (
            <Link key={dia} to="/exercicio/$id" params={{ id: ex.id }} className={classe}>
              {conteudo}
            </Link>
          ) : (
            <div key={dia} className={classe} aria-disabled="true">
              {conteudo}
            </div>
          );
        })}
      </div>
    </main>
  );
}
