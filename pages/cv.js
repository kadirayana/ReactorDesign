import CVDownloadButton from '../components/CVDownloadButton';

export default function CVPage() {
  return (
    <div className="page-container cv-page">
      <CVDownloadButton />
      <div className="cv-header">
        <h1>Kadir Ayana</h1>
        <h2>Kimya Mühendisi | Ar-Ge & Proses Geliştirme</h2>
        <div className="cv-contact">
          <span>25.01.1998</span>
          <span>İzmir, Türkiye</span>
          <span>+90 536 943 39 43</span>
          <span><a href="mailto:Ayanakadir@hotmail.com">Ayanakadir@hotmail.com</a></span>
          <span><a href="https://Linkedin.com/in/kadirayana" target="_blank" rel="noopener noreferrer">linkedin.com/in/kadirayana</a></span>
        </div>
      </div>
      <div className="cv-summary">
        <p>Proses optimizasyonu, ürün geliştirme ve kalite kontrol konularında 5+ yıllık deneyime sahip, sonuç odaklı bir Kimya Mühendisiyim. Polimer kimyası, reaksiyon kinetiği ve termodinamik simülasyonlar alanında güçlü bir teorik altyapıya ve pratik becerilere sahibim. Veri analizi ve makine öğrenmesi araçlarını kullanarak Ar-Ge süreçlerini iyileştirmeye ve inovatif çözümler üretmeye odaklandım.</p>
      </div>
      <div className="cv-section">
        <h3>İş Deneyimi</h3>
        {/* TotalEnergies */}
        <div className="cv-job">
          <div className="cv-job-title">TotalEnergies <span>| Üretim Mühendisi</span></div>
          <div className="cv-job-date">Aralık 2022 – Günümüz</div>
          <ul>
            <li>Bitüm üretim süreçlerinin optimizasyonu ve verimliliğin artırılması.</li>
            <li>Yeni ürün formülasyonlarının geliştirilmesi ve laboratuvardan üretime ölçeklendirilmesi.</li>
            <li>Üretim kalitesini sağlamak için ASTM standartlarına uygun testlerin yapılması.</li>
            <li>Proses güvenliği analizleri (HAZOP) ve iyileştirme çalışmalarının yürütülmesi.</li>
          </ul>
        </div>
        {/* Alpkim Adhesives */}
        <div className="cv-job">
          <div className="cv-job-title">Alpkim Adhesives <span>| Ar-Ge Mühendisi</span></div>
          <div className="cv-job-date">Ağustos 2021 – Aralık 2022</div>
          <ul>
            <li>Poliüretan bazlı yapıştırıcıların formülasyonu ve ürün geliştirme projeleri.</li>
            <li>Müşteri taleplerine yönelik teknik çözümlerin sunulması ve ürün denemeleri.</li>
          </ul>
        </div>
        {/* Kanat Paints and Coatings - R&D Engineer */}
        <div className="cv-job">
          <div className="cv-job-title">Kanat Boya ve Kaplama <span>| Ar-Ge Mühendisi</span></div>
          <div className="cv-job-date">Ocak 2020 – Ağustos 2021</div>
          <ul>
            <li>Endüstriyel boya ve kaplama sistemleri için Ar-Ge faaliyetleri.</li>
            <li>Reçine sentezi ve polimer karakterizasyonu çalışmaları.</li>
            <li>Maliyet düşürme ve ürün performansı iyileştirme projeleri.</li>
            <li>ISO 9001 kalite yönetim sistemi standartlarına uygun dokümantasyon.</li>
          </ul>
        </div>
        {/* IMS Polymers */}
        <div className="cv-job">
          <div className="cv-job-title">IMS Polimerleri <span>| Stajyer Mühendis</span></div>
          <div className="cv-job-date">Haziran 2019 – Ağustos 2019</div>
          <ul>
            <li>Polimer üretim süreçlerine destek verilmesi ve kalite kontrol analizleri.</li>
            <li>Laboratuvar test ekipmanlarının kalibrasyonu ve bakımı.</li>
          </ul>
        </div>
      </div>
      <div className="cv-section">
        <h3>Eğitim</h3>
        {/* Ege University - Master's */}
        <div className="cv-edu">
          <div className="cv-edu-title">Ege Üniversitesi <span>| Yüksek Lisans, Kimya Mühendisliği</span></div>
          <div className="cv-edu-date">2018 – 2021</div>
          <ul>
            <li>Bitirme Tezi: Polimerik Kompozit Malzemelerin Termal Davranışlarının İncelenmesi.</li>
          </ul>
        </div>
        {/* Ege University - Bachelor's */}
        <div className="cv-edu">
          <div className="cv-edu-title">Ege Üniversitesi <span>| Lisans, Kimya Mühendisliği</span></div>
          <div className="cv-edu-date">2013 – 2018</div>
          <ul>
            <li>Dersler: İleri Reaksiyon Kinetiği, Proses Tasarımı, Termodinamik.</li>
          </ul>
        </div>
      </div>
      <div className="cv-section-break">
        <div className="cv-grid-2">
          <div className="cv-section">
            <h3>Yabancı Diller</h3>
            <div className="cv-skills-body">
              <div><strong>Türkçe:</strong> Ana Dil</div>
              <div><strong>İngilizce:</strong> İleri Seviye (C1)</div>
              <div><strong>Almanca:</strong> Başlangıç Seviyesi (A2)</div>
            </div>
          </div>
          <div className="cv-section">
            <h3>Teknik Yetkinlikler</h3>
            <div className="cv-skills-body">
              <div><strong>Programlama:</strong> Python (NumPy, Pandas), MATLAB, AutoCAD</div>
              <div><strong>Veri Analizi:</strong> İstatistiksel Analiz (Minitab), Regresyon, Veri Görselleştirme</div>
              <div><strong>Makine Öğrenmesi:</strong> Scikit-learn, TensorFlow Temelleri, Sınıflandırma Modelleri</div>
              <div><strong>Kimya Müh. Araçları:</strong> Proses Tasarımı ve Modelleme, ASPEN, Reaksiyon Kinetiği</div>
              <div><strong>Kalite ve Standartlar:</strong> ASTM Testleri, ISO Uyumluluğu, GMP Protokolleri</div>
              <div><strong>Yazılım:</strong> SolidWorks (3D CAD), Microsoft Office, Git/GitHub</div>
            </div>
          </div>
        </div>
      </div>
      <div className="cv-grid-2">
        <div className="cv-section">
          <h3>Sertifikalar</h3>
          <ul className="cv-certs">
            <li>Simulink Onramp (MathWorks)</li>
            <li>MATLAB Onramp (MathWorks)</li>
            <li>Aromatik Araştırmalar ve Sıfır Atık (Ege Üniversitesi)</li>
            <li>Araştırma ve Teknoloji Yönetimi (Ege Üniversitesi)</li>
            <li>Proje Yazma Eğitimi (Ege Üniversitesi)</li>
            <li>Python ile Veri Bilimi (Ege Üniversitesi)</li>
            <li>Akademik Yazım (Ege Üniversitesi)</li>
            <li>İlk Yardım Sertifikası (Ege Üniversitesi)</li>
            <li>Yapay Zeka ve Makine Öğrenmesi (Ege Üniversitesi)</li>
          </ul>
        </div>
        <div className="cv-section">
          <h3>Projeler</h3>
          <ul className="cv-projects">
            <li>Biyobozunur Polimer Sentezi ve Karakterizasyonu</li>
            <li>Kesikli Reaktör için PID Kontrol Sistemi Simülasyonu</li>
            <li>Atık Isı Geri Kazanım Sistemi Tasarımı</li>
            <li>Veri Analizi ile Üretim Hatalarını Tahminleme Modeli</li>
            <li>Katalitik Konvertör Verimlilik Analizi</li>
            <li>Mikroplastik Filtrasyon Sistemi Geliştirme</li>
            <li>Sıvı-Sıvı Ekstraksiyon Kolonu Tasarımı</li>
            <li>Alternatif Yakıtların Yanma Verimliliği Araştırması</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps() {
  return {
    props: {}, 
  };
}

