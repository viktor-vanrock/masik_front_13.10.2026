import type { ReactNode, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/routes.constants';
import { catalogSkillUrl } from './catalogSkillUrl';

export function CatalogSkillLink({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const followSkill = (event: MouseEvent<HTMLAnchorElement>) => {
    const skill = event.currentTarget.closest('.bf-home')
      ?.querySelector<HTMLElement>('.skill[aria-checked="true"]')?.dataset.skill;
    const to = catalogSkillUrl(skill);
    event.currentTarget.href = to;
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      navigate(to);
    }
  };
  return <a className="btn btn-primary" href={ROUTES.CATALOG} data-catalog-skill="" onClick={followSkill} onAuxClick={followSkill}>{children}</a>;
}
