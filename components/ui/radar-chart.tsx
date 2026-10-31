import { cn, percent } from "@/lib/utils";

/**
 * RadarChart - Visualização simples de comparação de probabilidades.
 * Ocupa pouco espaço e comunica a força relativa de cada resultado.
 */
export function RadarChart({
  home,
  draw,
  away,
  className,
}: {
  home: number;
  draw: number;
  away: number;
  className?: string;
}) {
  const max = Math.max(home, draw, away, 0.1); // Evita gráfico zerado
  const radius = 50;

  // Função simplificada para calcular pontos no radar
  const getPoint = (value: number, angle: number) => {
    const r = (value / max) * radius;
    return `${radius + r * Math.cos(angle)},${radius + r * Math.sin(angle)}`;
  };

  const angles = {
    home: -Math.PI / 2, // Topo
    draw: (-Math.PI / 2) + (2 * Math.PI / 3),
    away: (-Math.PI / 2) + (4 * Math.PI / 3),
  };

  const points = [
    getPoint(home, angles.home),
    getPoint(draw, angles.draw),
    getPoint(away, angles.away),
  ].join(" ");

  return (
    <svg viewBox="0 0 100 100" className={cn("w-12 h-12", className)}>
      {/* Background */}
      <circle cx="50" cy="50" r={radius} className="fill-muted/30" />
      {/* Data Path */}
      <polygon
        points={points}
        className="fill-primary/20 stroke-primary stroke-2"
      />
    </svg>
  );
}
