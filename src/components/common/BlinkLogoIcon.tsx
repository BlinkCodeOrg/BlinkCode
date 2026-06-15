import logo from '../../assets/BlinkCode-logo.svg';

export default function BlinkLogoIcon({ className }: { className?: string }) {
  return <img src={logo} className={className} alt="" aria-hidden="true" draggable={false} />;
}
