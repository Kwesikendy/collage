import { type FormEvent, useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  Mail,
  Phone,
  Send,
  Sparkles,
  User,
} from 'lucide-react';
import {
  PORTFOLIO_SERVICES,
  type ServiceCategory,
} from '@/data/portfolio-data';

interface EnquiryFormProps {
  initialService?: ServiceCategory;
  initialMessage?: string;
  onSuccess?: () => void;
}

const STORAGE_KEY = 'collat_erp_store_v3';
const INQUIRIES_KEY = 'collat_inquiries_v1';

export function EnquiryForm({ initialService, initialMessage, onSuccess }: EnquiryFormProps) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState<ServiceCategory | string>(
    initialService || 'billboards',
  );
  const [message, setMessage] = useState(initialMessage || '');

  useEffect(() => {
    if (initialService) {
      setService(initialService);
    }
  }, [initialService]);

  useEffect(() => {
    if (initialMessage) {
      setMessage(initialMessage);
    }
  }, [initialMessage]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const trimmedName = name.trim();
    const trimmedCompany = company.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      setError('Please provide your full contact name.');
      return;
    }
    if (!trimmedCompany) {
      setError('Please specify your company or organization name.');
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please provide a valid corporate email address.');
      return;
    }
    if (!trimmedPhone || trimmedPhone.length < 8) {
      setError('Please provide a valid Ghanaian phone number (e.g. +233 24 000 0000).');
      return;
    }
    if (!trimmedMessage) {
      setError('Please provide a brief description of your project scope.');
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      const newLeadId = `cli-lead-${Date.now()}`;

      // 1. Append new lead to collat_erp_store_v3 in localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const rawStore = window.localStorage.getItem(STORAGE_KEY);
          let store: any = null;
          if (rawStore) {
            try {
              store = JSON.parse(rawStore);
            } catch {
              store = null;
            }
          }

          if (!store || typeof store !== 'object' || Array.isArray(store)) {
            store = {
              clients: [],
              documents: [],
              payments: [],
              rentals: [],
              productionOrders: [],
            };
          }

          if (!Array.isArray(store.clients)) {
            store.clients = [];
          }

          const newClientRecord = {
            id: newLeadId,
            companyName: trimmedCompany,
            contactName: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
            address: `Web Quote Enquiry: ${service}`,
            city: 'Accra',
            country: 'Ghana',
            status: 'lead' as const,
            createdAt: now,
            updatedAt: now,
          };

          // Prepend lead to the beginning of the list
          store.clients.unshift(newClientRecord);
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
        } catch {
          // Gracefully continue
        }

        // 2. Also record rich inquiry item for marketer leads portal
        try {
          const rawInquiries = window.localStorage.getItem(INQUIRIES_KEY);
          let inquiries: any[] = [];
          if (rawInquiries) {
            try {
              inquiries = JSON.parse(rawInquiries);
            } catch {
              inquiries = [];
            }
          }
          if (!Array.isArray(inquiries)) inquiries = [];

          inquiries.unshift({
            id: `inq-${Date.now()}`,
            clientId: newLeadId,
            name: trimmedName,
            company: trimmedCompany,
            email: trimmedEmail,
            phone: trimmedPhone,
            service,
            message: trimmedMessage,
            status: 'new',
            createdAt: now,
          });

          window.localStorage.setItem(INQUIRIES_KEY, JSON.stringify(inquiries));
        } catch {
          // Gracefully continue
        }
      }

      setIsSubmitted(true);
      if (onSuccess) onSuccess();
    } catch {
      setError('An unexpected error occurred while saving your inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setService(initialService || 'billboards');
    setMessage('');
    setIsSubmitted(false);
    setError(null);
  };

  if (isSubmitted) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-8 text-center backdrop-blur-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 size={32} aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-white">
          Quote Request Received
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-300">
          Thank you, <span className="font-semibold text-white">{name}</span>. Your enquiry for{' '}
          <span className="font-semibold text-white">{company}</span> has been logged directly with our Accra project desk.
        </p>
        <p className="mt-2 font-mono text-xs text-neutral-400">
          A Collage Ghana commercial lead manager will review your project brief and follow up within 24 business hours.
        </p>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-mono text-xs text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            Submit Another Project Inquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-white/10 bg-neutral-900/60 p-6 backdrop-blur-md sm:p-8"
    >
      <div className="mb-6 space-y-1">
        <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-red-400">
          <Sparkles size={13} aria-hidden="true" />
          <span>Request a Quote</span>
        </div>
        <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          Start Your Project Brief
        </h3>
        <p className="text-xs text-neutral-400 sm:text-sm">
          Submit specifications directly to our Ridge Accra commercial and field engineering desk.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-900/40 bg-red-950/30 p-3.5 text-xs text-red-300"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Name and Company row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="inquiry-name"
              className="block font-mono text-xs font-medium text-neutral-300"
            >
              Contact Person Full Name *
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                <User size={14} aria-hidden="true" />
              </span>
              <input
                id="inquiry-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nana Ama Mensah"
                className="w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pr-3 pl-9 text-xs text-white placeholder-neutral-500 transition-colors focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="inquiry-company"
              className="block font-mono text-xs font-medium text-neutral-300"
            >
              Company or Institution Name *
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                <Building2 size={14} aria-hidden="true" />
              </span>
              <input
                id="inquiry-company"
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Ecobank Ghana PLC"
                className="w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pr-3 pl-9 text-xs text-white placeholder-neutral-500 transition-colors focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* Email and Phone row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="inquiry-email"
              className="block font-mono text-xs font-medium text-neutral-300"
            >
              Corporate Email Address *
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                <Mail size={14} aria-hidden="true" />
              </span>
              <input
                id="inquiry-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@company.com.gh"
                className="w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pr-3 pl-9 text-xs text-white placeholder-neutral-500 transition-colors focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="inquiry-phone"
              className="block font-mono text-xs font-medium text-neutral-300"
            >
              Ghana Phone / WhatsApp Number *
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                <Phone size={14} aria-hidden="true" />
              </span>
              <input
                id="inquiry-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+233 24 000 0000"
                className="w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pr-3 pl-9 text-xs text-white placeholder-neutral-500 transition-colors focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* Service Needed Selector */}
        <div>
          <label
            htmlFor="inquiry-service"
            className="block font-mono text-xs font-medium text-neutral-300"
          >
            Primary Service Required *
          </label>
          <div className="relative mt-1.5">
            <select
              id="inquiry-service"
              value={service}
              onChange={(e) => setService(e.target.value as ServiceCategory)}
              className="w-full appearance-none rounded-lg border border-white/10 bg-black/40 py-2.5 pr-9 pl-3 text-xs text-white transition-colors focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              {PORTFOLIO_SERVICES.map((s) => (
                <option key={s.id} value={s.category} className="bg-neutral-900 text-white">
                  {s.title} ({s.shortTitle})
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500">
              <ChevronDown size={14} aria-hidden="true" />
            </span>
          </div>
        </div>

        {/* Message / Brief Details */}
        <div>
          <label
            htmlFor="inquiry-message"
            className="block font-mono text-xs font-medium text-neutral-300"
          >
            Project Brief, Dimensions & Location *
          </label>
          <div className="mt-1.5">
            <textarea
              id="inquiry-message"
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please describe project specifications: target installation site (Accra, Tema, Kumasi), dimensions, quantity, requested turnaround dates, and design assets."
              className="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-xs leading-relaxed text-white placeholder-neutral-500 transition-colors focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Submission Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-lg shadow-red-900/40 transition-all hover:bg-red-500 hover:shadow-red-800/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Submitting Brief...</span>
            ) : (
              <>
                <Send size={14} aria-hidden="true" />
                <span>Submit Quote Request to Desk</span>
              </>
            )}
          </button>
        </div>

        <p className="text-center font-mono text-[10px] text-neutral-500">
          Inquiries are automatically registered into the Collage Ghana Lead Ledger for rapid processing.
        </p>
      </div>
    </form>
  );
}
