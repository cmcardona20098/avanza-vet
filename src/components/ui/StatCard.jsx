import clsx from 'clsx'

export default function StatCard({ title, value, icon: Icon, trend, color = 'blue', subtitle }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   text: 'text-blue-700' },
    green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600',  text: 'text-green-700' },
    red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',      text: 'text-red-700' },
    yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-100 text-yellow-600',text: 'text-yellow-700' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600',text: 'text-purple-700' },
  }

  const c = colors[color]

  return (
    <div className={clsx('rounded-xl p-5 border border-transparent', c.bg)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <p className={clsx('text-xs font-medium mt-1', c.text)}>{trend}</p>
          )}
        </div>
        <div className={clsx('p-3 rounded-xl', c.icon)}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}
