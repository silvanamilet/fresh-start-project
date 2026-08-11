CREATE TYPE public.app_role AS ENUM ('participante', 'terapeuta');

CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.usuarios TO authenticated;
GRANT ALL ON public.usuarios TO service_role;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.papeis_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'participante',
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.papeis_usuario TO authenticated;
GRANT ALL ON public.papeis_usuario TO service_role;
ALTER TABLE public.papeis_usuario ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.papeis_usuario WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.exercicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semana INT NOT NULL,
  dia INT NOT NULL,
  ordem INT NOT NULL DEFAULT 1,
  titulo TEXT NOT NULL,
  subtitulo TEXT,
  descricao_tela1 TEXT,
  itens_tela2 JSONB NOT NULL DEFAULT '[]'::jsonb,
  destaque_tela2 TEXT,
  perguntas JSONB NOT NULL DEFAULT '[]'::jsonb,
  mensagem_final TEXT,
  perola TEXT,
  audio_url TEXT,
  tipo TEXT NOT NULL DEFAULT 'exercicio',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (semana, dia, ordem)
);
GRANT SELECT ON public.exercicios TO authenticated;
GRANT ALL ON public.exercicios TO service_role;
ALTER TABLE public.exercicios ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercicio_id UUID NOT NULL REFERENCES public.exercicios(id) ON DELETE CASCADE,
  respostas JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registros TO authenticated;
GRANT ALL ON public.registros TO service_role;
ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_select_self" ON public.usuarios FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'terapeuta'));
CREATE POLICY "usuarios_insert_self" ON public.usuarios FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "usuarios_update_self" ON public.usuarios FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "papeis_select_self" ON public.papeis_usuario FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'terapeuta'));

CREATE POLICY "exercicios_select_all" ON public.exercicios FOR SELECT TO authenticated USING (true);

CREATE POLICY "registros_select" ON public.registros FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR public.has_role(auth.uid(), 'terapeuta'));
CREATE POLICY "registros_insert_self" ON public.registros FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "registros_update_self" ON public.registros FOR UPDATE TO authenticated
  USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)), COALESCE(NEW.email, ''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.papeis_usuario (user_id, role)
  VALUES (NEW.id, 'participante')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.exercicios (semana, dia, ordem, titulo, subtitulo, descricao_tela1, itens_tela2, destaque_tela2, perguntas, mensagem_final, perola, audio_url, tipo)
VALUES (
  1, 1, 1,
  'Escovando os Dentes com Presença',
  'Hoje, você vai fazer uma atividade habitual de um jeito diferente: prestando atenção.',
  'Um convite simples: transformar um gesto automático do seu dia em um momento de presença plena.',
  '["Como você pega a escova e coloca a pasta","Por onde começa e quais movimentos faz","O contato da escova com os dentes e a gengiva","Os pensamentos que aparecem","As emoções e sensações no corpo"]'::jsonb,
  'Sua mente se distraiu? Apenas perceba e volte para a escovação.',
  '[
    {"id":"p1","tipo":"radio","texto":"Como foi escovar os dentes procurando estar presente?","opcoes":["Foi fácil permanecer presente","Consegui em alguns momentos","Mente se distraiu muitas vezes","Não consegui perceber"]},
    {"id":"p2","tipo":"radio","texto":"Sua mente se afastou?","opcoes":["Sim","Não","Não percebi"]},
    {"id":"p3","tipo":"checkbox","texto":"O que você percebeu?","opcoes":["Pensamentos","Preocupações","Emoções","Sensações no corpo","Nada em especial"]},
    {"id":"p4","tipo":"texto","texto":"Observou algo que nunca havia percebido antes?"},
    {"id":"p5","tipo":"texto","texto":"Complete: Ao escovar com presença, percebi que..."}
  ]'::jsonb,
  'Cada vez que você percebe que se distraiu e retorna, está saindo do piloto automático e exercitando a presença.',
  'Perceber é o primeiro gesto de liberdade.',
  'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3',
  'exercicio'
);