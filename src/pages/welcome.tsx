import { type ReactNode, useState } from 'react';
import { Link } from 'wouter';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Brand } from '@/components/brand';
import { LandingMark } from '@/components/landing/mark';

const ease = [0.22, 1, 0.36, 1] as const;

function LineReveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <span className="landing-reveal-line">
      <motion.span
        className="landing-reveal-line__inner"
        initial={reduce ? { y: 0 } : { y: '108%' }}
        animate={{ y: 0 }}
        transition={{ duration: reduce ? 0 : 0.95, delay: reduce ? 0 : delay, ease }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function FadeIn({
  children,
  delay = 0,
  className = '',
  y = 0,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.72, delay: reduce ? 0 : delay, ease }}
    >
      {children}
    </motion.div>
  );
}

function InView({ children, className = '', delay = 0, variant = 'rise' }: { children: ReactNode; className?: string; delay?: number; variant?: 'rise' | 'scale' | 'clip' }) {
  const reduce = useReducedMotion();
  const initial = variant === 'scale' ? { opacity: 0, scale: 0.96 } : variant === 'clip' ? { clipPath: 'inset(0 100% 0 0)' } : { opacity: 0, y: 20 };
  const visible = variant === 'clip' ? { clipPath: 'inset(0 0 0 0)' } : { opacity: 1, y: 0, scale: 1 };
  return (
    <motion.div
      className={className}
      initial={reduce ? false : initial}
      whileInView={visible}
      viewport={{ once: true, amount: 0.28 }}
      transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : delay, ease }}
    >
      {children}
    </motion.div>
  );
}

const thread = [
  {
    n: '01',
    title: 'Client',
    copy: 'Open a record for the company, keep the contact close, and attach every later document to it.',
  },
  {
    n: '02',
    title: 'Quotation',
    copy: 'Turn the brief into a numbered proposal with line items, days, and Ghanaian tax already calculated.',
  },
  {
    n: '03',
    title: 'Invoice',
    copy: 'Convert the accepted quote, then record cash, transfer or mobile money against the same job.',
  },
] as const;

const services = ['Client records', 'Quotations', 'Invoices', 'Payments', 'Ghana tax', 'One connected job'];

const desks = [
  {
    n: '01',
    title: 'Clients',
    copy: 'A searchable book of companies, contacts and status. Every quote and invoice stays on the record.',
  },
  {
    n: '02',
    title: 'Quotations',
    copy: 'Scope, quantity, days and unit price on one document. Edit while it is still a proposal.',
  },
  {
    n: '03',
    title: 'Invoices',
    copy: 'Issued totals, partial payments and the balance due. Print the same layout you already send.',
  },
  {
    n: '04',
    title: 'Overview',
    copy: 'Clients, open quotes, unpaid invoices and collections for the month, drawn from live records.',
  },
] as const;

function WorkflowExperience() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const selected = thread[active];
  return (
    <motion.section id="workspace" className="landing-band landing-process" initial={reduce ? false : 'hidden'} whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
      <div className="landing-wrap landing-process__inner">
        <div className="landing-process__intro">
          <motion.p className="landing-process__eyebrow" variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease } } }}>01—03 / the connected desk</motion.p>
          <h2 className="landing-process__title">
            <span className="landing-process__clip"><motion.span variants={{ hidden: { y: '110%', opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.82, delay: 0.12, ease } } }}>One client.</motion.span></span>
            <span className="landing-process__clip"><motion.span className="landing-process__title-accent" variants={{ hidden: { y: '110%', opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.82, delay: 0.22, ease } } }}>One living thread.</motion.span></span>
            <span className="landing-process__clip"><motion.span variants={{ hidden: { y: '110%', opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.82, delay: 0.32, ease } } }}>Paid, without loose ends.</motion.span></span>
          </h2>
        </div>

        <motion.div className="landing-process__stage" variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.42, ease } } }}>
          <div className="landing-process__rail" aria-hidden="true"><motion.span className="landing-process__rail-draw" initial={reduce ? { scaleX: 1 } : { scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.1, delay: 0.45, ease }} /><motion.span className="landing-process__beacon" animate={reduce ? { left: `${active * 50}%` } : { left: `${active * 50}%`, y: [0, -2, 0] }} transition={{ left: { duration: 0.55, ease }, y: { duration: 1.7, repeat: Infinity, ease: 'easeInOut' } }} /></div>
          <div className="landing-process__tabs" role="tablist" aria-label="Follow the job from client to invoice">
            {thread.map((item, i) => <motion.button key={item.n} type="button" role="tab" aria-selected={active === i} className={`landing-process__card ${active === i ? 'is-active' : ''}`} onClick={() => setActive(i)} onFocus={() => setActive(i)} onMouseEnter={() => setActive(i)} variants={{ hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.58, delay: 0.52 + i * 0.1, ease } } }}>
              <span className="landing-process__number">{item.n}</span><span className="landing-process__card-title">{item.title}</span><span className="landing-process__card-copy">{item.copy}</span><span className="landing-process__card-arrow" aria-hidden="true">→</span>
            </motion.button>)}
          </div>
          <div className="landing-process__detail" role="tabpanel" aria-live="polite"><span className="landing-process__detail-count">{selected.n}</span><AnimatePresence mode="wait"><motion.div key={selected.n} initial={reduce ? false : { opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? {} : { opacity: 0, x: -8 }} transition={{ duration: reduce ? 0 : 0.32, ease }}><h3>{selected.title}, kept in context.</h3><p>{selected.copy}</p></motion.div></AnimatePresence></div>
        </motion.div>
      </div>
    </motion.section>
  );
}

