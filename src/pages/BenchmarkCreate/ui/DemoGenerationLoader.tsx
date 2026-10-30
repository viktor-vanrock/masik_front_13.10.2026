import { useEffect, useState } from "react";

export function DemoGenerationLoader({ startedAt, producing = false }: { startedAt: number; producing?: boolean }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const update = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    update();
    const interval = window.setInterval(update, 200);
    return () => window.clearInterval(interval);
  }, [startedAt]);

  const stage = producing ? 'Собираем набор из выбранных примеров'
    : elapsed < 1 ? 'Разбираем требования'
      : elapsed < 2 ? 'Составляем задания' : 'Подготавливаем варианты для проверки';

  return <section className="benchmark-chat-card w-full max-w-[88%] rounded-[20px] bg-[#f3f6fa] px-[22px] py-[18px] text-[#1e1e20] max-[600px]:max-w-full" role="status" aria-live="polite">
    <div className="py-2">
      <h2 className="mb-[14px] text-[23px] font-medium leading-[1.4] max-[600px]:text-[20px]">{producing ? 'Масштабируем выбранные примеры' : 'Генерируем промежуточные варианты'}</h2>
      <p className="text-[13px] leading-[1.6] text-[#686e78]">Можно перейти в личный кабинет. Статус и результат сохранятся в этом чате.</p>
      <div className="my-[24px] mb-[14px] h-[6px] overflow-hidden rounded-[8px] bg-[#e9edf2]" role="progressbar" aria-label="Обработка заявки">
        <span className="benchmark-demo-progress block h-full w-[30%] rounded-[8px] bg-[#515dad]" />
      </div>
      <div className="flex justify-between gap-5 text-[10px] tabular-nums text-[#686e78] max-[600px]:text-[12px]"><span>{stage}</span><span>Прошло <b className="font-normal">{elapsed} с</b></span></div>
      <small className="mt-5 block text-[11px] text-[#3a427b] max-[600px]:text-[12px]">Следующий этап: {producing ? 'готовый набор в общем каталоге' : 'ваш выбор примеров'}</small>
    </div>
  </section>;
}
