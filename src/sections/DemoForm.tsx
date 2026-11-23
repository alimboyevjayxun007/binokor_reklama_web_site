import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "../lib/motion";

export const TELEGRAM = "zafarovna_9977";
export const PHONE = "+998941992604";
export const PHONE_LABEL = "+998 94 199 26 04";

const TYPES = ["Qurilish mollari do'koni", "G'isht va sement", "Bo'yoq va lak", "Santexnika", "Ulgurji ombor"];
const BRANCHES = ["1 ta", "2–3 ta", "4 va undan ko'p"];

/**
 * Demo request: no server needed. The filled form becomes a ready message that
 * opens in Telegram (and is copied, in case Telegram doesn't prefill it).
 */
export default function DemoForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [shop, setShop] = useState("");
  const [type, setType] = useState(TYPES[0]);
  const [branches, setBranches] = useState(BRANCHES[0]);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const digits = phone.replace(/\D/g, "");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Ismingizni kiriting.");
    if (digits.length < 9) return setError("Telefon raqamini to'liq kiriting, masalan 90 123 45 67.");
    setError(null);
    const msg = [
      "Assalomu alaykum! Binokor bo'yicha bepul demo so'rayman.",
      `Ism: ${name.trim()}`,
      `Telefon: ${phone.trim()}`,
      shop.trim() ? `Do'kon: ${shop.trim()}` : null,
      `Yo'nalish: ${type}`,
      `Filiallar: ${branches}`,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard?.writeText(msg);
    } catch {
      /* clipboard can be blocked; the Telegram link still carries the text */
    }
    window.open(`https://t.me/${TELEGRAM}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    setSent(true);
  };

  const field =
    "w-full rounded-xl bg-white/[0.06] border border-white/15 px-4 py-3 text-white text-[15.5px] placeholder:text-white/40 focus:outline-none focus:border-lime focus:bg-white/[0.09] transition-colors";

  return (
    <motion.div
      id="demo"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: EASE }}
      className="relative z-10 mx-auto max-w-[760px] rounded-3xl border border-white/12 bg-white/[0.04] backdrop-blur-md p-5 md:p-9 scroll-mt-28"
    >
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div key="done" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-center py-6">
            <div className="mx-auto w-14 h-14 rounded-full bg-lime text-navy flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12.5 10 17l9-10" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="mt-5 font-display text-white font-bold text-[24px] md:text-[30px]">So'rovingiz Telegramda ochildi</h3>
            <p className="mt-3 text-white/70 text-[15.5px] leading-relaxed max-w-[460px] mx-auto">
              Xabarni yuboring, biz siz bilan bog'lanamiz. Matn chiqmasa, u nusxalangan: chatga joylashtirib yuborsangiz bo'ldi.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href={`https://t.me/${TELEGRAM}`} target="_blank" rel="noopener" className="px-5 py-3 rounded-xl bg-cobalt text-white font-semibold">
                Telegramni ochish
              </a>
              <button type="button" onClick={() => setSent(false)} className="px-5 py-3 rounded-xl border border-white/20 text-white font-semibold">
                Formaga qaytish
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -40 }}>
            <h3 className="font-display text-white font-bold text-[24px] md:text-[30px] tracking-tight">Bepul demo so'rash</h3>
            <p className="mt-2 text-white/70 text-[15px] md:text-[16px]">Ma'lumotlaringizni qoldiring: tizimni o'z mahsulotlaringiz misolida ko'rsatamiz.</p>

            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[13.5px] text-white/80 font-medium">Ismingiz</span>
                <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan, Jasur" autoComplete="name" required />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13.5px] text-white/80 font-medium">Telefon</span>
                <input
                  className={field}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="90 123 45 67"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5 md:col-span-2">
                <span className="text-[13.5px] text-white/80 font-medium">Do'kon nomi va manzili (ixtiyoriy)</span>
                <input className={field} value={shop} onChange={(e) => setShop(e.target.value)} placeholder="Masalan, Binokor Savdo, Chilonzor" />
              </label>
            </div>

            <fieldset className="mt-5">
              <legend className="text-[13.5px] text-white/80 font-medium mb-2">Yo'nalishingiz</legend>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={type === t}
                    onClick={() => setType(t)}
                    className={`px-3.5 py-2 rounded-full text-[13.5px] font-semibold border transition-colors ${
                      type === t ? "bg-cobalt border-cobalt text-white" : "border-white/20 text-white/75 hover:border-white/40"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-4">
              <legend className="text-[13.5px] text-white/80 font-medium mb-2">Do'konlar soni</legend>
              <div className="flex flex-wrap gap-2">
                {BRANCHES.map((b) => (
                  <button
                    key={b}
                    type="button"
                    aria-pressed={branches === b}
                    onClick={() => setBranches(b)}
                    className={`px-3.5 py-2 rounded-full text-[13.5px] font-semibold border transition-colors ${
                      branches === b ? "bg-cobalt border-cobalt text-white" : "border-white/20 text-white/75 hover:border-white/40"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </fieldset>

            {error && (
              <p role="alert" className="mt-4 text-[14px] text-lime font-semibold">
                {error}
              </p>
            )}

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 bg-lime text-navy font-bold text-[16.5px] px-6 py-4 rounded-2xl glow-lime">
                Telegram orqali yuborish
              </button>
              <a href={`tel:${PHONE}`} className="inline-flex items-center justify-center gap-2 border border-white/25 text-white font-semibold text-[16px] px-6 py-4 rounded-2xl hover:bg-white/10">
                Qo'ng'iroq qilish
              </a>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