export function Welcome({ hasClerk }: { hasClerk: boolean }) {
  const workspaceHref = hasClerk ? '/sign-in' : '/dashboard';
  const reduce = useReducedMotion();

  return (
    <div className="landing min-h-[100dvh] overflow-x-hidden">
      <header className="landing-nav sticky top-0 z-30">
        <div className="landing-wrap flex items-center justify-between gap-4 py-4">
          <Link href="/" aria-label="Collage home">
            <Brand />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Landing">
            <a href="#workspace" className="landing-link hidden sm:inline-flex">
              Workspace
            </a>
            {hasClerk ? (
              <>
                <Link href="/sign-in" className="landing-link">
                  Sign in
                </Link>
                <Link href="/sign-up" className="landing-cta landing-cta--ghost">
                  Create account
                </Link>
              </>
            ) : (
              <Link href="/dashboard" className="landing-cta landing-cta--solid">
                Enter your workspace
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="landing-hero landing-wrap">
          <div className="landing-hero__copy">
            <FadeIn delay={0.06}>
              <p className="landing-kicker">Collat</p>
            </FadeIn>
            <h1 className="landing-headline">
              <LineReveal delay={0.16}>From first brief</LineReveal>
              <LineReveal delay={0.3}>
                to <span className="landing-headline__accent">paid in full.</span>
              </LineReveal>
            </h1>
            <FadeIn delay={0.68} y={8}>
              <p className="landing-lede">
                Keep every part of the job connected. Clients, quotations, invoices and payments, on one desk.
              </p>
            </FadeIn>
            <FadeIn delay={0.84} className="landing-actions" y={8}>
              <Link href={workspaceHref} className="landing-cta landing-cta--solid">
                Enter your workspace <ArrowRight size={16} aria-hidden="true" />
              </Link>
              {hasClerk && (
                <Link href="/sign-up" className="landing-cta landing-cta--ghost">
                  Create account
                </Link>
              )}
            </FadeIn>
          </div>
          <motion.div
            className="landing-hero__visual"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.08, ease }}
          >
            <LandingMark />
          </motion.div>
        </section>

        <section className="landing-marquee" aria-label="Collat capabilities">
          <div className="landing-marquee__track">
            {[...services, ...services].map((service, i) => <span key={`${service}-${i}`} className="landing-marquee__item">{service}<i aria-hidden="true" /></span>)}
          </div>
        </section>

        <WorkflowExperience />

        <section className="landing-wrap landing-desks">
          <InView className="landing-desks__intro" variant="clip">
            <p className="landing-kicker">On the desk</p>
            <h2 className="landing-h2">The rooms you actually work in.</h2>
            <p className="landing-body">
              Clients, quotations, invoices and the overview. The same rooms the signed-in desk already uses.
            </p>
          </InView>
          <ol className="landing-rows">
            {desks.map((desk, i) => (
              <InView key={desk.n} delay={i * 0.06} className="landing-row" variant={i % 2 ? 'clip' : 'rise'}>
                <span>{desk.n}</span>
                <h3>{desk.title}</h3>
                <p>{desk.copy}</p>
              </InView>
            ))}
          </ol>
        </section>

        <section className="landing-path">
          <div className="landing-wrap landing-path__inner">
            <InView className="landing-path__copy" variant="clip">
              <p className="landing-kicker">A single job</p>
              <h2 className="landing-h2">Brief, quote, invoice, paid.</h2>
              <p className="landing-body">
                Capture the client, write the subject, issue the quote with GETFund, NHIL and VAT, then convert and collect until the balance is cleared.
              </p>
            </InView>
            <InView delay={0.12} className="landing-path__aside" variant="scale">
              <span className="landing-path__rule" />
              <p>No separate tools for the same job. The quote becomes the invoice. The invoice keeps the payments.</p>
            </InView>
          </div>
        </section>

        <section className="landing-close">
          <div className="landing-wrap landing-close__inner">
            <InView variant="clip">
              <h2 className="landing-h2">Open the desk and continue the work.</h2>
              <p className="landing-body">Sign in to the Collage workspace. New accounts wait on admin approval.</p>
              <div className="landing-actions">
                <Link href={workspaceHref} className="landing-cta landing-cta--solid">
                  Enter your workspace <ArrowRight size={16} aria-hidden="true" />
                </Link>
                {hasClerk && (
                  <Link href="/sign-up" className="landing-cta landing-cta--ghost landing-cta--on-dark">
                    Create account
                  </Link>
                )}
              </div>
            </InView>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-wrap flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <span>Collage · Creating Results</span>
          <span>Accra, Ghana</span>
        </div>
      </footer>
    </div>
  );
}
