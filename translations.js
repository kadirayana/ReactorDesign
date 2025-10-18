// Language translations for ReactorDesign pages
const translations = {
    nav: {
        en: {
            home: "Home",
            reactorDesign: "Reactor Design",
            customReactor: "Custom Reactor",
            chemicalEquilibrium: "Chemical Equilibrium",
            heatTransfer: "Heat Transfer",
            heatIntegration: "Heat Integration",
            dynamicSimulation: "Dynamic Simulation",
            calculationHistory: "Calculation History",
            vaporizerDesign: "Vaporizer Design"
        },
        tr: {
            home: "Ana Sayfa",
            reactorDesign: "Reaktör Tasarım",
            customReactor: "Özelleştirilebilir Reaktör",
            chemicalEquilibrium: "Kimyasal Denge",
            heatTransfer: "Isı Transferi",
            heatIntegration: "Isı Entegrasyonu",
            dynamicSimulation: "Dinamik Simülasyon",
            calculationHistory: "Hesaplama Geçmişi",
            vaporizerDesign: "Vaporizer Tasarım"
        }
    },
    common: {
        en: {
            calculate: "Calculate",
            result: "Result",
            note: "Note",
            steps: "Steps",
            productInfo: "Product Information",
            reactantInfo: "Reactant Information",
            processConditions: "Process Conditions",
            reactionKinetics: "Reaction Kinetics Parameters",
            feedAndStoichiometry: "Feed and Stoichiometry"
        },
        tr: {
            calculate: "Hesapla",
            result: "Sonuç",
            note: "Not",
            steps: "Adımlar",
            productInfo: "Ürün Bilgileri",
            reactantInfo: "Reaktan Bilgileri",
            processConditions: "Proses Koşulları",
            reactionKinetics: "Reaksiyon Kinetiği Parametreleri",
            feedAndStoichiometry: "Feed ve Stoikiometri"
        }
    },
    heatIntegration: {
        en: {
            title: "Heat Integration Calculation",
            description: "In this application, HCFR and inlet/outlet temperatures are entered for two cold streams and two hot streams, and ΔTmin value is defined. The calculation performs composite heat integration analysis using shifted temperatures; pinch point, minimum external (hot utility) and cold utility loads are calculated.",
            deltaTmin: "ΔTmin (°C)",
            coldStreams: "Cold Streams",
            hotStreams: "Hot Streams",
            stream: "Stream",
            heatCapacityFlow: "Heat Capacity Flow (HCFR, kJ/s°C)",
            inletTemp: "Inlet Temperature (°C)",
            outletTemp: "Outlet Temperature (°C)",
            calculate: "Calculate",
            results: "Results",
            pinchPoint: "Pinch Point",
            minHotUtility: "Minimum Hot Utility",
            minColdUtility: "Minimum Cold Utility",
            shiftedTemps: "Shifted Temperatures and Cascade Values",
            temperatureProfiles: "Temperature Profiles",
            temperature: "Temperature (°C)",
            calculationSteps: "Calculation Steps (Summary)",
            step1: "1. Calculate ΔTmin/2 value (shift).",
            step2: "2. Add shift to cold stream temperatures, subtract from hot stream temperatures.",
            step3: "3. Take all shifted temperatures uniquely and sort from high to low.",
            step4: "4. Sum heat capacity flows of active streams in each temperature interval (hot: positive, cold: negative).",
            step5: "5. Calculate cascading heat flow using cascade method, find minimum value (indicates pinch point).",
            step6: "6. If minimum value is negative, its absolute value is hot utility, final value is cold utility.",
            step7: "7. Original pinch temperature is found by subtracting shift from shifted value."
        },
        tr: {
            title: "Isı Entegrasyonu Hesaplaması",
            description: "Bu uygulamada, iki soğuk akış ve iki sıcak akış için HCFR ve giriş/çıkış sıcaklıkları girilerek, ΔTmin değeri tanımlanır. Hesaplama, kaydırılmış sıcaklıklar kullanılarak composite (bileşik) ısı entegrasyonu analizini gerçekleşir; pinç noktası, minimum harici (hot utility) ve soğuk yardımcı (cold utility) yükleri hesaplanır.",
            deltaTmin: "ΔTmin (°C)",
            coldStreams: "Soğuk Akışlar (Cold Streams)",
            hotStreams: "Sıcak Akışlar (Hot Streams)",
            stream: "Akış",
            heatCapacityFlow: "Isı Kapasite Akışı (HCFR, kJ/s°C)",
            inletTemp: "Giriş Sıcaklığı (°C)",
            outletTemp: "Çıkış Sıcaklığı (°C)",
            calculate: "Hesaplamayı Yap",
            results: "Sonuçlar",
            pinchPoint: "Pinç Noktası",
            minHotUtility: "Minimum Hot Utility",
            minColdUtility: "Minimum Cold Utility",
            shiftedTemps: "Kaydırılmış Sıcaklıklar ve Cascade Değerleri",
            temperatureProfiles: "Sıcaklık Profilleri",
            temperature: "Sıcaklık (°C)",
            calculationSteps: "Hesaplama Adımları (Özet)",
            step1: "1. ΔTmin/2 değeri (shift) hesaplanır.",
            step2: "2. Soğuk akışlar için giriş ve çıkış sıcaklıklarına shift eklenir, sıcak akışlar için çıkarılır.",
            step3: "3. Tüm kaydırılmış sıcaklıklar tekrarsız alınır ve büyükten küçüğe sıralanır.",
            step4: "4. Her sıcaklık aralığında, o aralıkta aktif olan akışların ısı kapasite akışları toplanır (sıcak: pozitif, soğuk: negatif).",
            step5: "5. Cascade yöntemiyle kademeli ısı akışı hesaplanır, minimum değer bulunur (pinç noktasını gösterir).",
            step6: "6. Eğer minimum değer negatifse, mutlak değeri hot utility olarak, son değeri ise cold utility olarak raporlanır.",
            step7: "7. Pinç noktasının orijinal sıcaklık değeri, kaydırılmış değerden shift çıkarılarak bulunur."
        }
    },
    dynamicSimulation: {
        en: {
            title: "Dynamic System Simulation",
            description: "This application allows you to simulate dynamic systems and analyze their behavior over time.",
            systemParameters: "System Parameters",
            simulationType: "Simulation Type:",
            dynamicSimType: "Dynamic Simulation (C(t)=C₀e^(–kt))",
            cstrSimType: "CSTR Simulation",
            pfrSimType: "PFR Simulation",
            equilibriumSimType: "Chemical Equilibrium Calculation",
            heatTransferSimType: "Heat Transfer Calculation",
            michaelisSimType: "Michaelis-Menten Kinetic Simulation",
            multicomponentSimType: "Multicomponent System Simulation (A→B)",
            initialConcentration: "Initial Concentration C₀:",
            rateConstant: "Rate Constant k [1/s]:",
            simulationTime: "Simulation Time [s] / Reactor Volume (V for PFR):",
            residenceTime: "Residence Time (τ) [s]:",
            volumetricFlow: "Volumetric Flow (Q) [m³/s]:",
            deltaG: "ΔG (kJ/mol):",
            temperature: "Temperature (T) [K]:",
            deltaT: "Temperature Difference (ΔT) [K]:",
            area: "Area (A) [m²]:",
            heatTransferCoeff: "Heat Transfer Coefficient (U) [W/m²K]:",
            Vmax: "Vmax:",
            Km: "Km:",
            runSimulation: "Start Simulation",
            status: "Status",
            simulationStarted: "Simulation started...",
            error: "Error",
            enterValidValues: "Please enter valid positive numerical values.",
            simulationGraph: "Simulation Graph",
            simulationData: "Simulation Data"
        },
        tr: {
            title: "Dinamik Sistem Simülasyonu",
            description: "Bu uygulama, dinamik sistemleri simüle etmenizi ve davranışlarını zaman içinde analiz etmenizi sağlar.",
            systemParameters: "Sistem Parametreleri",
            simulationType: "Simülasyon Türü:",
            dynamicSimType: "Dinamik Simülasyon (C(t)=C₀e^(–kt))",
            cstrSimType: "CSTR Simülasyonu",
            pfrSimType: "PFR Simülasyonu",
            equilibriumSimType: "Kimyasal Denge Hesaplaması",
            heatTransferSimType: "Isı Transfer Hesaplaması",
            michaelisSimType: "Michaelis-Menten Kinetik Simülasyonu",
            multicomponentSimType: "Çok Bileşenli Sistem Simülasyonu (A→B)",
            initialConcentration: "Başlangıç Konsantrasyonu C₀:",
            rateConstant: "Hız Sabiti k [1/s]:",
            simulationTime: "Simülasyon Süresi [s] / Reaktör Hacmi (PFR için V):",
            residenceTime: "Rezidans Zamanı (τ) [s]:",
            volumetricFlow: "Volumetrik Akış (Q) [m³/s]:",
            deltaG: "ΔG (kJ/mol):",
            temperature: "Sıcaklık (T) [K]:",
            deltaT: "Sıcaklık Farkı (ΔT) [K]:",
            area: "Alan (A) [m²]:",
            heatTransferCoeff: "Isı Transfer Katsayısı (U) [W/m²K]:",
            Vmax: "Vmax:",
            Km: "Km:",
            runSimulation: "Simülasyonu Başlat",
            status: "Durum",
            simulationStarted: "Simülasyon başladı...",
            error: "Hata",
            enterValidValues: "Lütfen geçerli pozitif sayısal değerler giriniz.",
            simulationGraph: "Simülasyon Grafiği",
            simulationData: "Simülasyon Verileri"
        }
    },
    home: {
        en: {
            title: "Home - Chemical Engineering Calculation Platform",
            platformTitle: "Complex Calculation Platform",
            introduction: "This platform is a comprehensive tool that enables you to perform various Chemical Engineering calculations. Our platform includes the following modules:",
            reactorDesignDesc: "This page provides comprehensive information on reactor design and visualization. Main topics include customizable reactors, chemical equilibrium, heat transfer, and dynamic simulation. Different reactor types (PFR, CSTR, PBR, batch) and reaction orders are covered in detail. Users can improve the design process by evaluating criteria such as economic analysis and basic reactor parameters. The page's user-friendly structure and visualization options enhance interaction and facilitate access to information.",
            customReactorDesc: "This page details the necessary calculations for designing customizable reactors. Users can perform calculations by entering product and reactant information, process conditions, and reaction kinetics parameters.",
            chemicalEquilibriumDesc: "This page provides the necessary tools for chemical equilibrium calculations. Users can perform calculations by selecting different reaction types (e.g., aA + bB ⇌ cC + dD) and determining stoichiometric coefficients.",
            heatTransferDesc: "This page provides the necessary tools to perform various heat transfer calculations. Users can perform calculations by selecting different heat transfer methods such as conduction, convection, and radiation.",
            heatIntegrationDesc: "This page provides the necessary calculations to perform heat integration analysis for two cold streams and two hot streams. Users can perform calculations by defining the ΔTmin value.",
            dynamicSimulationDesc: "This page provides the parameters and calculations necessary for dynamic system simulations. Users can perform simulations by selecting from various simulation types (dynamic simulation, CSTR, PFR, chemical equilibrium calculation, etc.).",
            vaporizerDesignDesc: "This page provides a platform for users to enter various data to perform the necessary calculations for a vaporizer design.",
            selectModule: "Select the section you need from the menu to perform the relevant calculations."
        },
        tr: {
            title: "Ana Sayfa - Kimya Mühendisliği Hesaplama Platformu",
            platformTitle: "Kompleks Hesaplama Platformu",
            introduction: "Bu platform, çeşitli Kimya mühendisliği hesaplamalarını gerçekleşirmenize olanak sağlayan kapsamlı bir araçtır. Platformumuz aşağıdaki modülleri içermektedir:",
            reactorDesignDesc: "Bu sayfa, reaktör tasarımı ve görselleştirmesi üzerine kapsamlı bilgiler sunmaktadır. Ana konular arasında özelleştirilebilir reaktörler, kimyasal denge, ısı transferi ve dinamik simülasyon yer almaktadır. Farklı reaktör tipleri (PFR, CSTR, PBR, batch) ve reaksiyon dereceleri detaylı bir şekilde ele alınmıştır. Kullanıcılar, ekonomik analiz ve temel reaktör parametreleri gibi kriterleri değerlendirerek tasarım sürecini geliştirebilir. Sayfanın kullanıcı dostu yapısı ve görselleştirme seçenekleri, etkileşimi artırmakta ve bilgiye erişimi kolaylaştırmaktadır.",
            customReactorDesc: "Bu sayfa, özelleştirilebilir reaktörlerin tasarımı için gerekli hesaplamaları detaylandırmaktadır. Kullanıcılar, ürün ve reaktan bilgilerini, proses koşullarını ve reaksiyon kinetiği parametrelerini girerek hesaplama yapabilirler.",
            chemicalEquilibriumDesc: "Bu sayfa, kimyasal denge hesaplamaları için gerekli araçları sunmaktadır. Kullanıcılar, farklı reaksiyon türlerini seçerek (örneğin, aA + bB ⇌ cC + dD) ve stokiyometrik katsayıları belirleyerek hesaplama yapabilirler.",
            heatTransferDesc: "Bu sayfa, ısı transferi ile ilgili çeşitli hesaplamaları gerçekleşirmek için gerekli araçları sunmaktadır. Kullanıcılar, ısı iletimi, taşınım ve ışınım gibi farklı ısı transfer yöntemlerini seçerek hesaplamalar yapabilirler.",
            heatIntegrationDesc: "Bu sayfa, iki soğuk akış ve iki sıcak akış için ısı entegrasyonu analizini gerçekleşirmek amacıyla gerekli hesaplamaları sunmaktadır. Kullanıcılar, ΔTmin değerini tanımlayarak hesaplama yapabilirler.",
            dynamicSimulationDesc: "Bu sayfa, dinamik sistem simülasyonları için gerekli parametreleri ve hesaplamaları sunmaktadır. Kullanıcılar, çeşitli simülasyon türleri arasından seçim yaparak (dinamik simülasyon, CSTR, PFR, kimyasal denge hesaplaması vb.) simülasyon gerçekleştirebilirler.",
            vaporizerDesignDesc: "Bu sayfa, bir vaporizer tasarımı için gerekli hesaplamaları gerçekleşirmek amacıyla kullanıcıya çeşitli veriler girmesi için bir platform sunmaktadır.",
            selectModule: "Menüden ihtiyacınız olan bölümü seçerek ilgili hesaplamaları gerçekleştirebilirsiniz."
        }
    },
    chemical: {
        en: {
            title: "Chemical Equilibrium Calculation",
            selectReactionType: "Select Reaction Type",
            stoichiometricCoefficients: "Stoichiometric Coefficients",
            coefficientA: "Coefficient A (a):",
            coefficientB: "Coefficient B (b):",
            coefficientC: "Coefficient C (c):",
            coefficientD: "Coefficient D (d):",
            inputParameters: "Input Parameters",
            initialConcA: "Initial Concentration A₀ [mol/L]:",
            initialConcB: "Initial Concentration B₀ [mol/L]:",
            initialConcC: "Initial Concentration C₀ [mol/L]:",
            initialConcD: "Initial Concentration D₀ [mol/L]:",
            equilibriumConstant: "Equilibrium Constant (K):",
            temperature: "Temperature [K]:",
            pressure: "Pressure [bar]:",
            calculationType: "Calculation Type:",
            calcTypeEquilibrium: "Calculate Equilibrium Concentrations",
            calcTypeTemperature: "Calculate Equilibrium Temperature",
            calcTypeThermodynamics: "Calculate Thermodynamic Parameters",
            results: "Results",
            reactionProgress: "Reaction Progress (ξ):",
            equilibriumTemp: "Equilibrium Temperature:",
            equilibriumConc: "Equilibrium Concentrations",
            component: "Component",
            initialConc: "Initial Concentration [mol/L]",
            equilibriumConc: "Equilibrium Concentration [mol/L]",
            thermoParams: "Thermodynamic Parameters",
            parameter: "Parameter",
            value: "Value",
            deltaG: "Gibbs Free Energy Change (ΔG) [kJ/mol]",
            deltaH: "Enthalpy Change (ΔH) [kJ/mol]",
            deltaS: "Entropy Change (ΔS) [J/(mol·K)]",
            concDistribution: "Concentration Distribution Graph"
        },
        tr: {
            title: "Kimyasal Denge Hesaplaması",
            selectReactionType: "Reaksiyon Tipi Seçin",
            stoichiometricCoefficients: "Stokiyometrik Katsayılar",
            coefficientA: "A Katsayısı (a):",
            coefficientB: "B Katsayısı (b):",
            coefficientC: "C Katsayısı (c):",
            coefficientD: "D Katsayısı (d):",
            inputParameters: "Giriş Parametreleri",
            initialConcA: "Başlangıç Konsantrasyonu A₀ [mol/L]:",
            initialConcB: "Başlangıç Konsantrasyonu B₀ [mol/L]:",
            initialConcC: "Başlangıç Konsantrasyonu C₀ [mol/L]:",
            initialConcD: "Başlangıç Konsantrasyonu D₀ [mol/L]:",
            equilibriumConstant: "Denge Sabiti (K):",
            temperature: "Sıcaklık [K]:",
            pressure: "Basınç [bar]:",
            calculationType: "Hesaplama Tipi:",
            calcTypeEquilibrium: "Denge Konsantrasyonlarını Hesapla",
            calcTypeTemperature: "Denge Sıcaklığını Hesapla",
            calcTypeThermodynamics: "Termodinamik Parametreleri Hesapla",
            results: "Sonuçlar",
            reactionProgress: "Reaksiyon İlerlemesi (ξ):",
            equilibriumTemp: "Denge Sıcaklığı:",
            equilibriumConc: "Denge Konsantrasyonları",
            component: "Bileşen",
            initialConc: "Başlangıç Konsantrasyonu [mol/L]",
            equilibriumConc: "Denge Konsantrasyonu [mol/L]",
            thermoParams: "Termodinamik Parametreler",
            parameter: "Parametre",
            value: "Değer",
            deltaG: "Gibbs Serbest Enerji Değişimi (ΔG) [kJ/mol]",
            deltaH: "Entalpi Değişimi (ΔH) [kJ/mol]",
            deltaS: "Entropi Değişimi (ΔS) [J/(mol·K)]",
            concDistribution: "Konsantrasyon Dağılım Grafiği"
        }
    },
    heatTransfer: {
        en: {
            title: "Heat Transfer Calculation",
            conduction: "Conduction",
            convection: "Convection",
            radiation: "Radiation",
            heatExchanger: "Heat Exchanger",
            conductionCalc: "Heat Conduction Calculation",
            geometryType: "Geometry Type:",
            straightWall: "Straight Wall",
            cylindrical: "Cylindrical",
            spherical: "Spherical",
            compositeWall: "Composite Wall",
            wallThickness: "Wall Thickness L [m]:",
            thermalConductivity: "Thermal Conductivity k [W/(m·K)]:",
            surfaceArea: "Surface Area A [m²]:",
            innerRadius: "Inner Radius r₁ [m]:",
            outerRadius: "Outer Radius r₂ [m]:",
            cylinderLength: "Cylinder Length L [m]:",
            firstSurfaceTemp: "First Surface Temperature T₁ [°C]:",
            secondSurfaceTemp: "Second Surface Temperature T₂ [°C]:",
            calculate: "Calculate and Visualize",
            results: "Results",
            heatFlux: "Heat Flux [W/m²]:",
            totalHeatTransfer: "Total Heat Transfer [W]:"
        },
        tr: {
            title: "Isı Transferi Hesaplaması",
            conduction: "İletim",
            convection: "Taşınım",
            radiation: "Işınım",
            heatExchanger: "Isı Değiştiricisi",
            conductionCalc: "Isı İletimi Hesaplaması",
            geometryType: "Geometri Tipi:",
            straightWall: "Düz Duvar",
            cylindrical: "Silindirik",
            spherical: "Küresel",
            compositeWall: "Çok Katmanlı Duvar",
            wallThickness: "Duvar Kalınlığı L [m]:",
            thermalConductivity: "Termal İletkenlik k [W/(m·K)]:",
            surfaceArea: "Yüzey Alanı A [m²]:",
            innerRadius: "İç Yarıçap r₁ [m]:",
            outerRadius: "Dış Yarıçap r₂ [m]:",
            cylinderLength: "Silindir Uzunluğu L [m]:",
            firstSurfaceTemp: "Birinci Yüzey Sıcaklığı T₁ [°C]:",
            secondSurfaceTemp: "İkinci Yüzey Sıcaklığı T₂ [°C]:",
            calculate: "Hesapla ve Görselleştir",
            results: "Sonuçlar",
            heatFlux: "Isı Akısı [W/m²]:",
            totalHeatTransfer: "Toplam Isı Transferi [W]:"
        }
    }
};

