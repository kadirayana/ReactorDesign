import React from 'react';

const diagrams = {
    pfr: (
        <svg width="400" height="150" viewBox="0 0 400 150">
            <rect x="50" y="50" width="300" height="50" fill="none" stroke="#007bff" strokeWidth="2" />
            <polygon points="30,75 50,65 50,85" fill="#007bff" />
            <polygon points="370,75 350,65 350,85" fill="#007bff" />
            <text x="200" y="85" textAnchor="middle" fill="#333">PFR</text>
            <text x="20" y="75" textAnchor="end" fill="#333">Giriş</text>
            <text x="380" y="75" textAnchor="start" fill="#333">Çıkış</text>
        </svg>
    ),
    cstr: (
        <svg width="400" height="150" viewBox="0 0 400 150">
            <circle cx="200" cy="75" r="50" fill="none" stroke="#007bff" strokeWidth="2" />
            <line x1="120" y1="75" x2="150" y2="75" stroke="#007bff" strokeWidth="2" />
            <polygon points="150,75 140,70 140,80" fill="#007bff" />
            <line x1="200" y1="125" x2="200" y2="150" stroke="#007bff" strokeWidth="2" />
            <polygon points="200,150 195,140 205,140" fill="#007bff" />
            <text x="200" y="85" textAnchor="middle" fill="#333">CSTR</text>
            <text x="110" y="75" textAnchor="end" fill="#333">Giriş</text>
            <text x="200" y="150" textAnchor="middle" dominantBaseline="hanging" fill="#333">Çıkış</text>
            <line x1="170" y1="60" x2="230" y2="90" stroke="#333" strokeWidth="1.5" />
            <line x1="170" y1="90" x2="230" y2="60" stroke="#333" strokeWidth="1.5" />
        </svg>
    ),
    pbr: (
        <svg width="400" height="150" viewBox="0 0 400 150">
            <rect x="50" y="50" width="300" height="50" fill="none" stroke="#007bff" strokeWidth="2" />
            <polygon points="30,75 50,65 50,85" fill="#007bff" />
            <polygon points="370,75 350,65 350,85" fill="#007bff" />
            <text x="200" y="85" textAnchor="middle" fill="#333">PBR</text>
            <text x="20" y="75" textAnchor="end" fill="#333">Giriş</text>
            <text x="380" y="75" textAnchor="start" fill="#333">Çıkış</text>
            {[100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300].map((cx, i) => (
                <circle key={i} cx={cx} cy={i % 2 === 0 ? 65 : 75} r="3" fill="#666" />
            ))}
        </svg>
    ),
    batch: (
        <svg width="400" height="150" viewBox="0 0 400 150">
            <rect x="150" y="25" width="100" height="100" rx="5" ry="5" fill="none" stroke="#007bff" strokeWidth="2" />
            <line x1="200" y1="25" x2="200" y2="10" stroke="#007bff" strokeWidth="2" />
            <circle cx="200" cy="10" r="5" fill="#007bff" />
            <text x="200" y="75" textAnchor="middle" fill="#333">Batch</text>
            <text x="250" y="30" textAnchor="start" fill="#333">Karıştırıcı</text>
            <line x1="200" y1="25" x2="200" y2="100" stroke="#333" strokeWidth="1.5" />
            <line x1="180" y1="80" x2="220" y2="80" stroke="#333" strokeWidth="1.5" />
            <line x1="190" y1="70" x2="210" y2="90" stroke="#333" strokeWidth="1.5" />
            <line x1="190" y1="90" x2="210" y2="70" stroke="#333" strokeWidth="1.5" />
        </svg>
    ),
};

/**
 * ReactorDiagram – renders an SVG diagram for the given reactor type.
 * Uses pure React JSX instead of innerHTML for safety.
 */
export default function ReactorDiagram({ reactorType }) {
    return (
        <div style={{ textAlign: 'center', maxWidth: '100%', overflow: 'auto' }}>
            {diagrams[reactorType] || <p>Diyagram bulunamadı</p>}
        </div>
    );
}
