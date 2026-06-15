import type { ButtonHTMLAttributes } from 'react';
import './ui.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
};

export function Button({ className = '', type = 'button', variant = 'default', ...props }: ButtonProps) {
  return <button type={type} className={`ui-button ui-button-${variant} ${className}`.trim()} {...props} />;
}
