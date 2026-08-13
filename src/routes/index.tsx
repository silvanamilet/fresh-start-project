import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar | Harmonizando Corpo e Mente" },
      {
        name: "description",
        content:
          "Acesse a plataforma Harmonizando Corpo e Mente para praticar presença e registrar suas experiências.",
      },
      { property: "og:title", content: "Entrar | Harmonizando Corpo e Mente" },
      {
        property: "og:description",
        content: "Acesse a plataforma Harmonizando Corpo e Mente para praticar presença e registrar suas experiências.",
      },
    ],
  }),
  component: Login,
});

async function rotaPorPapel(userId: string) {
  const { data } = await supabase
    .from("papeis_usuario")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "terapeuta")
    .maybeSingle();
  return data ? "/terapeuta" : "/inicio";
}

function Login() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    let ativo = true;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!ativo) return;
      if (data.session) {
        const destino = await rotaPorPapel(data.session.user.id);
        void navigate({ to: destino, replace: true });
        return;
      }
      setVerificando(false);
    })();
    return () => {
      ativo = false;
    };
  }, [navigate]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    setCarregando(true);
    try {
      if (modo === "criar") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nome: nome.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setAviso("Cadastro criado! Confirme seu e-mail para acessar.");
          return;
        }
        void navigate({ to: "/inicio", replace: true });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });
        if (error) throw error;
        const destino = await rotaPorPapel(data.user.id);
        void navigate({ to: destino, replace: true });
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível continuar.");
    } finally {
      setCarregando(false);
    }
  };

  if (verificando) {
    return <div className="min-h-screen bg-marfim" />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-marfim px-5 pt-6 pb-10">
      <div className="fade-in-up w-full max-w-sm">
        <div className="mb-8 text-center">
          <img
            src="/logo-silvana.png"
            alt="Silvana Milet"
            className="mx-auto mb-4 w-[246px] object-contain"
          />
          <p className="font-serif text-[24px] tracking-wide font-semibold" style={{ color: "#5A5230" }}>
            Projeto
          </p>
          <h1 className="font-serif text-[28px] leading-tight text-vinho font-semibold">
            Harmonizando Corpo e Mente
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Um espaço de presença, cuidado e escuta.
          </p>
        </div>

        <form
          onSubmit={enviar}
          className="rounded-3xl bg-card p-6 shadow-suave"
          aria-label="Formulário de acesso"
        >
          {modo === "criar" && (
            <label className="mb-4 block text-sm font-medium">
              Nome
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                maxLength={80}
                className="mt-1.5 w-full rounded-xl border border-input bg-white px-4 py-3 text-base outline-none focus:border-dourado"
              />
            </label>
          )}

          <label className="mb-4 block text-sm font-medium">
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              autoComplete="email"
              className="mt-1.5 w-full rounded-xl border border-input bg-white px-4 py-3 text-base outline-none focus:border-dourado"
            />
          </label>

          <label className="mb-5 block text-sm font-medium">
            Senha
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
              autoComplete={modo === "criar" ? "new-password" : "current-password"}
              className="mt-1.5 w-full rounded-xl border border-input bg-white px-4 py-3 text-base outline-none focus:border-dourado"
            />
          </label>

          {erro && <p className="mb-4 text-sm text-destructive">{erro}</p>}
          {aviso && <p className="mb-4 text-sm text-verde">{aviso}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-full bg-vinho px-6 py-3.5 text-base font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
          >
            {carregando ? "Aguarde..." : modo === "entrar" ? "Entrar" : "Criar conta"}
          </button>

          <button
            type="button"
            onClick={() => {
              setModo(modo === "entrar" ? "criar" : "entrar");
              setErro(null);
              setAviso(null);
            }}
            className="mt-4 w-full text-center text-sm text-oliva underline underline-offset-4"
          >
            {modo === "entrar" ? "Ainda não tenho conta" : "Já tenho conta"}
          </button>
        </form>
      </div>
    </main>
  );
}
