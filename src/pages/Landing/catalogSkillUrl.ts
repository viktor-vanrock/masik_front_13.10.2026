import { ROUTES } from '@/routes/routes.constants';

const skills: Record<string, string> = {
  logic: 'рассужд', code: 'код', data: 'данн', agents: 'агент', finance: 'финанс',
};

export function catalogSkillUrl(skill: string | undefined): string {
  if (skill === 'lang') return `${ROUTES.CATALOG}?language=ru`;
  const search = skill && skills[skill];
  return search ? `${ROUTES.CATALOG}?${new URLSearchParams({ search })}` : ROUTES.CATALOG;
}
