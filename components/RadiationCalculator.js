import React, { useState } from 'react';
import {
  Section, FormGrid, Field, SelectField, ButtonRow, Alert, StatGrid, Stat, EmptyState, fmt,
} from './ui';
import { blackbody, graybody, twoSurfaceExchange, celsiusToKelvin } from '../src/lib/radiation';
import { saveHistory } from '../src/lib/history';

const MODES = [
  { value: 'graybody', label: 'Gri cisim — geniş ortam içinde' },
  { value: 'surfaces', label: 'İki gri yüzey arası net ışınım' },
  { value: 'blackbody', label: 'Siyah cisim yayımı' },
];

const FORMULA = {
  blackbody: 'Q = σ·A·T⁴',
  graybody: 'Q = ε·σ·A·(Tₛ⁴ − T∞⁴)',
  surfaces: 'Q₁₂ = σ(T₁⁴ − T₂⁴) / [(1−ε₁)/(ε₁A₁) + 1/(A₁F₁₂) + (1−ε₂)/(ε₂A₂)]',
};

export default function RadiationCalculator() {
  const [mode, setMode] = useState('graybody');
  const [inputs, setInputs] = useState({ emissivity: 0.9, area: 1, T_surface: 80, T_surroundings: 20 });
  const [surfaces, setSurfaces] = useState({ T1: 800, A1: 1, e1: 0.8, T2: 300, A2: 2, e2: 0.6, F12: 0.8 });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const numeric = setter => e => {
    const { name, value } = e.target;
    setter(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
  };
  const onInputs = numeric(setInputs);
  const onSurfaces = numeric(setSurfaces);

  // All temperature inputs are in °C and always converted to K.
  function calculate(e) {
    e?.preventDefault();
    setError('');
    try {
      let Q;
      if (mode === 'blackbody') {
        Q = blackbody({ T: celsiusToKelvin(inputs.T_surface), A: inputs.area }).Q;
      } else if (mode === 'graybody') {
        Q = graybody({
          T: celsiusToKelvin(inputs.T_surface),
          A: inputs.area,
          epsilon: inputs.emissivity,
          T_surroundings: celsiusToKelvin(inputs.T_surroundings),
        }).Q;
      } else {
        Q = twoSurfaceExchange({
          T1: celsiusToKelvin(surfaces.T1), A1: surfaces.A1, eps1: surfaces.e1,
          T2: celsiusToKelvin(surfaces.T2), A2: surfaces.A2, eps2: surfaces.e2,
          F12: surfaces.F12,
        }).Q;
      }
      const area = mode === 'surfaces' ? surfaces.A1 : inputs.area;
      setResult({ Q, flux: Q / area, mode });
      saveHistory('Işınım', { Mod: MODES.find(m => m.value === mode).label }, `Q = ${fmt(Q, 2)} W`);
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  }

  return (
    <div className="split">
      <form onSubmit={calculate} noValidate>
        <Section title="Işınım" icon="☀️" description="Tüm sıcaklıklar °C girilir, hesapta K’e çevrilir.">
          <FormGrid>
            <SelectField className="span-all" label="Hesap tipi" value={mode} onChange={e => { setMode(e.target.value); setResult(null); }} options={MODES} />
            {mode !== 'surfaces' && (
              <>
                <Field label="Yüzey sıcaklığı" unit="°C" name="T_surface" value={inputs.T_surface} onChange={onInputs} />
                {mode === 'graybody' && <Field label="Ortam sıcaklığı" unit="°C" name="T_surroundings" value={inputs.T_surroundings} onChange={onInputs} />}
                {mode === 'graybody' && <Field label="Yayıcılık ε" unit="0–1" name="emissivity" value={inputs.emissivity} onChange={onInputs} step="0.01" />}
                <Field label="Alan A" unit="m²" name="area" value={inputs.area} onChange={onInputs} />
              </>
            )}
            {mode === 'surfaces' && (
              <>
                <Field label="Yüzey 1 sıcaklığı" unit="°C" name="T1" value={surfaces.T1} onChange={onSurfaces} />
                <Field label="Yüzey 2 sıcaklığı" unit="°C" name="T2" value={surfaces.T2} onChange={onSurfaces} />
                <Field label="Yüzey 1 alanı A₁" unit="m²" name="A1" value={surfaces.A1} onChange={onSurfaces} />
                <Field label="Yüzey 2 alanı A₂" unit="m²" name="A2" value={surfaces.A2} onChange={onSurfaces} />
                <Field label="Yüzey 1 yayıcılığı ε₁" unit="0–1" name="e1" value={surfaces.e1} onChange={onSurfaces} step="0.01" />
                <Field label="Yüzey 2 yayıcılığı ε₂" unit="0–1" name="e2" value={surfaces.e2} onChange={onSurfaces} step="0.01" />
                <Field label="Görüş faktörü F₁₂" unit="0–1" name="F12" value={surfaces.F12} onChange={onSurfaces} step="0.01" />
              </>
            )}
          </FormGrid>
          <ButtonRow><button type="submit">Hesapla</button></ButtonRow>
        </Section>
      </form>
      <div>
        {error && <Alert type="error">{error}</Alert>}
        {!result ? <EmptyState icon="☀️" title="Işınımla ısı transferi burada görünecek" /> : (
          <Section title="Sonuçlar" icon="📊">
            <StatGrid>
              <Stat primary label={result.mode === 'surfaces' ? 'Net ışınım Q₁₂' : 'Isı akış hızı Q'} value={result.Q} unit="W" digits={2} />
              <Stat label="Isı akısı q" value={result.flux} unit="W/m²" digits={2} />
            </StatGrid>
            {result.Q < 0 && <Alert type="info">Negatif değer: net ısı akışı ters yöndedir (yüzey ısı kazanıyor).</Alert>}
            <div className="formula">{FORMULA[result.mode]}   ·   σ = 5,670×10⁻⁸ W/(m²·K⁴)</div>
          </Section>
        )}
      </div>
    </div>
  );
}
