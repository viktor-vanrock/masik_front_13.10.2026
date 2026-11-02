import { useLayoutEffect, useRef } from 'react';
import { LandingContent } from './LandingContent';
import { initializeLanding } from './landingAnimations';

export function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = containerRef.current?.querySelector<HTMLElement>('.bf-home');
    if (!root) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const title = document.title;
    document.title = 'BenchFactory — мультиагентная система бенчмаркинга';
    document.documentElement.classList.add('bf-landing');
    document.body.classList.add('bf-landing');
    const dispose = initializeLanding(root);
    return () => {
      dispose();
      document.documentElement.classList.remove('bf-landing');
      document.body.classList.remove('bf-landing');
      document.title = title;
    };
  }, []);

  return <div ref={containerRef}><LandingContent /></div>;
}
