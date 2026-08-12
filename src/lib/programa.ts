export type Pergunta = {
  id: string;
  tipo: "radio" | "checkbox" | "texto";
  texto: string;
  opcoes?: string[];
};

export type Exercicio = {
  id: string;
  semana: number;
  dia: number;
  ordem: number;
  titulo: string;
  subtitulo: string | null;
  descricao_tela1: string | null;
  itens_tela2: string[];
  destaque_tela2: string | null;
  perguntas: Pergunta[];
  mensagem_final: string | null;
  perola: string | null;
  audio_url: string | null;
  tipo: string;
};

export type Registro = {
  id: string;
  usuario_id: string;
  exercicio_id: string;
  respostas: Record<string, string | string[]>;
  criado_em: string;
};

export const NOMES_DIAS = [
  "Presença no Cotidiano",
  "Respiração consciente",
  "Escuta atenta",
  "Corpo e movimento",
  "Emoções que passam",
  "Gratidão simples",
  "Silêncio e pausa",
];

export function inicioDoDia(data: Date) {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Dia N (1..7) libera N-1 dias após o início do programa. */
export function diaLiberado(dia: number, inicioPrograma: string | null | undefined) {
  if (!inicioPrograma) return dia === 1;
  const inicio = inicioDoDia(new Date(inicioPrograma));
  const liberacao = new Date(inicio);
  liberacao.setDate(liberacao.getDate() + (dia - 1));
  return inicioDoDia(new Date()) >= liberacao;
}

export function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
