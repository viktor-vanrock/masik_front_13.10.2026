import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Check, X } from 'lucide-react';
import { createContactRequest } from '@/api/contactRequests';
import { CONTACT_CONSENT_PARAGRAPHS, CONTACT_CONSENT_TITLE, PRIVACY_POLICY_URL } from './consentText';

const EMAIL_PATTERN = /^[\p{L}\p{N}!#$%&'*+/=?^_`{|}~-]+(?:\.[\p{L}\p{N}!#$%&'*+/=?^_`{|}~-]+)*@(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\.)+[\p{L}]{2,63}$/u;

type Errors = Partial<Record<'fullName' | 'email' | 'consent', string>>;
type ContactContext = 'new-test' | 'ready-test';

export function ContactCollectionForm({ chatId, context = 'new-test' }: { chatId: string; context?: ContactContext }) {
  return <ContactCollectionFormFields key={chatId} chatId={chatId} context={context} />;
}

function ContactCollectionFormFields({ chatId, context }: { chatId: string; context: ContactContext }) {
  const id = useId();
  const inFlight = useRef(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [publicNumber, setPublicNumber] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const closeConsentRef = useRef<HTMLButtonElement>(null);
  const consentDialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!consentOpen) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeConsentRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setConsentOpen(false);
      if (event.key !== 'Tab') return;
      const focusable = consentDialogRef.current?.querySelectorAll<HTMLElement>('button, a[href]');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      previouslyFocused?.focus();
    };
  }, [consentOpen]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current) return;
    const name = fullName.trim();
    const address = email.trim();
    const nextErrors: Errors = {};
    if (name.length < 2 || name.length > 100) nextErrors.fullName = 'Укажите ФИО длиной от 2 до 100 символов.';
    if (address.length > 254 || !EMAIL_PATTERN.test(address)) nextErrors.email = 'Укажите корректный адрес электронной почты.';
    if (!consent) nextErrors.consent = 'Для отправки требуется согласие.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    inFlight.current = true;
    setSubmitting(true);
    setSubmitError(false);
    setPublicNumber(null);
    try {
      const result = await createContactRequest({ chatId, fullName: name, email: address, consent: true });
      setFullName('');
      setEmail('');
      setConsent(false);
      setErrors({});
      setPublicNumber(result.publicNumber);
    } catch {
      setSubmitError(true);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <section className="w-full max-w-[90%] rounded-[20px] bg-[#f3f6fa] px-7 py-6 text-[#1e1e20] dark:max-w-[760px] dark:rounded-none dark:bg-transparent dark:p-0 dark:text-[#f2f3fc] max-[600px]:max-w-full max-[600px]:px-5 max-[600px]:dark:p-0" aria-label="Контактные данные">
      <div className="dark:grid dark:grid-cols-[32px_minmax(0,1fr)] dark:items-start dark:gap-3">
        <span className="hidden dark:block dark:size-8 dark:rounded-full dark:bg-[radial-gradient(circle_at_34%_30%,#d4dcfd_0_8%,#8594e2_22%,#434da5_52%,#0b0e2f_86%)] dark:shadow-[inset_0_-3px_6px_#0b0e2f73,inset_0_2px_4px_#eaeefd40,0_0_14px_#5865c980]" aria-hidden="true" />
        <div>
          <h2 className="text-[15px] font-medium leading-[23px] dark:text-[#f2f3fc]">Отправить готовый бенчмарк заказчику на почту? Это необязательный шаг.</h2>
          <p className="mt-2 text-[14px] leading-5 text-[#686e78] dark:text-[#acb3cf]">
            Укажите email человека, для которого собираем бенчмарк, —{' '}
            {context === 'ready-test'
              ? 'Пришлем результат этого теста на вашу почту.'
              : 'Когда бенчмарк создастся, пришлем результат на вашу почту.'}
          </p>
        </div>
      </div>
      {publicNumber && <p role="status" className="mt-4 rounded-[12px] border border-[#cbe8dd] bg-[#e5f4ee] px-4 py-3 text-[13px] leading-[18px] text-[#0c7055] dark:border-[#5de3bd4d] dark:bg-[#1d302a] dark:text-[#5de3bd]">
        Заявка принята, № {publicNumber}.
      </p>}
      {submitError && <p role="alert" className="mt-3 text-[13px] leading-[18px] text-[#ac3636] dark:text-[#ff91a0]">Не удалось отправить данные. Попробуйте ещё раз.</p>}

      {skipped ? <button type="button" className="mt-4 ml-11 text-[13px] underline dark:text-[#afb8ff]" onClick={() => setSkipped(false)}>Вернуться к форме</button> : <form autoComplete="off" className="mt-4 ml-11 grid gap-[14px] rounded-[16px] border border-[#dce1e8] bg-white px-[18px] py-4 dark:border-[#acb3cf33] dark:bg-[#1d202f] dark:text-[#f2f3fc] max-[600px]:dark:ml-0" onSubmit={(event) => { void submit(event); }} noValidate>
        <div className="grid gap-1.5">
          <label htmlFor={`${id}-name`} className="text-[13px] font-semibold leading-[18px]">ФИО</label>
          <input id={`${id}-name`} type="text" value={fullName} disabled={submitting} onChange={(event) => setFullName(event.target.value)}
            aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? `${id}-name-error` : undefined}
            maxLength={100} placeholder="Иван Иванов" autoComplete="off"
            className="h-11 w-full rounded-[10px] border border-[#d1d7de] bg-white px-[14px] text-[15px] outline-none transition-colors focus:border-[#515dad] focus:ring-[3px] focus:ring-[#515dad22] disabled:opacity-70 dark:border-[#ffffff1a] dark:bg-[#1d202fb3] dark:text-[#f2f3fc] dark:placeholder:text-[#8890ad] dark:focus:border-[#6b73e8] dark:focus:ring-[#5865c938] max-[600px]:text-[16px]" />
          {errors.fullName && <p id={`${id}-name-error`} role="alert" className="text-[13px] leading-[18px] text-[#ac3636] dark:text-[#ff91a0]">{errors.fullName}</p>}
        </div>
        <div className="grid gap-1.5">
          <label htmlFor={`${id}-email`} className="text-[13px] font-semibold leading-[18px]">Email получателя</label>
          <input id={`${id}-email`} type="text" inputMode="email" value={email} disabled={submitting} onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? `${id}-email-error` : undefined}
            maxLength={254} placeholder="name@company.ru" autoComplete="off"
            className="h-11 w-full rounded-[10px] border border-[#d1d7de] bg-white px-[14px] text-[15px] outline-none transition-colors focus:border-[#515dad] focus:ring-[3px] focus:ring-[#515dad22] disabled:opacity-70 dark:border-[#ffffff1a] dark:bg-[#1d202fb3] dark:text-[#f2f3fc] dark:placeholder:text-[#8890ad] dark:focus:border-[#6b73e8] dark:focus:ring-[#5865c938] max-[600px]:text-[16px]" />
          {errors.email && <p id={`${id}-email-error`} role="alert" className="text-[13px] leading-[18px] text-[#ac3636] dark:text-[#ff91a0]">{errors.email}</p>}
        </div>
        <div>
          <div className="group/consent grid grid-cols-[18px_minmax(0,1fr)] items-start gap-[10px] text-[13px] leading-[18px] text-[#686e78] dark:text-[#acb3cf]">
            <span className="relative mt-px size-[18px]">
              <input id={`${id}-consent`} type="checkbox" checked={consent} disabled={submitting} onChange={(event) => setConsent(event.target.checked)} className="peer m-0 size-[18px] shrink-0 cursor-pointer rounded-[5px] accent-[#515dad] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b73e8] disabled:cursor-default dark:appearance-none dark:border-[1.5px] dark:border-[#3a425d] dark:bg-[#1d202f] dark:transition-[background-color,border-color,box-shadow] dark:duration-150 dark:checked:border-[#5865c9] dark:checked:bg-[#5865c9] dark:group-hover/consent:not-disabled:border-[#acb3cf] dark:group-hover/consent:not-disabled:shadow-[0_0_0_3px_#6b73e82e] dark:group-hover/consent:checked:border-[#6b73e8]" />
              <Check size={13} strokeWidth={3} className="pointer-events-none absolute top-[3px] left-[3px] hidden text-white opacity-0 transition-opacity duration-150 dark:block peer-checked:opacity-100" aria-hidden="true" />
            </span>
            <div>
              <label htmlFor={`${id}-consent`}>Получатель согласен получать информационные и рекламные рассылки. </label>
              <button type="button" className="inline cursor-pointer font-medium text-[#515dad] underline underline-offset-2 dark:text-[#afb8ff]" onClick={() => setConsentOpen(true)}>Текст согласия</button>
            </div>
          </div>
          {errors.consent && <p role="alert" className="mt-1 text-[13px] leading-[18px] text-[#ac3636] dark:text-[#ff91a0]">{errors.consent}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={submitting} className="inline-flex h-9 items-center gap-2 rounded-full bg-[#515dad] px-[14px] text-[14px] font-medium text-white transition-colors hover:bg-[#465195] disabled:cursor-wait disabled:opacity-70 dark:bg-[#5865c9] dark:hover:not-disabled:bg-[#4552b4]">
            {submitting ? 'Отправляем…' : 'Указать email'} {!submitting && <ArrowRight size={16} aria-hidden="true" />}
          </button>
          <button type="button" disabled={submitting} onClick={() => { setFullName(''); setEmail(''); setConsent(false); setErrors({}); setSubmitError(false); setSkipped(true); }} className="h-9 rounded-full px-[14px] text-[14px] font-medium disabled:opacity-50 dark:border dark:border-[#ffffff1a] dark:bg-[#ffffff14] dark:text-[#f2f3fc] dark:hover:not-disabled:bg-[#ffffff1f]">Пропустить</button>
        </div>
      </form>}
      {consentOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#040516b3] p-4 backdrop-blur-[3px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConsentOpen(false); }}>
          <section ref={consentDialogRef} role="dialog" aria-modal="true" aria-labelledby={`${id}-consent-title`} className="relative max-h-[min(80vh,720px)] w-full max-w-[680px] overflow-y-auto rounded-2xl border border-[#3a425d] bg-[#1d202f] p-6 text-[#f2f3fc] shadow-2xl max-[600px]:p-5">
            <button ref={closeConsentRef} type="button" aria-label="Закрыть текст согласия" onClick={() => setConsentOpen(false)} className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-[#3a425d] text-[#acb3cf] hover:bg-[#25283a]"><X size={18} /></button>
            <h3 id={`${id}-consent-title`} className="pr-10 text-lg font-semibold">{CONTACT_CONSENT_TITLE}</h3>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-[#acb3cf]">
              {CONTACT_CONSENT_PARAGRAPHS.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer" className="break-all text-[#afb8ff] underline">{PRIVACY_POLICY_URL}</a>
            </div>
          </section>
        </div>, document.body,
      )}
    </section>
  );
}
