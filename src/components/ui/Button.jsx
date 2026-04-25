import clsx from 'clsx'

const variants = {
  primary:   'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md',
  secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm',
  danger:    'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md',
  ghost:     'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  whatsapp:  'bg-[#25D366] text-white hover:bg-[#20ba5a] shadow-sm hover:shadow-md',
  success:   'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  icon: Icon,
  disabled,
  ...props
}) {
  return (
    <button
      disabled={disabled}
      className={clsx(
        'inline-flex items-center font-semibold rounded-xl transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
        'active:scale-[0.97]',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {Icon && <Icon size={size === 'lg' ? 18 : size === 'sm' ? 13 : 15} />}
      {children}
    </button>
  )
}
