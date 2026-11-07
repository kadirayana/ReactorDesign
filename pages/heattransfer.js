import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import {
  PageHeader, Section, FormGrid, Field, SelectField, ButtonRow, Alert,
  StatGrid, Stat, EmptyState, Tabs, fmt,
} from '../components/ui';
import { calculateHeatTransfer, conduction, effectivenessNTU } from '../src/lib/heattransfer';
import { saveHistory } from '../src/lib/history';
import ConvectionCalculator from '../components/ConvectionCalculator';
import RadiationCalculator from '../components/RadiationCalculator';

const ChartClient = dynamic(() => import('../components/ChartClient'), { ssr: false });

function numberHandler(setter) {
  return e => {
    const { name, value } = e.target;
    setter(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
  };
}

export default function HeatTransferPage() {
  const [tab, setTab] = useState('conduction');
  return (
    <>
      <Head><title>Isı Transferi · Kimya Mühendisliği Hesaplama Platformu</title></Head>
      <div className="page-container">
        <PageHeader
          eyebrow="Isı ve Kütle Transferi"
          title="Isı Transferi"
          lead="Kararlı hâl iletim, taşınım korelasyonları, gri cisim ışınımı ve ters akışlı ısı değiştirici (LMTD ve ε-NTU) hesapları."
        />
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'conduction', label: 'İletim' },
            { value: 'convection', label: 'Taşınım' },
            { value: 'radiation', label: 'Işınım' },
            { value: 'exchanger', label: 'Isı değiştirici' },
          ]}
        />
        {tab === 'conduction' && <ConductionCalculator />}
        {tab === 'convection' && <ConvectionCalculator />}
        {tab === 'radiation' && <RadiationCalculator />}
        {tab === 'exchanger' && <ExchangerCalculator />}
      </div>
    </>
  );
}

const GEOMETRY_LABEL = { wall: 'Düz duvar', cylinder: 'Silindirik kabuk', sphere: 'Küresel kabuk' };

