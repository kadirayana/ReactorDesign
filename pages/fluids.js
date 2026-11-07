import { useMemo, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import {
  PageHeader, Section, FormGrid, Field, SelectField, ButtonRow, Alert,
  StatGrid, Stat, EmptyState, fmt,
} from '../components/ui';
import { pumpSystem, FLUIDS, ROUGHNESS, FITTINGS } from '../src/lib/fluids';
import { saveHistory } from '../src/lib/history';

const ChartClient = dynamic(() => import('../components/ChartClient'), { ssr: false });

const REGIME = { laminar: 'Laminer', transition: 'Geçiş', turbulent: 'Türbülanslı' };

// m → mm without floating-point noise (0.045e-3 * 1000 = 0.045000000000000005)
const toMm = m => Number((m * 1000).toPrecision(6));

const initialFittings = { elbow90: 4, elbow45: 0, teeBranch: 0, gateValve: 2, globeValve: 0, checkValve: 1, entrance: 1, exit: 1 };

export default function FluidsPage() {
  const [inp, setInp] = useState({
    fluid: 'water20', rho: FLUIDS.water20.rho, mu: FLUIDS.water20.mu, pv: FLUIDS.water20.pv / 1000,
    material: 'commercialSteel', epsMm: toMm(ROUGHNESS.commercialSteel.eps),
    Qm3h: 18, Dmm: 52.5, L: 120,
    dz: 15, dPkPa: 0, efficiency: 70,
    PskPa: 101.325, zs: 2, Ls: 6, sumKs: 0.5, npshr: 3,
    pumpH0: 45, pumpQmax: 40,
  });
  const [fittings, setFittings] = useState(initialFittings);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const onChange = e => {
    const { name, value, type } = e.target;
    setInp(prev => {
      const next = { ...prev, [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value };
      if (name === 'fluid' && FLUIDS[value]) Object.assign(next, { rho: FLUIDS[value].rho, mu: FLUIDS[value].mu, pv: FLUIDS[value].pv / 1000 });
      if (name === 'material' && ROUGHNESS[value]) next.epsMm = toMm(ROUGHNESS[value].eps);
      return next;
    });
  };

  const sumK = Object.entries(fittings).reduce((s, [k, n]) => s + (Number(n) || 0) * FITTINGS[k].K, 0);

  function calculate(e) {
    e?.preventDefault();
    setError('');
    try {
      const Q = inp.Qm3h / 3600;
      const res = pumpSystem({
        Q,
        D: inp.Dmm / 1000,
        L: inp.L,
        eps: inp.epsMm / 1000,
        rho: inp.rho,
        mu: inp.mu,
        pv: inp.pv * 1000,
        sumK,
        dz: inp.dz,
        dP: inp.dPkPa * 1000,
        efficiency: inp.efficiency / 100,
        Ps: inp.PskPa * 1000,
        zs: inp.zs,
        Ls: inp.Ls,
        sumKs: inp.sumKs,
        npshr: inp.npshr === '' ? null : inp.npshr,
        pumpH0: inp.pumpH0 || null,
        pumpQmax: inp.pumpQmax ? inp.pumpQmax / 3600 : null,
      });
      setResult({ ...res, sumK, inputs: { ...inp } });
      saveHistory('Boru hattı ve pompa', { Q: `${inp.Qm3h} m³/h`, D: `${inp.Dmm} mm`, L: `${inp.L} m` }, `H = ${fmt(res.H, 2)} m, P = ${fmt(res.shaftPower / 1000, 2)} kW`);
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  }

  const chart = useMemo(() => {
    if (!result) return null;
    const datasets = [{ label: 'Sistem eğrisi', data: result.curve.map(p => ({ x: p.Q * 3600, y: p.system })), showLine: true, pointRadius: 0 }];
    if (result.curve[0].pump != null) {
      datasets.push({ label: 'Pompa eğrisi', data: result.curve.filter(p => p.pump >= 0).map(p => ({ x: p.Q * 3600, y: p.pump })), showLine: true, pointRadius: 0 });
    }
    datasets.push({ label: 'Tasarım noktası', data: [{ x: result.inputs.Qm3h, y: result.H }], pointRadius: 7, pointStyle: 'rectRot' });
    if (result.operating) datasets.push({ label: 'Çalışma noktası', data: [{ x: result.operating.Q * 3600, y: result.operating.H }], pointRadius: 7, pointStyle: 'circle' });
    return { datasets };
  }, [result]);

  const velocityWarning = result && (result.V > 3 ? 'Hız 3 m/s’nin üzerinde: erozyon ve gürültü riski, daha büyük çap düşünün.' : result.V < 0.5 ? 'Hız 0,5 m/s’nin altında: boru gereğinden büyük olabilir.' : null);

  return (
    <>
      <Head><title>Boru Hattı ve Pompa · Kimya Mühendisliği Hesaplama Platformu</title></Head>
      <div className="page-container">
        <PageHeader
          eyebrow="Akışkanlar Mekaniği"
          title="Boru Hattı ve Pompa Seçimi"
          lead="Darcy–Weisbach ve Colebrook–White ile basınç kaybı, armatür kayıpları, gerekli pompa basma yüksekliği ve gücü, NPSH kontrolü ve sistem–pompa eğrisi kesişimi."
        />
        <form onSubmit={calculate} noValidate>
          <div className="split split-even">
            <div>
              <Section title="Akışkan ve boru" icon="🛢️">
                <FormGrid>
                  <SelectField label="Akışkan" name="fluid" value={inp.fluid} onChange={onChange}
                    options={[...Object.entries(FLUIDS).map(([value, f]) => ({ value, label: f.label })), { value: 'custom', label: 'Özel' }]} />
                  <SelectField label="Boru malzemesi" name="material" value={inp.material} onChange={onChange}
                    options={[...Object.entries(ROUGHNESS).map(([value, r]) => ({ value, label: r.label })), { value: 'custom', label: 'Özel' }]} />
                  <Field label="Yoğunluk ρ" unit="kg/m³" name="rho" value={inp.rho} onChange={onChange} disabled={inp.fluid !== 'custom'} />
                  <Field label="Viskozite μ" unit="Pa·s" name="mu" value={inp.mu} onChange={onChange} disabled={inp.fluid !== 'custom'} />
                  <Field label="Buhar basıncı Pᵥ" unit="kPa" name="pv" value={inp.pv} onChange={onChange} disabled={inp.fluid !== 'custom'} />
                  <Field label="Pürüzlülük ε" unit="mm" name="epsMm" value={inp.epsMm} onChange={onChange} disabled={inp.material !== 'custom'} />
                  <Field label="Debi Q" unit="m³/h" name="Qm3h" value={inp.Qm3h} onChange={onChange} />
                  <Field label="Boru iç çapı D" unit="mm" name="Dmm" value={inp.Dmm} onChange={onChange} hint="2″ Sch 40 ≈ 52,5 mm" />
                  <Field label="Toplam boru boyu L" unit="m" name="L" value={inp.L} onChange={onChange} />
                  <Field label="Kot farkı Δz" unit="m" name="dz" value={inp.dz} onChange={onChange} hint="Basma yüzeyi − emme yüzeyi" />
                  <Field label="Basınç farkı ΔP" unit="kPa" name="dPkPa" value={inp.dPkPa} onChange={onChange} hint="Varış − kaynak tankı" />
                  <Field label="Pompa verimi η" unit="%" name="efficiency" value={inp.efficiency} onChange={onChange} />
                </FormGrid>
              </Section>
            </div>
            <div>
              <Section title="Armatürler" icon="🔩" description={`Toplam ΣK = ${fmt(sumK, 2)}`}>
                <FormGrid>
                  {Object.entries(FITTINGS).map(([key, fit]) => (
                    <Field key={key} label={fit.label} unit={`K=${String(fit.K).replace('.', ',')}`} name={key} value={fittings[key]}
                      onChange={e => setFittings(prev => ({ ...prev, [key]: e.target.value === '' ? '' : Math.max(0, Math.round(Number(e.target.value))) }))} step={1} min={0} />
                  ))}
                </FormGrid>
              </Section>
              <Section title="Emme tarafı ve pompa" icon="🌀">
                <FormGrid>
                  <Field label="Emme yüzeyi basıncı" unit="kPa (mutlak)" name="PskPa" value={inp.PskPa} onChange={onChange} />
                  <Field label="Sıvı seviyesi − pompa ekseni" unit="m" name="zs" value={inp.zs} onChange={onChange} hint="Emme yüksekliğinde negatif" />
                  <Field label="Emme hattı boyu" unit="m" name="Ls" value={inp.Ls} onChange={onChange} />
                  <Field label="Emme hattı ΣK" name="sumKs" value={inp.sumKs} onChange={onChange} />
                  <Field label="Pompa NPSHr" unit="m" name="npshr" value={inp.npshr} onChange={onChange} hint="Üretici verisi" />
                  <Field label="Pompa kapalı vana basıncı H₀" unit="m" name="pumpH0" value={inp.pumpH0} onChange={onChange} hint="İsteğe bağlı" />
                  <Field label="Pompa maks. debisi" unit="m³/h" name="pumpQmax" value={inp.pumpQmax} onChange={onChange} hint="H = H₀[1 − (Q/Qmaks)²]" />
                </FormGrid>
                <ButtonRow><button type="submit">Hesapla</button></ButtonRow>
              </Section>
            </div>
          </div>
        </form>

        {error && <Alert type="error">{error}</Alert>}

        {!result ? (
          <EmptyState icon="🌀" title="Basınç kaybı, pompa gücü ve NPSH burada görünecek" />
        ) : (
          <>
            <Section title="Boru hattı" icon="📊" description={`Rejim: ${REGIME[result.regime]}`}>
              <StatGrid>
                <Stat label="Akış hızı V" value={result.V} unit="m/s" digits={2} />
                <Stat label="Reynolds Re" value={result.Re} digits={0} />
                <Stat label="Sürtünme faktörü f" value={result.f} digits={5} />
                <Stat label="Düz boru kaybı h_f" value={result.hf} unit="m" digits={2} />
                <Stat label="Armatür kaybı h_m" value={result.hm} unit="m" digits={2} />
                <Stat label="Basınç kaybı ΔP" value={result.dP / 1000} unit="kPa" digits={1} />
              </StatGrid>
              {velocityWarning && <Alert type="warning">{velocityWarning}</Alert>}
              {result.regime === 'transition' && <Alert type="warning">Re 2300–4000 geçiş bölgesinde; sürtünme faktörü belirsizdir.</Alert>}
            </Section>

            <Section title="Pompa" icon="🌀">
              <StatGrid>
                <Stat primary label="Gerekli basma yüksekliği H" value={result.H} unit="m" digits={2} />
                <Stat primary label="Mil gücü" value={result.shaftPower / 1000} unit="kW" digits={2} />
                <Stat label="Hidrolik güç" value={result.hydraulicPower / 1000} unit="kW" digits={2} />
                <Stat label="Statik yükseklik" value={result.staticHead} unit="m" digits={2} />
                <Stat label="NPSHa" value={result.npsha} unit="m" digits={2} />
                {result.npshMargin != null && <Stat label="NPSH marjı" value={result.npshMargin} unit="m" digits={2} />}
              </StatGrid>
              {result.npshMargin != null && result.npshMargin < 0.5 && (
                <Alert type="error">NPSHa, NPSHr’nin en az 0,5–1 m üzerinde olmalı; kavitasyon riski. Emme hattını kısaltın, tank seviyesini yükseltin veya sıvıyı soğutun.</Alert>
              )}
              {result.npshMargin != null && result.npshMargin >= 0.5 && <Alert type="success">NPSH marjı yeterli.</Alert>}
              {result.operating && (
                <p className="small">Verilen pompa eğrisiyle çalışma noktası: <strong>{fmt(result.operating.Q * 3600, 2)} m³/h</strong>, <strong>{fmt(result.operating.H, 2)} m</strong>.</p>
              )}
            </Section>

            <Section title="Sistem ve pompa eğrileri" icon="📈">
              <ChartClient type="scatter" data={chart} xLabel="Debi Q [m³/h]" yLabel="Basma yüksekliği H [m]" height={380} options={{ interaction: { mode: 'nearest', intersect: false } }} />
            </Section>
          </>
        )}
      </div>
    </>
  );
}
