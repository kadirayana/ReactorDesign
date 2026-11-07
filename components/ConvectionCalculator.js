import React, { useState } from 'react';
import {
  Section, FormGrid, Field, SelectField, ButtonRow, Alert, StatGrid, Stat, EmptyState, fmt,
} from './ui';
import { computeConvection } from '../src/lib/convection';
import { saveHistory } from '../src/lib/history';

const MODES = [
  { value: 'forced-flat', label: 'Zorlanmış — düz levha üzerinde' },
  { value: 'forced-tube', label: 'Zorlanmış — boru içi akış' },
  { value: 'natural-vertical', label: 'Doğal — düşey levha' },
];

const REGIME = { laminar: 'Laminer', transition: 'Geçiş', turbulent: 'Türbülanslı', mixed: 'Karma (laminer + türbülanslı)' };

const CORRELATION = {
  'forced-flat': 'Laminer: Nu = 0,664·Re^½·Pr^⅓   ·   Karma: Nu = (0,037·Re^0,8 − 871)·Pr^⅓',
  'forced-tube': 'Re < 2300: Nu = 3,66   ·   Re ≥ 2300: Gnielinski',
  'natural-vertical': 'Churchill–Chu: Nu = {0,825 + 0,387·Ra^(1/6) / [1 + (0,492/Pr)^(9/16)]^(8/27)}²',
};

export default function ConvectionCalculator() {
  const [mode, setMode] = useState('forced-flat');
  const [inputs, setInputs] = useState({ L: 1.0, V: 2.0, D: 0.05, A: 1.0, Ts: 80, Tf: 20 });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const onChange = e => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
  };

  function calculate(e) {
    e?.preventDefault();
    setError('');
    try {
      // natural convection needs the surface/fluid temperatures for the Grashof number
      const conv = computeConvection({ type: mode, geometry: { L: inputs.L, V: inputs.V, D: inputs.D, Ts: inputs.Ts, Tinf: inputs.Tf } });
      const Q = conv.h * inputs.A * (inputs.Ts - inputs.Tf);
      setResult({ ...conv, Q, mode });
      saveHistory('Taşınım', { Mod: MODES.find(m => m.value === mode).label }, `h = ${fmt(conv.h, 2)} W/(m²·K)`);
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  }

  return (
    <div className="split">
      <form onSubmit={calculate} noValidate>
        <Section title="Akış ve geometri" icon="🌬️" description="Akışkan: ~20–40 °C hava (k = 0,026 W/(m·K), Pr ≈ 0,72)">
          <FormGrid>
            <SelectField className="span-all" label="Taşınım tipi" value={mode} onChange={e => { setMode(e.target.value); setResult(null); }} options={MODES} />
            {mode === 'forced-flat' && (
              <>
                <Field label="Akış yönünde uzunluk L" unit="m" name="L" value={inputs.L} onChange={onChange} />
                <Field label="Akış hızı V" unit="m/s" name="V" value={inputs.V} onChange={onChange} />
              </>
            )}
            {mode === 'forced-tube' && (
              <>
                <Field label="Boru iç çapı D" unit="m" name="D" value={inputs.D} onChange={onChange} />
                <Field label="Ortalama hız V" unit="m/s" name="V" value={inputs.V} onChange={onChange} />
              </>
            )}
            {mode === 'natural-vertical' && <Field label="Levha yüksekliği L" unit="m" name="L" value={inputs.L} onChange={onChange} />}
            <Field label="Isı transfer alanı A" unit="m²" name="A" value={inputs.A} onChange={onChange} />
            <Field label="Yüzey sıcaklığı Tₛ" unit="°C" name="Ts" value={inputs.Ts} onChange={onChange} />
            <Field label="Akışkan sıcaklığı T∞" unit="°C" name="Tf" value={inputs.Tf} onChange={onChange} />
          </FormGrid>
          <ButtonRow><button type="submit">Hesapla</button></ButtonRow>
        </Section>
      </form>
      <div>
        {error && <Alert type="error">{error}</Alert>}
        {!result ? <EmptyState icon="🌬️" title="Isı taşınım katsayısı burada görünecek" /> : (
          <Section title="Sonuçlar" icon="📊" description={`Rejim: ${REGIME[result.regime] || '—'}`}>
            <StatGrid>
              <Stat primary label="h" value={result.h} unit="W/(m²·K)" digits={3} />
              <Stat label="Isı akış hızı Q" value={result.Q} unit="W" digits={2} />
              <Stat label="Nusselt Nu" value={result.Nu} digits={2} />
              {result.mode === 'natural-vertical'
                ? <Stat label="Rayleigh Ra" value={result.Ra} />
                : <Stat label="Reynolds Re" value={result.Re ?? result.ReL} digits={0} />}
              <Stat label="Prandtl Pr" value={result.Pr} digits={3} />
            </StatGrid>
            {result.warning && <Alert type="warning">{result.warning}</Alert>}
            <div className="formula">{CORRELATION[result.mode]}</div>
          </Section>
        )}
      </div>
    </div>
  );
}
