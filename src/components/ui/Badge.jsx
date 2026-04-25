import clsx from 'clsx'

const variants = {
  green:  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  red:    'bg-red-50 text-red-700 ring-1 ring-red-200/60',
  yellow: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  blue:   'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60',
  gray:   'bg-gray-100 text-gray-600 ring-1 ring-gray-200/60',
  purple: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200/60',
}

export default function Badge({ children, variant = 'gray', className }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