// Language switcher functionality
class LanguageSwitcher {
    constructor() {
        this.currentLang = localStorage.getItem('preferredLanguage') || 'tr';
        this.init();
    }

    init() {
        // Add language switch button to navigation
        const nav = document.querySelector('nav');
        const langBtn = document.createElement('a');
        langBtn.href = '#';
        langBtn.style.float = 'right';
        langBtn.textContent = this.currentLang === 'tr' ? 'English' : 'Türkçe';
        langBtn.onclick = (e) => {
            e.preventDefault();
            this.toggleLanguage();
        };
        nav.appendChild(langBtn);

        // Initial translation
        this.applyTranslations();
    }

    toggleLanguage() {
        this.currentLang = this.currentLang === 'tr' ? 'en' : 'tr';
        localStorage.setItem('preferredLanguage', this.currentLang);
        this.applyTranslations();
        location.reload();
    }

    applyTranslations() {
        // Update navigation links
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            const key = this.getKeyByValue(translations.nav[this.currentLang === 'tr' ? 'en' : 'tr'], link.textContent);
            if (key) {
                link.textContent = translations.nav[this.currentLang][key];
            }
        });

        // Update page content
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            const section = element.getAttribute('data-section') || 'common';
            if (translations[section]?.[this.currentLang]?.[key]) {
                if (element.tagName === 'INPUT' && element.type === 'submit') {
                    element.value = translations[section][this.currentLang][key];
                } else if (element.tagName === 'INPUT' && element.type === 'text') {
                    element.placeholder = translations[section][this.currentLang][key];
                } else {
                    element.textContent = translations[section][this.currentLang][key];
                }
            }
        });
    }

    getKeyByValue(object, value) {
        return Object.keys(object).find(key => object[key] === value);
    }
}

// Initialize language switcher when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LanguageSwitcher();
});