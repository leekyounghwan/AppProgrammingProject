import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: '인식', icon: '🧊' },
  { to: '/recipe', label: '레시피', icon: '🍳' },
  { to: '/saved', label: '저장', icon: '🔖' },
  { to: '/profile', label: '프로필', icon: '👤' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">
      {items.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-xs px-3 py-1 rounded-lg transition-colors ${
              isActive ? 'text-emerald-600 font-semibold' : 'text-gray-500'
            }`
          }
        >
          <span className="text-xl">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
