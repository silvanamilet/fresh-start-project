import type { CSSProperties } from "react";

/**
 * Título do exercício com quebra forçada:
 * linha 1 "Escovando os Dentes" / linha 2 "com Presença" deslocada à direita.
 */
export function TituloExercicio({ titulo, className }: { titulo: string; className?: string }) {
  const idx = titulo.lastIndexOf(" com ");
  if (idx === -1) return <span className={`font-semibold ${className ?? ""}`}>{titulo}</span>;
  const linha1 = titulo.slice(0, idx);
  const linha2 = titulo.slice(idx + 1);
  return (
    <span className={`font-semibold ${className ?? ""}`}>
      {linha1}
      <br />
      <span className="pl-[1.5ch] sm:pl-[3ch]">{linha2}</span>
    </span>
  );
}

/** Realça (só na espessura) o trecho após os dois-pontos finais da frase. */
export function FraseComDestaque({
  texto,
  peso = 550,
  className,
}: {
  texto: string;
  peso?: number;
  className?: string;
}) {
  const idx = texto.lastIndexOf(": ");
  if (idx === -1) return <span className={className}>{texto}</span>;
  const inicio = texto.slice(0, idx + 2);
  const destaque = texto.slice(idx + 2);
  const style: CSSProperties = { fontWeight: peso };
  return (
    <span className={className}>
      {inicio}
      <span style={style}>{destaque}</span>
    </span>
  );
}
