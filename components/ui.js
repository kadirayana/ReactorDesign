// Shared UI building blocks. Styling lives in styles/globals.css (design tokens).
import React from 'react';

/** Number formatting for result displays (Turkish locale, scientific for extremes). */
export function fmt(value, digits = 3) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e6 || abs < 1e-3) return n.toExponential(Math.max(1, digits - 1)).replace('.', ',');
  return n.toLocaleString('tr-TR', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export function PageHeader({ eyebrow, title, lead, children }) {
  return (
    <header className="page-header">
      {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
      <h1 className="page-title">{title}</h1>
      {lead && <p className="page-lead">{lead}</p>}
      {children}
    </header>
  );
}

export function Section({ title, icon, description, actions, className = '', children, as: Tag = 'section' }) {
  return (
    <Tag className={`section ${className}`.trim()}>
      {(title || actions) && (
        <div className="section-header">
          <div>
            {title && (
              <h3 className="section-title">
                {icon && <span className="section-icon" aria-hidden>{icon}</span>}
                {title}
              </h3>
            )}
            {description && <p className="section-desc">{description}</p>}
          </div>
          {actions && <div className="btn-row" style={{ marginTop: 0 }}>{actions}</div>}
        </div>
      )}
      {children}
    </Tag>
  );
}

export function FormGrid({ children, className = '' }) {
  return <div className={`form-grid ${className}`.trim()}>{children}</div>;
}

export function Field({ label, unit, hint, name, value, onChange, type = 'number', step = 'any', className = '', ...rest }) {
  const id = rest.id || (name ? `f-${name}` : undefined);
  return (
    <label className={`field ${className}`.trim()} htmlFor={id}>
      <span className="field-label">
        <span>{label}</span>
        {unit && <span className="field-unit">{unit}</span>}
      </span>
      <input id={id} name={name} type={type} step={type === 'number' ? step : undefined} value={value ?? ''} onChange={onChange} {...rest} />
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function SelectField({ label, hint, name, value, onChange, options, className = '', ...rest }) {
  const id = rest.id || (name ? `f-${name}` : undefined);
  return (
    <label className={`field ${className}`.trim()} htmlFor={id}>
      <span className="field-label"><span>{label}</span></span>
      <select id={id} name={name} value={value} onChange={onChange} {...rest}>
        {options.map(opt => (
          <option key={String(opt.value)} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Checkbox({ label, name, checked, onChange, className = '', ...rest }) {
  return (
    <label className={`check ${className}`.trim()}>
      <input type="checkbox" name={name} checked={!!checked} onChange={onChange} {...rest} />
      <span>{label}</span>
    </label>
  );
}

export function ButtonRow({ children }) {
  return <div className="btn-row">{children}</div>;
}

export function Alert({ type = 'info', title, children }) {
  if (!children && !title) return null;
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {title && <strong style={{ color: 'inherit' }}>{title} </strong>}
      {children}
    </div>
  );
}

export function StatGrid({ children }) {
  return <div className="stat-grid">{children}</div>;
}

export function Stat({ label, value, unit, digits = 3, primary = false, raw = false }) {
  return (
    <div className={`stat ${primary ? 'stat-primary' : ''}`.trim()}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {raw ? value : fmt(value, digits)}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
    </div>
  );
}

export function EmptyState({ icon = '🧪', title = 'Henüz sonuç yok', children }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden>{icon}</div>
      <strong>{title}</strong>
      {children && <div className="small">{children}</div>}
    </div>
  );
}

export function Tabs({ tabs, value, onChange, label = 'Sekmeler' }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map(t => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          className={value === t.value ? 'active' : ''}
          onClick={() => onChange(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Simple data table. columns: [{ key, label, digits?, format? }] */
export function DataTable({ columns, rows, maxHeight }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div className="table-wrap" style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}>
      <table>
        <thead>
          <tr>{columns.map(c => <th key={c.key} className={c.text ? '' : 'num'}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map(c => {
                const v = row[c.key];
                const out = c.format ? c.format(v, row) : (typeof v === 'number' ? fmt(v, c.digits ?? 4) : String(v ?? '—'));
                return <td key={c.key} className={c.text ? '' : 'num'}>{out}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Reads a CSS custom property (for chart colors that follow the theme). */
export function cssVar(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}
