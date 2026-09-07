/** Accessible SVG chart primitives for the executive dashboard. */

export type ChartPoint = {
  label: string;
  value: number;
};

export type ChartSeries = {
  id: string;
  label: string;
  points: ChartPoint[];
  color?: string | undefined;
};

function maxValue(points: ChartPoint[]): number {
  return Math.max(1, ...points.map((p) => p.value));
}

function ChartTable({
  caption,
  points,
}: {
  caption: string;
  points: ChartPoint[];
}) {
  return (
    <table className="hamd-dash-chart-table">
      <caption className="hamd-sr-only">{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Period</th>
          <th scope="col">Value</th>
        </tr>
      </thead>
      <tbody>
        {points.map((p) => (
          <tr key={p.label}>
            <th scope="row">{p.label}</th>
            <td>{p.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function LineChart({
  title,
  points,
  className,
}: {
  title: string;
  points: ChartPoint[];
  className?: string | undefined;
}) {
  const w = 320;
  const h = 120;
  const pad = 12;
  const max = maxValue(points);
  const coords = points.map((p, i) => {
    const x =
      pad + (i / Math.max(1, points.length - 1)) * (w - pad * 2);
    const y = h - pad - (p.value / max) * (h - pad * 2);
    return `${x},${y}`;
  });
  const path = coords.length
    ? `M ${coords.join(" L ")}`
    : `M ${pad},${h - pad}`;

  return (
    <figure className={className} aria-label={title}>
      <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="hamd-dash-chart-line"
        />
      </svg>
      <ChartTable caption={title} points={points} />
    </figure>
  );
}

export function AreaChart({
  title,
  points,
  className,
}: {
  title: string;
  points: ChartPoint[];
  className?: string | undefined;
}) {
  const w = 320;
  const h = 120;
  const pad = 12;
  const max = maxValue(points);
  const coords = points.map((p, i) => {
    const x =
      pad + (i / Math.max(1, points.length - 1)) * (w - pad * 2);
    const y = h - pad - (p.value / max) * (h - pad * 2);
    return { x, y };
  });
  const line = coords.map((c) => `${c.x},${c.y}`).join(" L ");
  const area = coords.length
    ? `M ${pad},${h - pad} L ${line} L ${coords[coords.length - 1]!.x},${h - pad} Z`
    : "";

  return (
    <figure className={className} aria-label={title}>
      <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
        <path d={area} className="hamd-dash-chart-area" />
        <path
          d={coords.length ? `M ${line}` : ""}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="hamd-dash-chart-line"
        />
      </svg>
      <ChartTable caption={title} points={points} />
    </figure>
  );
}

export function BarChart({
  title,
  points,
  className,
}: {
  title: string;
  points: ChartPoint[];
  className?: string | undefined;
}) {
  const w = 320;
  const h = 120;
  const pad = 12;
  const max = maxValue(points);
  const gap = 6;
  const barW =
    (w - pad * 2 - gap * Math.max(0, points.length - 1)) /
    Math.max(1, points.length);

  return (
    <figure className={className} aria-label={title}>
      <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
        {points.map((p, i) => {
          const bh = (p.value / max) * (h - pad * 2);
          const x = pad + i * (barW + gap);
          const y = h - pad - bh;
          return (
            <rect
              key={p.label}
              x={x}
              y={y}
              width={barW}
              height={bh}
              rx={3}
              className="hamd-dash-chart-bar"
            />
          );
        })}
      </svg>
      <ChartTable caption={title} points={points} />
    </figure>
  );
}

export function DonutChart({
  title,
  points,
  className,
}: {
  title: string;
  points: ChartPoint[];
  className?: string | undefined;
}) {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const r = 42;
  const stroke = 16;
  const total = points.reduce((sum, p) => sum + p.value, 0) || 1;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <figure className={className} aria-label={title}>
      <div className="hamd-dash-donut">
        <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false">
          {points.map((p, i) => {
            const len = (p.value / total) * circumference;
            const el = (
              <circle
                key={p.label}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                strokeWidth={stroke}
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={-offset}
                className={`hamd-dash-chart-donut-seg hamd-dash-chart-donut-seg--${i % 5}`}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <ul className="hamd-dash-donut__legend">
          {points.map((p) => (
            <li key={p.label}>
              <strong>{p.label}</strong>
              <span>{p.value}</span>
            </li>
          ))}
        </ul>
      </div>
      <ChartTable caption={title} points={points} />
    </figure>
  );
}

export function HeatmapPlaceholder({
  title = "Activity heatmap",
  className,
}: {
  title?: string | undefined;
  className?: string | undefined;
}) {
  const cells = Array.from({ length: 28 }, (_, i) => (i * 17) % 5);
  return (
    <figure
      className={className}
      aria-label={`${title} - placeholder`}
      role="img"
    >
      <div className="hamd-dash-heatmap" aria-hidden="true">
        {cells.map((intensity, i) => (
          <span
            key={i}
            className="hamd-dash-heatmap__cell"
            data-intensity={intensity}
          />
        ))}
      </div>
      <p className="hamd-dash-heatmap__hint">
        Heatmap placeholder - host may bind corridor × period activity later.
      </p>
    </figure>
  );
}
