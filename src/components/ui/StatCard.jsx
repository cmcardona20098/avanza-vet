import clsx from 'clsx'

const styles = {
  blue:   { icon: 'bg-blue-50 text-blue-600',    bar: 'bg-blue-500',    trend: 'text-blue-600 bg-blue-50'   },
  green:  { icon: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500', trend: 'text-emerald-600 bg-emerald-50' },
  red:    { icon: 'bg-red-50 text-red-600',       bar: 'bg-red-500',     trend: 'text-red-600 bg-red-50'     },
  yellow: { icon: 'bg-amber-50 text-amber-600',   bar: 'bg-amber-500',   trend: 'text-amber-600 bg-amber-50' },
  purple: { icon: 'bg-violet-50 text-violet-600', bar: 'bg-violet-500',  trend: 'text-violet-600 bg-violet-50' },
}

export default function StatCard({ title, value, icon: Icon, trend, color = 'blue', subtitle }) {
  const s = styles[color] || styles.blue

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5 group">
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('p-2.5 rounded-xl transition-transform group-hover:scale-110 duration-200', s.icon)}>
          <Icon size={19} />
        </div>
        {trend && (
          <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full', s.trend)}>{trend}</span>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-sm font-medium text-gray-500 mt-1.5">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      <div className={clsx('h-0.5 rounded-full mt-4 opacity-40 group-hover:opacity-80 transition-opacity', s.bar)} />
    </div>
  )
}
