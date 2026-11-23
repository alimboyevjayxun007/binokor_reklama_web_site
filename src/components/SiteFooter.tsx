export default function SiteFooter() {
  return (
    <footer className="bg-navy border-t border-white/10">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-14 grid md:grid-cols-[1.3fr_1fr_1fr] gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 21V9L12 3L21 9V21H14V14H10V21H3Z" stroke="#5B8CFF" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="font-display font-bold text-[16px] text-white">Binokor</span>
          </div>
          <p className="text-[14px] text-white/65 leading-relaxed max-w-[280px] font-body">
            Qurilish materiallari savdosi uchun kassa, ombor va hisobot tizimi.
          </p>
        </div>

        <div>
          <h4 className="text-[13px] font-semibold text-white/70 mb-4">Sahifa</h4>
          <ul className="flex flex-col gap-2.5 text-[14px] text-white/65 font-body">
            <li><a href="#mahsulotlar" className="hover:text-white transition-colors">Mahsulotlar</a></li>
            <li><a href="#afzalliklar" className="hover:text-white transition-colors">Afzalliklar</a></li>
            <li><a href="#ai-agent" className="hover:text-white transition-colors">AI agent</a></li>
            <li><a href="#ishga-tushirish" className="hover:text-white transition-colors">Ishga tushirish</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[13px] font-semibold text-white/70 mb-4">Aloqa</h4>
          <ul className="flex flex-col gap-2.5 text-[14px] text-white/65 font-body">
            <li><a href="tel:+998941992604" className="hover:text-white transition-colors">+998 94 199 26 04</a></li>
            <li><a href="https://t.me/zafarovna_9977" target="_blank" rel="noopener" className="hover:text-white transition-colors">Telegram: @zafarovna_9977</a></li>
            <li><a href="#demo" className="hover:text-white transition-colors">Bepul demo so'rash</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-5 text-[13px] text-white/50">
          © 2026 Binokor. Barcha huquqlar himoyalangan.
        </div>
      </div>
    </footer>
  );
}
