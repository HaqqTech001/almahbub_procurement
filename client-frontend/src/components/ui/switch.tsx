import React from 'react';

interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled = false,
  id,
  className = '',
}) => {
  const [isChecked, setIsChecked] = React.useState(defaultChecked || checked || false);

  // Sync with checked prop if provided
  React.useEffect(() => {
    if (checked !== undefined) {
      setIsChecked(checked);
    }
  }, [checked]);

  const handleClick = () => {
    if (disabled) return;
    
    const newValue = !isChecked;
    setIsChecked(newValue);
    onCheckedChange?.(newValue);
  };

  const baseStyles: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    height: '24px',
    width: '44px',
    shrink: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    alignItems: 'center',
    borderRadius: '9999px',
    border: '2px solid transparent',
    transition: 'all 0.2s',
    backgroundColor: isChecked ? '#0F4C5C' : '#e2e8f0',
    opacity: disabled ? 0.5 : 1,
  };

  const thumbStyles: React.CSSProperties = {
    pointerEvents: 'none',
    display: 'block',
    height: '20px',
    width: '20px',
    borderRadius: '9999px',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    transition: 'transform 0.2s',
    transform: isChecked ? 'translateX(20px)' : 'translateX(0)',
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      id={id}
      className={className}
      onClick={handleClick}
      disabled={disabled}
      style={{
        ...baseStyles,
        padding: 0,
        outline: 'none',
      }}
    >
      <span style={thumbStyles} />
    </button>
  );
};

export { Switch };
