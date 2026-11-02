import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { ArrowRight, Check, X } from 'lucide-react';
import { ApiException, httpClient } from '@/services/http';
import { CONTACT_CONSENT_PARAGRAPHS, CONTACT_CONSENT_TITLE, PRIVACY_POLICY_URL } from './consentText';

const EMAIL_PATTERN = /^[\p{L}\p{N}!#$%&'*+/=?^_`{|}~-]+(?:\.[\p{L}\p{N}!#$%&'*+/=?^_`{|}~-]+)*@(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\.)+[\p{L}]{2,63}$/u;

type Errors = Partial<Record<'fullName' | 'email' | 'consent', string>>;
type ContactContext = 'new-test' | 'ready-test';

export function ContactCollectionForm({ ownerId, conversationId, context = 'new-test' }: { ownerId: string; conversationId: string; context?: ContactContext }) {
  return <ContactCollectionFormFields key={`${ownerId}:${conversationId}`} conversationId={conversationId} context={context} />;
}

function ContactCollectionFormFields({ conversationId, context }: { conversationId: string; context: ContactContext }) {
  const id = useId();
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const request = useRef<AbortController | null>(null);
  const submission = useRef<{ fingerprint: string; key: string } | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [publicNumber, setPublicNumber] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [formHidden, setFormHidden] = useState(false);
  const closeConsentRef = useRef<HTMLButtonElement>(null);
  const consentDialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current?.abort(); };
  }, []);

  useEffect(() => {
    if (!consentOpen) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeConsentRef.current?.focus();
    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !consentDialogRef.current?.contains(event.target)) closeConsentRef.current?.focus();
    };
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
    document.addEventListener('focusin', containFocus);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('focusin', containFocus);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
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
    request.current = new AbortController();
    // Remove contact values from the DOM before starting the network request.
    flushSync(() => {
      setSubmitting(true);
      setSubmitError(false);
      setPublicNumber(null);
      setFullName('');
      setEmail('');
      setConsent(false);
      setConsentOpen(false);
      setFormHidden(true);
    });
    try {
      const body = { conversationId, fullName: name, email: address, consent: true };
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(body)));
      if (!mounted.current) return;
      const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      if (submission.current?.fingerprint !== fingerprint) submission.current = { fingerprint, key: crypto.randomUUID() };
      const { data: result } = await httpClient.post<{ publicNumber: string }>('/demo/contacts', body,
        { signal: request.current.signal, headers: { 'Idempotency-Key': submission.current.key } });
      if (mounted.current) { submission.current = null; setPublicNumber(result.publicNumber); }
    } catch (error) {
      if (error instanceof ApiException && error.status === 409) submission.current = null;
      if (mounted.current) setSubmitError(true);
    } finally {
      inFlight.current = false;
      if (mounted.current) setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-[760px] font-['SB_Sans_Text',system-ui,sans-serif] text-[#f2f3fc]" aria-label="Контактные данные">
      <div className="grid grid-cols-[32px_minmax(0,1fr)] items-start gap-3">
        <span className="size-8 rounded-full bg-[radial-gradient(circle_at_34%_30%,#d4dcfd_0_8%,#8594e2_22%,#434da5_52%,#0b0e2f_86%)] shadow-[inset_0_-3px_6px_#0b0e2f73,inset_0_2px_4px_#eaeefd40,0_0_14px_#5865c980]" aria-hidden="true" />
        <div>
          <h2 className="m-0 font-['SB_Sans_Text']! text-[15px] font-normal! leading-[23px]">{context === 'ready-test'
            ? 'Пришлем результат этого теста на вашу почту'
            : 'Оставьте контакты — пришлём результат позже'}</h2>
          <p className="mt-2! text-[14px] leading-5 text-[#acb3cf]">
            Укажите ФИО и email получателя результата.
          </p>
        </div>
      </div>
      {publicNumber && <p role="status" className="mt-4! rounded-xl border! border-[#5de3bd4d]! bg-[#1d302a] px-4 py-3 text-[13px] leading-[18px] text-[#5de3bd]">
        Заявка принята, № {publicNumber}.
      </p>}
      {submitError && <p role="alert" className="mt-3! text-[13px] leading-[18px] text-[#ff91a0]">Не удалось отправить данные. Попробуйте ещё раз.</p>}

      {formHidden && (submitting
        ? <p role="status" className="mt-4 ml-11 text-[13px] text-[#acb3cf]">Отправляем заявку…</p>
        : <button type="button" className="mt-4 ml-11 cursor-pointer text-[13px]! text-[#afb8ff]! underline" onClick={() => { setPublicNumber(null); setSubmitError(false); setFormHidden(false); }}>Вернуться к форме</button>)}
      {!formHidden && <form autoComplete="off" className="mt-4 ml-11 grid gap-[14px] rounded-2xl border! border-[#acb3cf33]! bg-[#1d202fb3] px-[18px] py-4 text-[#f2f3fc] max-[600px]:ml-0" onSubmit={(event) => { void submit(event); }} noValidate>
        <div className="grid gap-1.5">
          <label htmlFor={`${id}-name`} className="text-[13px] font-semibold leading-[18px]">ФИО</label>
          <input id={`${id}-name`} type="text" value={fullName} disabled={submitting} onChange={(event) => setFullName(event.target.value)}
            aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? `${id}-name-error` : undefined}
            maxLength={100} placeholder="Иван Иванов" autoComplete="off"
            className="h-11 w-full rounded-[10px] border! border-[#ffffff1a]! bg-[#1d202fb3] px-[14px] text-[15px]! text-[#f2f3fc] outline-none transition-colors placeholder:text-[#8890ad] focus:border-[#6b73e8]! focus:ring-[3px] focus:ring-[#5865c938] disabled:opacity-70 max-[600px]:text-[16px]!" />
          {errors.fullName && <p id={`${id}-name-error`} role="alert" className="text-[13px] leading-[18px] text-[#ff91a0]">{errors.fullName}</p>}
        </div>
        <div className="grid gap-1.5">
          <label htmlFor={`${id}-email`} className="text-[13px] font-semibold leading-[18px]">Email получателя</label>
          <input id={`${id}-email`} type="text" inputMode="email" value={email} disabled={submitting} onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? `${id}-email-error` : undefined}
            maxLength={254} placeholder="name@company.ru" autoComplete="off"
            className="h-11 w-full rounded-[10px] border! border-[#ffffff1a]! bg-[#1d202fb3] px-[14px] text-[15px]! text-[#f2f3fc] outline-none transition-colors placeholder:text-[#8890ad] focus:border-[#6b73e8]! focus:ring-[3px] focus:ring-[#5865c938] disabled:opacity-70 max-[600px]:text-[16px]!" />
          {errors.email && <p id={`${id}-email-error`} role="alert" className="text-[13px] leading-[18px] text-[#ff91a0]">{errors.email}</p>}
        </div>
        <div>
          <div className="group/consent grid grid-cols-[18px_minmax(0,1fr)] items-start gap-[10px] text-[13px] leading-[18px] text-[#acb3cf]">
            <span className="relative mt-px size-[18px]">
              <input id={`${id}-consent`} type="checkbox" checked={consent} disabled={submitting} onChange={(event) => setConsent(event.target.checked)} className="peer m-0 size-[18px] shrink-0 cursor-pointer appearance-none rounded-[5px] border-[1.5px]! border-[#3a425d]! bg-[#1d202f] transition-[background-color,border-color,box-shadow] duration-150 checked:border-[#5865c9]! checked:bg-[#5865c9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b73e8] disabled:cursor-default group-hover/consent:not-disabled:border-[#acb3cf]! group-hover/consent:not-disabled:shadow-[0_0_0_3px_#6b73e82e] group-hover/consent:checked:border-[#6b73e8]!" />
              <Check size={13} strokeWidth={3} className="pointer-events-none absolute top-[3px] left-[3px] text-white opacity-0 transition-opacity duration-150 peer-checked:opacity-100" aria-hidden="true" />
            </span>
            <div>
              <label htmlFor={`${id}-consent`}>Получатель согласен получать информационные и рекламные рассылки. </label>
              <button type="button" className="inline cursor-pointer font-medium text-[#afb8ff]! underline underline-offset-2" onClick={() => setConsentOpen(true)}>Текст согласия</button>
            </div>
          </div>
          {errors.consent && <p role="alert" className="mt-1 text-[13px] leading-[18px] text-[#ff91a0]">{errors.consent}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={submitting} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-[#5865c9]! px-[14px]! text-[14px]! leading-5! font-semibold! text-white! transition-colors hover:not-disabled:bg-[#4552b4]! disabled:cursor-not-allowed disabled:opacity-70">
            {submitting ? 'Отправляем…' : 'Указать email'} {!submitting && <ArrowRight size={16} aria-hidden="true" />}
          </button>
        </div>
      </form>}
      {consentOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#040516b3] p-4 backdrop-blur-[3px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { event.preventDefault(); setConsentOpen(false); } }}>
          <section ref={consentDialogRef} role="dialog" aria-modal="true" aria-labelledby={`${id}-consent-title`} className="relative max-h-[min(80vh,720px)] w-full max-w-[680px] overflow-y-auto rounded-2xl border! border-[#3a425d]! bg-[#1d202f] p-6 text-[#f2f3fc] shadow-2xl max-[600px]:p-5">
            <button ref={closeConsentRef} type="button" aria-label="Закрыть текст согласия" onClick={() => setConsentOpen(false)} className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border! border-[#3a425d]! text-[#acb3cf]! hover:bg-[#25283a]!"><X size={18} /></button>
            <h3 id={`${id}-consent-title`} className="pr-10 text-lg font-semibold">{CONTACT_CONSENT_TITLE}</h3>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-[#acb3cf]">
              {CONTACT_CONSENT_PARAGRAPHS.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer" className="break-all text-[#afb8ff] underline">{PRIVACY_POLICY_URL}</a>.
            </div>
          </section>
        </div>, document.body,
      )}
    </section>
  );
}
