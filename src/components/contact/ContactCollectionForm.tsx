import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, X } from 'lucide-react';
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
    <section className="contact-collection w-full max-w-[90%] rounded-[20px] bg-[#f3f6fa] px-7 py-6 text-[#1e1e20] max-[600px]:max-w-full max-[600px]:px-5" aria-label="Контактные данные">
      <div className="contact-collection-heading">
        <span className="contact-collection-orb" aria-hidden="true" />
        <div>
          <h2 className="text-[15px] font-medium leading-[23px]">Отправить готовый бенчмарк заказчику на почту? Это необязательный шаг.</h2>
          <p className="mt-2 text-[14px] leading-5 text-[#686e78]">
            Укажите email человека, для которого собираем бенчмарк, —{' '}
            {context === 'ready-test'
              ? 'Пришлем результат этого теста на вашу почту.'
              : 'Когда бенчмарк создастся, пришлем результат на вашу почту.'}
          </p>
        </div>
      </div>
      {publicNumber && <p role="status" className="mt-4 rounded-[12px] border border-[#cbe8dd] bg-[#e5f4ee] px-4 py-3 text-[13px] leading-[18px] text-[#0c7055]">
        Заявка принята, № {publicNumber}.
      </p>}
      {submitError && <p role="alert" className="mt-3 text-[13px] leading-[18px] text-[#ac3636]">Не удалось отправить данные. Попробуйте ещё раз.</p>}

      {skipped ? <button type="button" className="contact-collection-link mt-4 ml-11 text-[13px] underline" onClick={() => setSkipped(false)}>Вернуться к форме</button> : <form autoComplete="off" className="contact-collection-card mt-4 ml-11 grid gap-[14px] rounded-[16px] border border-[#dce1e8] bg-white px-[18px] py-4" onSubmit={(event) => { void submit(event); }} noValidate>
        <div className="grid gap-1.5">
          <label htmlFor={`${id}-name`} className="text-[13px] font-semibold leading-[18px]">ФИО</label>
          <input id={`${id}-name`} type="text" value={fullName} disabled={submitting} onChange={(event) => setFullName(event.target.value)}
            aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? `${id}-name-error` : undefined}
            maxLength={100} placeholder="Иван Иванов" autoComplete="off"
            className="contact-collection-input h-11 w-full rounded-[10px] border border-[#d1d7de] bg-white px-[14px] text-[15px] outline-none transition-colors focus:border-[#515dad] focus:ring-[3px] focus:ring-[#515dad22] disabled:opacity-70 max-[600px]:text-[16px]" />
          {errors.fullName && <p id={`${id}-name-error`} role="alert" className="text-[13px] leading-[18px] text-[#ac3636]">{errors.fullName}</p>}
        </div>
        <div className="grid gap-1.5">
          <label htmlFor={`${id}-email`} className="text-[13px] font-semibold leading-[18px]">Email получателя</label>
          <input id={`${id}-email`} type="text" inputMode="email" value={email} disabled={submitting} onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? `${id}-email-error` : undefined}
            maxLength={254} placeholder="name@company.ru" autoComplete="off"
            className="contact-collection-input h-11 w-full rounded-[10px] border border-[#d1d7de] bg-white px-[14px] text-[15px] outline-none transition-colors focus:border-[#515dad] focus:ring-[3px] focus:ring-[#515dad22] disabled:opacity-70 max-[600px]:text-[16px]" />
          {errors.email && <p id={`${id}-email-error`} role="alert" className="text-[13px] leading-[18px] text-[#ac3636]">{errors.email}</p>}
        </div>
        <div>
          <div className="contact-collection-consent-row grid grid-cols-[18px_minmax(0,1fr)] items-start gap-[10px] text-[13px] leading-[18px] text-[#686e78]">
            <input id={`${id}-consent`} type="checkbox" checked={consent} disabled={submitting} onChange={(event) => setConsent(event.target.checked)} className="contact-collection-checkbox m-0 mt-px h-[18px] w-[18px] shrink-0 cursor-pointer rounded-[5px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b73e8] disabled:cursor-default" />
            <div>
              <label htmlFor={`${id}-consent`}>Получатель согласен получать информационные и рекламные рассылки. </label>
              <button type="button" className="contact-collection-link inline cursor-pointer font-medium text-[#515dad] underline underline-offset-2" onClick={() => setConsentOpen(true)}>Текст согласия</button>
            </div>
          </div>
          {errors.consent && <p role="alert" className="mt-1 text-[13px] leading-[18px] text-[#ac3636]">{errors.consent}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={submitting} className="contact-collection-submit inline-flex h-9 items-center gap-2 rounded-full bg-[#515dad] px-[14px] text-[14px] font-medium text-white transition-colors hover:bg-[#465195] disabled:cursor-wait disabled:opacity-70">
            {submitting ? 'Отправляем…' : 'Указать email'} {!submitting && <ArrowRight size={16} aria-hidden="true" />}
          </button>
          <button type="button" disabled={submitting} onClick={() => { setFullName(''); setEmail(''); setConsent(false); setErrors({}); setSubmitError(false); setSkipped(true); }} className="contact-collection-skip h-9 rounded-full px-[14px] text-[14px] font-medium disabled:opacity-50">Пропустить</button>
        </div>
      </form>}
      {consentOpen && createPortal(
        <div className="contact-consent-overlay fixed inset-0 z-[100] flex items-center justify-center bg-[#040516b3] p-4 backdrop-blur-[3px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConsentOpen(false); }}>
          <section ref={consentDialogRef} role="dialog" aria-modal="true" aria-labelledby={`${id}-consent-title`} className="contact-consent-dialog relative max-h-[min(80vh,720px)] w-full max-w-[680px] overflow-y-auto rounded-2xl border border-[#3a425d] bg-[#1d202f] p-6 text-[#f2f3fc] shadow-2xl max-[600px]:p-5">
            <button ref={closeConsentRef} type="button" aria-label="Закрыть текст согласия" onClick={() => setConsentOpen(false)} className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-[#3a425d] text-[#acb3cf] hover:bg-[#25283a]"><X size={18} /></button>
            <h3 id={`${id}-consent-title`} className="pr-10 text-lg font-semibold">{CONTACT_CONSENT_TITLE}</h3>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-[#acb3cf]">
              {CONTACT_CONSENT_PARAGRAPHS.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer" className="contact-collection-link break-all text-[#afb8ff] underline">{PRIVACY_POLICY_URL}</a>
            </div>
          </section>
        </div>, document.body,
      )}
    </section>
  );
}
