# ReactorDesign – Düzeltme Takip Dosyası

> Bu dosya, projede tespit edilen sorunların düzeltilme durumunu takip eder.

## Durum: ✅ 24/26 tamamlandı

### 🔴 Kritik Sorunlar
| # | Sorun | Durum | Detay |
|---|-------|-------|-------|
| 1 | React/Next.js versiyon uyumu | ✅ | Next.js 15→14.2.25 downgrade |
| 2 | Yanlış yerdeki next.config.js | ✅ | `.github/workflows/next.config.js` silindi |
| 3 | Layout bileşeni entegrasyonu | ✅ | `_app.js` → Layout, favicon düzeltildi |
| 4 | Eksik PWA ikonları | ✅ | manifest.json güncellendi, `public/` altına taşındı |

### 🟡 Önemli Sorunlar
| # | Sorun | Durum | Detay |
|---|-------|-------|-------|
| 5 | CSS tekrarları | ✅ | ~286 satır kaldırıldı |
| 6 | Legacy dosyalar | ✅ | `styles.css`, `responsive.css`, `script.js` silindi |
| 7 | Hesaplama mantığı tekrarı | ✅ | `src/lib/reactor.js` referans alınıyor |
| 8 | Hardcoded selectivity | ✅ | Seçicilik kullanıcı girdisi (varsayılan 1) |
| 9 | LanguageToggle | ⏳ | Bileşen var ama Navbar'da import edilmiyor; çeviri dosyaları kullanılmıyor |
| 10 | innerHTML → JSX SVG | ✅ | `ReactorDiagram.js` bileşeni oluşturuldu |
| 11 | TabButton tekrarı | ✅ | `components/TabButton.js` paylaşımlı bileşen |
| 12 | .gitignore | ✅ | .next/, out/, .env*, *.log eklendi |

### 🟢 İyileştirmeler
| # | Sorun | Durum | Detay |
|---|-------|-------|-------|
| 13 | Input validasyonu | ✅ | `type="number"` tüm sayısal inputlarda |
| 14 | Error Boundary | ✅ | `ErrorBoundary.js` oluşturuldu, `_app.js`'e eklendi |
| 15 | downloadCSV tekrarı | ✅ | `src/lib/utils.js` paylaşımlı modül |
| 16 | SEO Head eksikleri | ✅ | Layout'a meta desc + reactor.js'e Head eklendi |
| 17 | Inline style'ları azalt | ⏳ | Büyük kapsam — gelecekte yapılacak |
| 18 | CI/CD Node versiyonu | ✅ | Node 18 → 20 güncellendi |

### 🧮 Hesaplama Düzeltmeleri (testler: `__tests__/calculations.test.js`, `npm test`)
| # | Modül | Düzeltme |
|---|-------|----------|
| 19 | `reactor.js` | Sıfırıncı derece PFR/CSTR/batch tutarlı (τ = C₀X/k); profiller gerçek τ/V ekseninde ve hedef X'te bitiyor; gelişmiş sekme ortak kütüphaneyi kullanıyor; k birimi dereceye göre |
| 20 | `reactorss.js` | Toplam molde ürün + yan ürün (d) dahil; B limitleyici iken akışlar doğru; E birim tahmini kaldırıldı (kJ/mol) |
| 21 | `vaporizer.js` | Db = d₀(Nt/K₁)^(1/n₁); sıcaklık kesişiminde hata; yakınsama ve Re uyarısı |
| 22 | `radiation.js` | İki yüzey direnci (1−ε)/(εA); °C/K tahmini kaldırıldı, tüm girdiler °C |
| 23 | `heattransfer.js` | Sıcaklık kesişimi raporlanıyor; ters akış üstel profil |
| 24 | `chemicalSolver.js` | Negatif ilerleme (geri reaksiyon) destekleniyor; T analitik çözüm |
| 25 | `dynamics.js` | Euler yerine analitik çözüm / RK4; örnek yükleme eski state ile hesaplamıyor |
| 26 | `convection.js` | Laminer/geçiş/türbülans aralıkları; doğal konveksiyona sıcaklıklar iletiliyor |

---
**Son güncelleme:** Hesaplama düzeltmeleri — 40 birim testi geçiyor; `next build` bu değişikliklerden sonra henüz çalıştırılmadı.