function ConductionCalculator() {
  const [geometry, setGeometry] = useState('wall');
  const [inputs, setInputs] = useState({ L: 0.1, A: 1, r1: 0.05, r2: 0.1, k: 0.6, T1: 100, T2: 25 });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const onChange = numberHandler(setInputs);

  function calculate(e) {
    e?.preventDefault();
    setError('');
    try {
      const res = conduction({ geometry, ...inputs });
      setResult({ ...res, geometry });
      saveHistory('Isı iletimi', { Geometri: GEOMETRY_LABEL[geometry], k: `${inputs.k} W/(m·K)`, 'T₁': inputs.T1, 'T₂': inputs.T2 }, `Q = ${fmt(res.Q, 2)} W`);
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  }

  return (
    <div className="split">
      <form onSubmit={calculate} noValidate>
        <Section title="Geometri ve malzeme" icon="🧱">
          <FormGrid>
            <SelectField className="span-all" label="Geometri" value={geometry} onChange={e => { setGeometry(e.target.value); setResult(null); }}
              options={Object.entries(GEOMETRY_LABEL).map(([value, label]) => ({ value, label }))} />
            {geometry === 'wall' && (
              <>
                <Field label="Kalınlık L" unit="m" name="L" value={inputs.L} onChange={onChange} />
                <Field label="Alan A" unit="m²" name="A" value={inputs.A} onChange={onChange} />
              </>
            )}
            {geometry !== 'wall' && (
              <>
                <Field label="İç yarıçap r₁" unit="m" name="r1" value={inputs.r1} onChange={onChange} />
                <Field label="Dış yarıçap r₂" unit="m" name="r2" value={inputs.r2} onChange={onChange} />
              </>
            )}
            {geometry === 'cylinder' && <Field label="Uzunluk L" unit="m" name="L" value={inputs.L} onChange={onChange} />}
            <Field label="Isıl iletkenlik k" unit="W/(m·K)" name="k" value={inputs.k} onChange={onChange} />
            <Field label={geometry === 'wall' ? 'Sıcak yüz T₁' : 'İç yüzey T₁'} unit="°C" name="T1" value={inputs.T1} onChange={onChange} />
            <Field label={geometry === 'wall' ? 'Soğuk yüz T₂' : 'Dış yüzey T₂'} unit="°C" name="T2" value={inputs.T2} onChange={onChange} />
          </FormGrid>
          <ButtonRow><button type="submit">Hesapla</button></ButtonRow>
        </Section>
      </form>
      <div>
        {error && <Alert type="error">{error}</Alert>}
        {!result ? <EmptyState icon="🔥" title="Isı akısı ve sıcaklık profili burada görünecek" /> : (
          <>
            <Section title="Sonuçlar" icon="📊" description={GEOMETRY_LABEL[result.geometry]}>
              <StatGrid>
                <Stat primary label="Isı akış hızı Q" value={result.Q} unit="W" digits={2} />
                <Stat label="Isıl direnç R" value={result.R} unit="K/W" digits={5} />
              </StatGrid>
              <div className="formula">
                {result.geometry === 'wall' && 'R = L / (k·A)'}
                {result.geometry === 'cylinder' && 'R = ln(r₂/r₁) / (2π·k·L)'}
                {result.geometry === 'sphere' && 'R = (1/r₁ − 1/r₂) / (4π·k)'}
                {'   ·   Q = (T₁ − T₂) / R'}
              </div>
            </Section>
            <Section title="Sıcaklık profili" icon="📈">
              <ChartClient
                data={{ labels: result.profile.map(p => Number(p.x.toFixed(4))), datasets: [{ label: 'T', data: result.profile.map(p => p.T) }] }}
                xLabel={result.geometry === 'wall' ? 'x [m]' : 'r [m]'}
                yLabel="Sıcaklık [°C]"
              />
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function ExchangerCalculator() {
  const [method, setMethod] = useState('lmtd');
  const [inputs, setInputs] = useState({ U: 500, A: 10, Th_in: 150, Th_out: 100, Tc_in: 30, Tc_out: 80, Ch: 2000, Cc: 2500 });
  const onChange = numberHandler(setInputs);

  // Both methods are cheap: recompute live while typing
  const lmtd = useMemo(() => calculateHeatTransfer({ ...inputs, points: 60 }), [inputs]);
  const ntu = useMemo(() => {
    try { return { ok: true, ...effectivenessNTU(inputs) }; } catch (e) { return { ok: false, error: e.message }; }
  }, [inputs]);

  const profileChart = useMemo(() => {
    if (method !== 'lmtd' || lmtd.error) return null;
    return {
      labels: lmtd.profiles.x.map(x => `${Math.round(x * 100)}%`),
      datasets: [
        { label: 'Sıcak akışkan', data: lmtd.profiles.Th },
        { label: 'Soğuk akışkan', data: lmtd.profiles.Tc },
        { label: 'ΔT', data: lmtd.profiles.dT, borderDash: [6, 4] },
      ],
    };
  }, [lmtd, method]);

  return (
    <div className="split">
      <Section title="Ters akışlı ısı değiştirici" icon="🔁">
        <FormGrid>
          <SelectField className="span-all" label="Yöntem" value={method} onChange={e => setMethod(e.target.value)}
            options={[
              { value: 'lmtd', label: 'LMTD — dört uç sıcaklığı biliniyor' },
              { value: 'ntu', label: 'ε-NTU — çıkış sıcaklıkları bilinmiyor' },
            ]} />
          <Field label="Toplam ısı transfer katsayısı U" unit="W/(m²·K)" name="U" value={inputs.U} onChange={onChange} />
          <Field label="Alan A" unit="m²" name="A" value={inputs.A} onChange={onChange} />
          <Field label="Sıcak giriş" unit="°C" name="Th_in" value={inputs.Th_in} onChange={onChange} />
          {method === 'lmtd' && <Field label="Sıcak çıkış" unit="°C" name="Th_out" value={inputs.Th_out} onChange={onChange} />}
          <Field label="Soğuk giriş" unit="°C" name="Tc_in" value={inputs.Tc_in} onChange={onChange} />
          {method === 'lmtd' && <Field label="Soğuk çıkış" unit="°C" name="Tc_out" value={inputs.Tc_out} onChange={onChange} />}
          {method === 'ntu' && (
            <>
              <Field label="Sıcak ısıl kapasite debisi ṁcₚ" unit="W/K" name="Ch" value={inputs.Ch} onChange={onChange} />
              <Field label="Soğuk ısıl kapasite debisi ṁcₚ" unit="W/K" name="Cc" value={inputs.Cc} onChange={onChange} />
            </>
          )}
        </FormGrid>
        <p className="small muted" style={{ marginTop: 12 }}>Sonuçlar yazdıkça güncellenir.</p>
      </Section>

      <div>
        {method === 'lmtd' && (lmtd.error ? <Alert type="error">{lmtd.error}</Alert> : (
          <>
            <Section title="Sonuçlar" icon="📊">
              <StatGrid>
                <Stat primary label="Isı yükü Q" value={lmtd.Q / 1000} unit="kW" digits={2} />
                <Stat label="LMTD" value={lmtd.LMTD} unit="°C" digits={2} />
                <Stat label="ΔT₁ (sıcak giriş ucu)" value={lmtd.deltaT1} unit="°C" digits={2} />
                <Stat label="ΔT₂ (sıcak çıkış ucu)" value={lmtd.deltaT2} unit="°C" digits={2} />
              </StatGrid>
              <p className="small muted">Q = U·A·LMTD. Girilen dört sıcaklık akışların enerji dengesiyle tutarlı olmalıdır.</p>
            </Section>
            <Section title="Değiştirici boyunca sıcaklıklar" icon="📈" description="x = 0: sıcak akışkan girişi">
              <ChartClient data={profileChart} xLabel="Isı transfer alanı" yLabel="Sıcaklık [°C]" />
            </Section>
          </>
        ))}
        {method === 'ntu' && (!ntu.ok ? <Alert type="error">{ntu.error}</Alert> : (
          <Section title="Sonuçlar" icon="📊">
            <StatGrid>
              <Stat primary label="Isı yükü Q" value={ntu.Q / 1000} unit="kW" digits={2} />
              <Stat label="Etkinlik ε" value={ntu.eps} digits={4} />
              <Stat label="NTU" value={ntu.NTU} digits={3} />
              <Stat label="Cr = Cmin/Cmax" value={ntu.Cr} digits={3} />
              <Stat label="Sıcak çıkış" value={ntu.Th_out} unit="°C" digits={2} />
              <Stat label="Soğuk çıkış" value={ntu.Tc_out} unit="°C" digits={2} />
            </StatGrid>
            <div className="formula">ε = [1 − e^(−NTU(1−Cr))] / [1 − Cr·e^(−NTU(1−Cr))]   ·   Q = ε·Cmin·(Th,in − Tc,in)</div>
          </Section>
        ))}
      </div>
    </div>
  );
}
