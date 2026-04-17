export function Section({ title, children, style }) {
  return (
    <section
      style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: 18,
        marginBottom: 14,
        ...style,
      }}
    >
      {title && (
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 15,
            letterSpacing: '0.22em',
            color: 'var(--gold)',
            marginBottom: 12,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}

export function Field({ label, hint, children, span }) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        gridColumn: span === 2 ? 'span 2' : undefined,
      }}
    >
      <span
        style={{
          fontSize: 12,
          letterSpacing: '0.14em',
          fontFamily: 'var(--font-display)',
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      {children}
      {hint && (
        <span style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>
          {hint}
        </span>
      )}
    </label>
  );
}

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 10,
  background: 'var(--bg3)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  fontSize: 15,
  fontFamily: 'var(--font-body)',
  width: '100%',
};

export function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputStyle}
    />
  );
}

export function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{ ...inputStyle, minHeight: rows * 22, resize: 'vertical' }}
    />
  );
}

export function Select({ value, onChange, options }) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle, appearance: 'auto' }}
    >
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>
          {o.label ?? o}
        </option>
      ))}
    </select>
  );
}

export function Grid({ children, cols = 2 }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

export function GoldButton({ children, onClick, disabled, style, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '12px 22px',
        borderRadius: 12,
        background:
          'linear-gradient(135deg, #c8922a 0%, rgba(200, 146, 42, 0.7) 100%)',
        color: '#1a1408',
        fontFamily: 'var(--font-display)',
        fontSize: 14,
        letterSpacing: '0.18em',
        fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, disabled, style, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 18px',
        borderRadius: 12,
        background: 'var(--bg3)',
        border: '1px solid var(--border)',
        color: 'var(--text)',
        fontFamily: 'var(--font-display)',
        fontSize: 13,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function ViewHeader({ title, subtitle, right }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12,
        padding: '22px 20px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg2)',
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            letterSpacing: '0.1em',
            color: 'var(--text)',
            lineHeight: 1,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <div
            style={{
              color: 'var(--text-dim)',
              fontSize: 14,
              fontStyle: 'italic',
              marginTop: 6,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {right}
    </div>
  );
}

export function ViewBody({ children, style }) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: '18px 18px calc(24px + var(--safe-bottom))',
        ...style,
      }}
    >
      <div style={{ maxWidth: 780, margin: '0 auto' }}>{children}</div>
    </div>
  );
}
