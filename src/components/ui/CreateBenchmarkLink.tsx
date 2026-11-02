import { type AnchorHTMLAttributes, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/routes.constants';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;

export function CreateBenchmarkLink({ onClick, onAuxClick, ...props }: Props) {
  const navigate = useNavigate();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    const to = `${ROUTES.CREATE}?mode=create&new=${crypto.randomUUID()}`;
    event.currentTarget.href = to;
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && (!props.target || props.target === '_self')) {
      event.preventDefault();
      navigate(to);
    }
  };

  return <a {...props} href={`${ROUTES.CREATE}?mode=create`} onClick={handleClick} onAuxClick={(event) => {
    onAuxClick?.(event);
    if (!event.defaultPrevented) event.currentTarget.href = `${ROUTES.CREATE}?mode=create&new=${crypto.randomUUID()}`;
  }} />;
}
