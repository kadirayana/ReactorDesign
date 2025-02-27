const translations = {
  tr: {
    nav: {
      home: "Ana Sayfa",
      reactor: "Reaktör Tasarım",
      chemical: "Kimyasal Denge",
      heat: "Isı Transferi",
      dynamics: "Dinamik Simülasyon",
      optimization: "Reaktör Optimizasyonu",
      history: "Hesaplama Geçmişi"
    },
    common: {
      calculate: "Hesapla",
      reset: "Sıfırla",
      start: "Başlat",
      pause: "Duraklat",
      temperature: "Sıcaklık",
      volume: "Hacim",
      concentration: "Konsantrasyon",
      conversion: "Dönüşüm",
      title: "Kimya Mühendisliği Hesaplamaları"
    },
    index: {
      mainTitle: "Kimya Mühendisliği Hesaplamaları",
      subtitle: "Reaktör tasarımı, kimyasal denge ve ısı transferi hesaplamaları için araçlar",
      reactorTitle: "Reaktör Tasarımı",
      reactorDesc: "PFR, CSTR ve diğer reaktör tipleri için tasarım hesaplamaları",
      chemicalTitle: "Kimyasal Denge",
      chemicalDesc: "Denge sabitleri ve konsantrasyon hesaplamaları",
      heatTitle: "Isı Transferi",
      heatDesc: "Isı değiştiricileri ve reaktör ısı transferi hesaplamaları",
      dynamicsTitle: "Dinamik Simülasyon",
      dynamicsDesc: "Reaktör sistemlerinin dinamik davranış analizi"
    },
    // Her sayfa için özel çeviriler
    reactor: {
      title: "Reaktör Tasarımı",
      pageTitle: "Reaktör Tasarımı",
      pageDesc: "Farklı reaktör tipleri için tasarım hesaplamaları",
      type: "Reaktör Tipi",
      pfr: "Piston Akışlı Reaktör (PFR)",
      cstr: "Karıştırmalı Tank Reaktörü (CSTR)",
      pbr: "Dolgulu Yatak Reaktörü (PBR)",
      flowRate: "Akış Hızı (L/s)",
      concentration: "Giriş Konsantrasyonu (mol/L)",
      reactionRate: "Reaksiyon Hız Sabiti (1/s)",
      targetConversion: "Hedef Dönüşüm",
      view3d: "3D Görünüm",
      viewProfile: "Profil",
      results: {
        volume: "Hesaplanan Hacim",
        residence: "Kalış Süresi",
        conversion: "Dönüşüm"
      }
    },
    chemical: {
      title: "Kimyasal Denge Hesaplamaları",
      pageTitle: "Kimyasal Denge Hesaplamaları",
      pageDesc: "Reaksiyon denge sabitleri ve konsantrasyon hesaplamaları",
      reactionType: "Reaksiyon Tipi",
      reaction1: "A ⇌ B",
      reaction2: "A + B ⇌ C",
      reaction3: "2A ⇌ B",
      k1: "İleri Reaksiyon Sabiti (k₁)",
      k_1: "Geri Reaksiyon Sabiti (k₋₁)",
      initialConc: "Başlangıç [A] (mol/L)",
      concTab: "Konsantrasyon",
      eqTab: "Denge",
      plotTitle: "Konsantrasyon vs. Zaman",
      xAxis: "Zaman (s)",
      yAxis: "Konsantrasyon (mol/L)"
    },
    heat: {
      title: "Isı Transferi",
      pageTitle: "Isı Transferi Hesaplamaları",
      pageDesc: "Reaktör sistemlerinde ısı transferi analizi",
      reactorType: "Reaktör Tipi",
      pfr: "Piston Akışlı Reaktör",
      cstr: "Karıştırmalı Tank Reaktörü",
      inletTemp: "Giriş Sıcaklığı (°C)",
      coolantTemp: "Soğutucu Sıcaklığı (°C)",
      reactionHeat: "Reaksiyon Isısı (kJ/mol)",
      heatTransfer: "Isı Transfer Katsayısı (W/m²K)",
      tempProfile: "Sıcaklık Profili",
      view3d: "3D Görünüm",
      results: {
        maxTemp: "Maksimum Sıcaklık",
        heatDuty: "Isı Yükü",
        conversion: "Dönüşüm"
      }
    },
    dynamics: {
      title: "Dinamik Simülasyon",
      pageTitle: "Dinamik Simülasyon",
      pageDesc: "Reaktör sistemlerinin zamana bağlı davranışı",
      reactorType: "Reaktör Tipi",
      cstr: "CSTR",
      pfr: "PFR",
      k1: "İleri Reaksiyon Sabiti (k₁)",
      initialConc: "Başlangıç Konsantrasyonu",
      flowRate: "Akış Hızı (L/s)",
      concTab: "Konsantrasyon",
      convTab: "Dönüşüm",
      view3d: "3D Görünüm"
    },
    optimization: {
      title: "Reaktör Optimizasyonu",
      pageTitle: "Reaktör Optimizasyonu",
      pageDesc: "Çok parametreli reaktör optimizasyonu",
      objective: "Optimizasyon Hedefi",
      maxConversion: "Maksimum Dönüşüm",
      maxSelectivity: "Maksimum Seçicilik",
      minCost: "Minimum Maliyet",
      constraints: "Kısıtlamalar",
      tempLimit: "Sıcaklık Limiti",
      pressLimit: "Basınç Limiti",
      optimize: "Optimize Et",
      paretoTab: "Pareto",
      surfaceTab: "Yüzey",
      sensitivityTab: "Duyarlılık"
    },
    history: {
      title: "Hesaplama Geçmişi",
      pageTitle: "Hesaplama Geçmişi",
      pageDesc: "Önceki hesaplamaları görüntüleyin ve karşılaştırın",
      filter: "Filtrele",
      all: "Tümü",
      reactorCalc: "Reaktör Hesaplamaları",
      chemicalCalc: "Kimyasal Denge",
      heatCalc: "Isı Transferi",
      dateRange: "Tarih Aralığı",
      allTime: "Tüm Zamanlar",
      today: "Bugün",
      thisWeek: "Bu Hafta",
      thisMonth: "Bu Ay",
      clearAll: "Geçmişi Temizle",
      export: "Dışa Aktar",
      delete: "Sil",
      noRecords: "Henüz kayıt bulunmuyor",
      confirmClear: "Tüm geçmiş silinecek. Emin misiniz?"
    }
  },
  en: {
    nav: {
      home: "Home",
      reactor: "Reactor Design",
      chemical: "Chemical Equilibrium",
      heat: "Heat Transfer",
      dynamics: "Dynamic Simulation",
      optimization: "Reactor Optimization",
      history: "Calculation History"
    },
    common: {
      calculate: "Calculate",
      reset: "Reset",
      start: "Start",
      pause: "Pause",
      temperature: "Temperature",
      volume: "Volume",
      concentration: "Concentration",
      conversion: "Conversion",
      title: "Chemical Engineering Calculations"
    },
    index: {
      mainTitle: "Chemical Engineering Calculations",
      subtitle: "Tools for reactor design, chemical equilibrium and heat transfer calculations",
      reactorTitle: "Reactor Design",
      reactorDesc: "Design calculations for PFR, CSTR and other reactor types",
      chemicalTitle: "Chemical Equilibrium",
      chemicalDesc: "Equilibrium constants and concentration calculations",
      heatTitle: "Heat Transfer",
      heatDesc: "Heat exchangers and reactor heat transfer calculations",
      dynamicsTitle: "Dynamic Simulation",
      dynamicsDesc: "Dynamic behavior analysis of reactor systems"
    },
    // Her sayfa için özel çeviriler
    reactor: {
      title: "Reactor Design",
      pageTitle: "Reactor Design",
      pageDesc: "Design calculations for different reactor types",
      type: "Reactor Type",
      pfr: "Plug Flow Reactor (PFR)",
      cstr: "Continuous Stirred Tank Reactor (CSTR)",
      pbr: "Packed Bed Reactor (PBR)",
      flowRate: "Flow Rate (L/s)",
      concentration: "Inlet Concentration (mol/L)",
      reactionRate: "Reaction Rate Constant (1/s)",
      targetConversion: "Target Conversion",
      view3d: "3D View",
      viewProfile: "Profile",
      results: {
        volume: "Calculated Volume",
        residence: "Residence Time",
        conversion: "Conversion"
      }
    },
    chemical: {
      title: "Chemical Equilibrium Calculations",
      pageTitle: "Chemical Equilibrium Calculations",
      pageDesc: "Reaction equilibrium constants and concentration calculations",
      reactionType: "Reaction Type",
      reaction1: "A ⇌ B",
      reaction2: "A + B ⇌ C",
      reaction3: "2A ⇌ B",
      k1: "Forward Reaction Rate (k₁)",
      k_1: "Reverse Reaction Rate (k₋₁)",
      initialConc: "Initial [A] (mol/L)",
      concTab: "Concentration",
      eqTab: "Equilibrium",
      plotTitle: "Concentration vs. Time",
      xAxis: "Time (s)",
      yAxis: "Concentration (mol/L)"
    },
    heat: {
      title: "Heat Transfer",
      pageTitle: "Heat Transfer Calculations",
      pageDesc: "Heat transfer analysis in reactor systems",
      reactorType: "Reactor Type",
      pfr: "Plug Flow Reactor",
      cstr: "Continuous Stirred Tank Reactor",
      inletTemp: "Inlet Temperature (°C)",
      coolantTemp: "Coolant Temperature (°C)",
      reactionHeat: "Heat of Reaction (kJ/mol)",
      heatTransfer: "Heat Transfer Coefficient (W/m²K)",
      tempProfile: "Temperature Profile",
      view3d: "3D View",
      results: {
        maxTemp: "Maximum Temperature",
        heatDuty: "Heat Duty",
        conversion: "Conversion"
      }
    },
    dynamics: {
      title: "Dynamic Simulation",
      pageTitle: "Dynamic Simulation",
      pageDesc: "Time-dependent behavior of reactor systems",
      reactorType: "Reactor Type",
      cstr: "CSTR",
      pfr: "PFR",
      k1: "Forward Reaction Rate (k₁)",
      initialConc: "Initial Concentration",
      flowRate: "Flow Rate (L/s)",
      concTab: "Concentration",
      convTab: "Conversion",
      view3d: "3D View"
    },
    optimization: {
      title: "Reactor Optimization",
      pageTitle: "Reactor Optimization",
      pageDesc: "Multi-parameter reactor optimization",
      objective: "Optimization Objective",
      maxConversion: "Maximum Conversion",
      maxSelectivity: "Maximum Selectivity",
      minCost: "Minimum Cost",
      constraints: "Constraints",
      tempLimit: "Temperature Limit",
      pressLimit: "Pressure Limit",
      optimize: "Optimize",
      paretoTab: "Pareto",
      surfaceTab: "Surface",
      sensitivityTab: "Sensitivity"
    },
    history: {
      title: "Calculation History",
      pageTitle: "Calculation History",
      pageDesc: "View and compare previous calculations",
      filter: "Filter",
      all: "All",
      reactorCalc: "Reactor Calculations",
      chemicalCalc: "Chemical Equilibrium",
      heatCalc: "Heat Transfer",
      dateRange: "Date Range",
      allTime: "All Time",
      today: "Today",
      thisWeek: "This Week",
      thisMonth: "This Month",
      clearAll: "Clear History",
      export: "Export",
      delete: "Delete",
      noRecords: "No records found",
      confirmClear: "All history will be deleted. Are you sure?"
    }
  }
};

// Dil değiştirme fonksiyonu
function changeLanguage(lang) {
  localStorage.setItem('preferredLanguage', lang);
  translatePage(lang);
}

// Sayfa çeviri fonksiyonu
function translatePage(lang) {
  document.querySelectorAll('[data-translate]').forEach(element => {
    const key = element.getAttribute('data-translate');
    const keys = key.split('.');
    let translation = translations[lang];
    
    for (const k of keys) {
      translation = translation[k];
    }
    
    if (translation) {
      if (element.tagName === 'INPUT' && element.getAttribute('placeholder')) {
        element.placeholder = translation;
      } else {
        element.textContent = translation;
      }
    }
  });
}

// Sayfa yüklendiğinde tercih edilen dili kullan
document.addEventListener('DOMContentLoaded', () => {
  const preferredLanguage = localStorage.getItem('preferredLanguage') || 'tr';
  document.getElementById('languageSelect').value = preferredLanguage;
  translatePage(preferredLanguage);
}); 