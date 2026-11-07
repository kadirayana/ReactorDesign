// Single source of truth for the calculation modules (sidebar + home page).
import React from 'react';

const svg = children => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export const icons = {
  home: svg(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></>),
  reactor: svg(<><path d="M9 3h6v8l4 7H5l4-7V3z" /><path d="M9 3h6" /><circle cx="13" cy="15" r="1" fill="currentColor" /><circle cx="10" cy="17" r="0.8" fill="currentColor" /></>),
  customReactor: svg(<><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 6V4M17 6V4M7 18v2M17 18v2" /><circle cx="12" cy="12" r="3" /></>),
  chemical: svg(<><path d="M6 3v6l-2 8a2 2 0 002 2h12a2 2 0 002-2l-2-8V3" /><path d="M6 3h12" /><path d="M8 14h8" /></>),
  heat: svg(<><path d="M12 2a5 5 0 0 0-1 9.9V18h2V11.9A5 5 0 0 0 12 2z" /><rect x="10" y="18" width="4" height="4" rx="1" /></>),
  integration: svg(<path d="M3 12h4l3-9 4 18 3-9h4" />),
  dynamics: svg(<path d="M22 12h-4l-3 9L11 3l-3 9H4" />),
  vaporizer: svg(<><path d="M8 16c0 2.2 1.8 4 4 4s4-1.8 4-4" /><path d="M12 12V4" /><path d="M8 8c-2 0-4 1-4 4s2 4 4 4" /><path d="M16 8c2 0 4 1 4 4s-2 4-4 4" /></>),
  distillation: svg(<><rect x="8" y="2" width="8" height="20" rx="3" /><path d="M8 7h8M8 12h8M8 17h8" /><path d="M16 4h4v3M4 20h4" /></>),
  fluids: svg(<><circle cx="9" cy="12" r="5" /><path d="M9 7v5l3 3" /><path d="M14 12h8M18 8v8" /></>),
  optimize: svg(<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>),
  history: svg(<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>),
};

export const categories = [
  { id: 'reaction', title: 'Reaksiyon Mühendisliği', desc: 'Reaktör boyutlandırma, kinetik, denge ve optimizasyon' },
  { id: 'transfer', title: 'Isı ve Kütle Transferi', desc: 'Isı değiştiriciler, ayırma prosesleri ve enerji entegrasyonu' },
  { id: 'fluids', title: 'Akışkanlar Mekaniği', desc: 'Boru hatları, basınç kaybı ve pompa seçimi' },
];

export const modules = [
  { href: '/reactor', category: 'reaction', title: 'Reaktör Tasarımı', desc: 'PFR, CSTR, PBR ve kesikli reaktör için hacim, uzay zamanı ve dönüşüm profilleri.', icon: icons.reactor, color: '#2563EB' },
  { href: '/reactorss', category: 'reaction', title: 'Özelleştirilebilir Reaktör', desc: 'Gaz fazı katalitik reaktörde kısmi basınca dayalı kinetik ile katalizör miktarı.', icon: icons.customReactor, color: '#7C3AED' },
  { href: '/chemical', category: 'reaction', title: 'Kimyasal Denge', desc: 'aA + bB ⇌ cC + dD için denge bileşimi ve verilen K için sıcaklık.', icon: icons.chemical, color: '#059669' },
  { href: '/dynamics', category: 'reaction', title: 'Dinamik Simülasyon', desc: 'CSTR devreye alma, PFR, enzim kinetiği ve seri reaksiyon zaman profilleri.', icon: icons.dynamics, color: '#0891B2' },
  { href: '/optimization', category: 'reaction', title: 'Optimizasyon', desc: 'Sıcaklık–hacim uzayında Pareto, yüzey ve duyarlılık analizi.', icon: icons.optimize, color: '#E11D48' },
  { href: '/heattransfer', category: 'transfer', title: 'Isı Transferi', desc: 'İletim, taşınım korelasyonları, ışınım ve LMTD ile ısı değiştirici.', icon: icons.heat, color: '#DC2626' },
  { href: '/heatintegration', category: 'transfer', title: 'Isı Entegrasyonu', desc: 'Pinç analizi, sıcaklık kaskadı ve minimum utility ihtiyacı.', icon: icons.integration, color: '#D97706' },
  { href: '/vaporizer', category: 'transfer', title: 'Buharlaştırıcı Tasarımı', desc: 'Kettle tipi buharlaştırıcıda iteratif U, tüp sayısı ve gövde boyutu.', icon: icons.vaporizer, color: '#9333EA', isNew: false },
  { href: '/distillation', category: 'transfer', title: 'Distilasyon', desc: 'McCabe–Thiele grafiği ve Fenske–Underwood–Gilliland kısa yol tasarımı.', icon: icons.distillation, color: '#0D9488', isNew: true },
  { href: '/fluids', category: 'fluids', title: 'Boru Hattı ve Pompa', desc: 'Darcy–Weisbach basınç kaybı, sürtünme faktörü, pompa gücü ve NPSH.', icon: icons.fluids, color: '#4F46E5', isNew: true },
];

export const extraNav = [
  { href: '/history', title: 'Hesaplama Geçmişi', icon: icons.history },
];
