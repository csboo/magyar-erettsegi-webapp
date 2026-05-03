type FontSizeControlsProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
};

export function FontSizeControls({
  value,
  onChange,
  min = 0.85,
  max = 1.5,
  step = 0.05,
  defaultValue = 1,
}: FontSizeControlsProps) {
  function clamp(next: number): number {
    return Math.max(min, Math.min(max, Number(next.toFixed(2))));
  }

  return (
    <div className="font-size-controls" aria-label="Betűméret beállítás">
      <button
        type="button"
        className="archive-control-btn"
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
      >
        A-
      </button>
      <span className="font-size-label">{Math.round(value * 100)}%</span>
      <button
        type="button"
        className="archive-control-btn"
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
      >
        A+
      </button>
      <button
        type="button"
        className="archive-control-btn"
        onClick={() => onChange(defaultValue)}
        disabled={value === defaultValue}
      >
        Reset
      </button>
    </div>
  );
}
