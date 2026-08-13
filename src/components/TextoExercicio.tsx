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
    <span
      className={`block w-full font-semibold ${className ?? ""}`}
      style={{ fontSize: "clamp(17px, 4.5vw, 24px)" }}
    >
      <span className="block">{linha1}</span>
      <span className="block pl-[1.5ch] sm:pl-[3ch]">{linha2}</span>
    </span>
  );
}

/**
 * Realça o trecho após o ÚLTIMO ": " com a espessura indicada.
 * pesoInicio: aplica espessura ao trecho antes do PRIMEIRO ": "
 * novaLinha: coloca o trecho destacado em linha própria
 */
export function FraseComDestaque({
  texto,
  peso = 550,
  pesoInicio,
  novaLinha = false,
  className,
}: {
  texto: string;
  peso?: number;
  pesoInicio?: number;
  novaLinha?: boolean;
  className?: string;
}) {
  const idxLast = texto.lastIndexOf(": ");
  if (idxLast === -1) return <span className={className}>{texto}</span>;

  const antes = texto.slice(0, idxLast + 2);
  const destaque = texto.slice(idxLast + 2);
  const styleDestaque: CSSProperties = {
    fontWeight: peso,
    ...(novaLinha ? { display: "block" } : {}),
  };

  if (pesoInicio !== undefined) {
    const idxFirst = antes.indexOf(": ");
    if (idxFirst !== -1) {
      const prefix = antes.slice(0, idxFirst + 1);
      const middle = antes.slice(idxFirst + 1);
      return (
        <span className={className}>
          <span style={{ fontWeight: pesoInicio }}>{prefix}</span>
          {middle}
          <span style={styleDestaque}>{destaque}</span>
        </span>
      );
    }
  }

  return (
    <span className={className}>
      {antes}
      <span style={styleDestaque}>{destaque}</span>
    </span>
  );
}
