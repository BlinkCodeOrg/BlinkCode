interface SettingsNumberStepperProps {
  max: number;
  min: number;
  value: number;
  onChange: (value: number) => void;
}

export function SettingsNumberStepper({
  max,
  min,
  onChange,
  value,
}: SettingsNumberStepperProps) {
  return (
    <>
      <button className="settings-num-btn" onClick={() => onChange(Math.max(min, value - 1))}>-</button>
      <span className="settings-num-val">{value}</span>
      <button className="settings-num-btn" onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </>
  );
}
