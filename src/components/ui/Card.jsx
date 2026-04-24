import clsx from 'clsx'

export default function Card({ children, className, padding = true }) {
  return (
    <div className={clsx(
      'bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200',
      padding && 'p-5',
      className
    )}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h3 className="text-sm font-bold text-gray-900 tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5 font-medium">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
