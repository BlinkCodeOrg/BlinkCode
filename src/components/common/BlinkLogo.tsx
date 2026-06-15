import logo from '../../assets/BlinkCode-logo.svg';

export default function BlinkLogo({ className }: { className?: string }) {
  return <img src={logo} className={className} alt="BlinkCode" draggable={false} />;
}
