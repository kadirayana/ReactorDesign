import React from 'react';

// Reactor schematics. Colours come from CSS classes (.rd-*) in globals.css so they follow the theme.

const Arrow = ({ id }) => (
  <defs>
    <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" className="rd-arrowhead" />
    </marker>
  </defs>
);

function Pfr({ packed }) {
  const id = packed ? 'rd-arrow-pbr' : 'rd-arrow-pfr';
  const beads = [];
  if (packed) {
    for (let x = 118; x <= 362; x += 15) {
      for (let row = 0; row < 3; row++) {
        beads.push(<circle key={`${x}-${row}`} cx={x + (row % 2) * 7} cy={84 + row * 16} r="5.5" className="rd-bead" />);
      }
    }
  }
  return (
    <svg viewBox="0 0 480 200" role="img" aria-label={packed ? 'Dolgulu yatak reaktörü şeması' : 'Piston akışlı reaktör şeması'}>
      <Arrow id={id} />
      <rect x="100" y="70" width="280" height="60" rx="30" className="rd-fluid" />
      {packed && <g clipPath="url(#rd-tube-clip)">{beads}</g>}
      <clipPath id="rd-tube-clip"><rect x="100" y="70" width="280" height="60" rx="30" /></clipPath>
      <rect x="100" y="70" width="280" height="60" rx="30" className="rd-wall" />
      {!packed && [150, 210, 270, 330].map(x => (
        <line key={x} x1={x - 18} y1="100" x2={x + 12} y2="100" className="rd-flow" markerEnd={`url(#${id})`} />
      ))}
      <line x1="30" y1="100" x2="96" y2="100" className="rd-pipe" markerEnd={`url(#${id})`} />
      <line x1="384" y1="100" x2="450" y2="100" className="rd-pipe" markerEnd={`url(#${id})`} />
      <text x="30" y="88" className="rd-text">Besleme</text>
      <text x="30" y="122" className="rd-muted">Fₐ₀, Cₐ₀</text>
      <text x="450" y="88" textAnchor="end" className="rd-text">Ürün</text>
      <text x="450" y="122" textAnchor="end" className="rd-muted">X</text>
      <text x="240" y="160" textAnchor="middle" className="rd-label">{packed ? 'PBR · katalizör yatağı' : 'PFR · eksenel karışım yok'}</text>
      <line x1="100" y1="176" x2="380" y2="176" className="rd-dim" markerStart="url(#rd-dim)" markerEnd="url(#rd-dim)" />
      <defs>
        <marker id="rd-dim" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10" className="rd-dimhead" />
        </marker>
      </defs>
      <text x="240" y="192" textAnchor="middle" className="rd-muted">V</text>
    </svg>
  );
}

function Cstr() {
  return (
    <svg viewBox="0 0 480 220" role="img" aria-label="Sürekli karıştırmalı tank reaktörü şeması">
      <Arrow id="rd-arrow-cstr" />
      {/* motor + shaft */}
      <rect x="222" y="14" width="36" height="22" rx="4" className="rd-motor" />
      <line x1="240" y1="36" x2="240" y2="160" className="rd-shaft" />
      {/* vessel */}
      <path d="M170 50 L170 165 Q170 195 200 195 L280 195 Q310 195 310 165 L310 50" className="rd-fluid-shape" />
      <path d="M170 50 L170 165 Q170 195 200 195 L280 195 Q310 195 310 165 L310 50" className="rd-wall" fill="none" />
      <line x1="170" y1="50" x2="310" y2="50" className="rd-wall" />
      <line x1="174" y1="78" x2="306" y2="78" className="rd-level" />
      {/* impeller */}
      <rect x="214" y="156" width="52" height="8" rx="3" className="rd-impeller" />
      <rect x="236" y="148" width="8" height="24" rx="3" className="rd-impeller" />
      {/* swirl */}
      <path d="M200 120 a40 14 0 1 0 80 0" className="rd-flow" fill="none" markerEnd="url(#rd-arrow-cstr)" />
      {/* inlet / outlet */}
      <path d="M40 64 L150 64 L150 90" className="rd-pipe" fill="none" markerEnd="url(#rd-arrow-cstr)" />
      <line x1="310" y1="170" x2="440" y2="170" className="rd-pipe" markerEnd="url(#rd-arrow-cstr)" />
      <text x="40" y="54" className="rd-text">Besleme</text>
      <text x="40" y="86" className="rd-muted">Fₐ₀, Cₐ₀</text>
      <text x="440" y="160" textAnchor="end" className="rd-text">Ürün</text>
      <text x="440" y="190" textAnchor="end" className="rd-muted">C = Cçıkış</text>
      <text x="400" y="80" textAnchor="middle" className="rd-label">CSTR</text>
      <text x="400" y="98" textAnchor="middle" className="rd-muted">tam karışım</text>
    </svg>
  );
}

function Batch() {
  return (
    <svg viewBox="0 0 480 220" role="img" aria-label="Kesikli reaktör şeması">
      <rect x="222" y="14" width="36" height="22" rx="4" className="rd-motor" />
      <line x1="240" y1="36" x2="240" y2="160" className="rd-shaft" />
      {/* heating / cooling jacket */}
      <path d="M156 70 L156 170 Q156 206 196 206 L284 206 Q324 206 324 170 L324 70" className="rd-jacket" fill="none" />
      <path d="M170 50 L170 165 Q170 195 200 195 L280 195 Q310 195 310 165 L310 50" className="rd-fluid-shape" />
      <path d="M170 50 L170 165 Q170 195 200 195 L280 195 Q310 195 310 165 L310 50" className="rd-wall" fill="none" />
      <line x1="170" y1="50" x2="310" y2="50" className="rd-wall" />
      <line x1="174" y1="78" x2="306" y2="78" className="rd-level" />
      <rect x="214" y="156" width="52" height="8" rx="3" className="rd-impeller" />
      <rect x="236" y="148" width="8" height="24" rx="3" className="rd-impeller" />
      <text x="70" y="110" textAnchor="middle" className="rd-label">Kesikli</text>
      <text x="70" y="128" textAnchor="middle" className="rd-muted">giriş / çıkış yok</text>
      <text x="410" y="110" textAnchor="middle" className="rd-text">Ceket</text>
      <text x="410" y="128" textAnchor="middle" className="rd-muted">ısıtma / soğutma</text>
      <line x1="372" y1="114" x2="328" y2="120" className="rd-dim" />
    </svg>
  );
}

export default function ReactorDiagram({ reactorType }) {
  let svg;
  if (reactorType === 'pfr') svg = <Pfr />;
  else if (reactorType === 'pbr') svg = <Pfr packed />;
  else if (reactorType === 'cstr') svg = <Cstr />;
  else if (reactorType === 'batch') svg = <Batch />;
  else return <p className="muted">Şema bulunamadı</p>;
  return <div className="reactor-diagram">{svg}</div>;
}
