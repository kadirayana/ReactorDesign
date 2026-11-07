# Kimya Mühendisliği Hesaplama Platformu

Kimya mühendisliği öğrencileri ve mühendisler için tarayıcıda çalışan, sunucu gerektirmeyen hesaplama araçları. Next.js ile yazılmıştır ve GitHub Pages üzerinde statik site olarak yayınlanır.

**Canlı sürüm:** https://kadirayana.github.io/ReactorDesign/

## Modüller

| Alan | Modül | İçerik |
|---|---|---|
| Reaksiyon mühendisliği | Reaktör Tasarımı | PFR, CSTR, PBR, kesikli reaktör; 0/1/2. derece; Thiele modülünden etkinlik faktörü; adyabatik sıcaklık profili; ekonomik analiz (NBD, İKO) |
| | Özelleştirilebilir Reaktör | Gaz fazı katalitik yatak, kısmi basınç kinetiği, katalizör miktarı |
| | Kimyasal Denge | aA + bB ⇌ cC + dD denge bileşimi (geri yön dahil), denge sıcaklığı, ΔG° ve van ’t Hoff |
| | Dinamik Simülasyon | CSTR devreye alma, seri CSTR, PFR, A → B → C, Michaelis–Menten, toplu kütle ısıl sistem |
| | Optimizasyon | Paralel reaksiyonlarda sıcaklık–hacim optimizasyonu, kısıtlar, Pareto cephesi, duyarlılık |
| Isı ve kütle transferi | Isı Transferi | Düz duvar/silindir/küre iletim, taşınım korelasyonları, ışınım, LMTD ve ε-NTU |
| | Isı Entegrasyonu | Problem tablosu, minimum utility, bileşik ve büyük bileşik eğriler, sınırsız akış |
| | Buharlaştırıcı | Kettle tipi buharlaştırıcıda iteratif U, tüp sayısı, demet/gövde çapı, 3B görünüm |
| | Distilasyon | McCabe–Thiele; Fenske–Underwood–Gilliland–Kirkbride kısa yol; madde/enerji dengesi |
| Akışkanlar | Boru Hattı ve Pompa | Darcy–Weisbach + Colebrook, armatür kayıpları, pompa gücü, NPSH, sistem/pompa eğrisi |

Ayrıca: hesaplama geçmişi (yalnızca tarayıcıda), CSV dışa aktarma, açık/koyu tema.

## Geliştirme

Gereksinim: Node.js 20+

```bash
npm ci            # bağımlılıkları kur
npm run dev       # http://localhost:3000/ReactorDesign/
npm test          # hesaplama kütüphanesinin birim testleri
npm run build     # statik site çıktısı: out/
```

`main` dalına yapılan her push, GitHub Actions ile siteyi GitHub Pages’e yayınlar (`.github/workflows/deploy-gh-pages.yml`).

## Proje yapısı

```
pages/            Next.js sayfaları (her modül bir sayfa)
components/       Ortak arayüz: ui.js (form, kart, sonuç bileşenleri), ChartClient, Navbar, modules.js
src/lib/          Saf hesaplama fonksiyonları (arayüzden bağımsız, test edilir)
__tests__/        Ders kitabı ve analitik çözümlerle karşılaştıran birim testleri
styles/           globals.css (tasarım değişkenleri, açık/koyu tema), modül CSS’leri
```

Yeni bir modül eklerken hesabı `src/lib/` altına saf fonksiyon olarak yazın, testini `__tests__/` altına ekleyin, sayfayı `components/ui.js` bileşenleriyle kurun ve modülü `components/modules.js` listesine ekleyin; menü ve ana sayfa otomatik güncellenir.

## Varsayımlar

Her sayfanın üst açıklaması ve sonuç kartları kullanılan modeli ve varsayımları belirtir (ideal reaktör, sabit yoğunluk, sabit bağıl uçuculuk, sabit molar taşma vb.). Sonuçlar ön tasarım ve eğitim amaçlıdır; detaylı mühendislik tasarımı yerine geçmez.
