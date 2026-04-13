import clsx from 'clsx';

export const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className, 
  disabled, 
  type = 'button',
  icon: Icon,
  loading
}) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-800',
    danger: 'bg-red-50 border border-red-100 text-red-600 hover:bg-red-100',
    ghost: 'hover:bg-slate-50 text-slate-500 hover:text-slate-900 border border-transparent'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        'px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-sm',
        variants[variant],
        className
      )}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

export const Card = ({ children, className, title, subtitle, icon: Icon, footer }) => {
  return (
    <div className={clsx('glass-panel overflow-hidden border-slate-100 bg-white shadow-sm', className)}>
      {(title || subtitle || Icon) && (
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600 border border-purple-100 shadow-sm">
                <Icon size={20} />
              </div>
            )}
            <div>
              {title !== undefined && <h3 className="font-extrabold text-slate-900 text-lg tracking-tight leading-none">{title}</h3>}
              {subtitle && <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && <div className="p-4 px-6 bg-slate-50/50 border-t border-slate-50">{footer}</div>}
    </div>
  );
};

export const Input = ({ label, placeholder, value, onChange, type = 'text', icon: Icon, error, className, required, disabled, rows }) => {
  const isTextArea = rows !== undefined;
  const InputTag = isTextArea ? 'textarea' : 'input';

  return (
    <div className={clsx('space-y-1.5 w-full', className)}>
      {label && <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">{label}</label>}
      <div className="relative group">
        {Icon && <Icon className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-purple-600 transition-colors" size={18} />}
        <InputTag
          type={type}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={value ?? ''}
          onChange={onChange}
          rows={rows}
          className={clsx(
            'input-field w-full px-4 py-3 rounded-xl font-medium outline-none text-slate-900',
            Icon && 'pl-12',
            error ? 'border-red-500/50 focus:border-red-500' : ''
          )}
        />
      </div>
      {error && <p className="text-[10px] text-red-500 ml-1 font-bold italic tracking-wide">{error}</p>}
    </div>
  );
};
