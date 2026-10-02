import { useState } from 'react'

type Category = 'Build' | 'UI' | 'Quality'

type Tool = {
  name: string
  category: Category
  emoji: string
  description: string
  url: string
}

const TOOLS: Tool[] = [
  {
    name: 'Vite',
    category: 'Build',
    emoji: '⚡',
    description: 'Lightning-fast dev server and optimized production builds.',
    url: 'https://vite.dev',
  },
  {
    name: 'TypeScript',
    category: 'Quality',
    emoji: '🛡️',
    description: 'Static types that catch bugs before your users do.',
    url: 'https://www.typescriptlang.org',
  },
  {
    name: 'React',
    category: 'UI',
    emoji: '⚛️',
    description: 'Declarative components for building interactive interfaces.',
    url: 'https://react.dev',
  },
  {
    name: 'React Router',
    category: 'UI',
    emoji: '🧭',
    description: 'Client-side routing that powers navigation between pages.',
    url: 'https://reactrouter.com',
  },
  {
    name: 'ESLint',
    category: 'Quality',
    emoji: '🔍',
    description: 'Pluggable linting to keep the codebase consistent.',
    url: 'https://eslint.org',
  },
  {
    name: 'Docker',
    category: 'Build',
    emoji: '🐳',
    description: 'Run the app anywhere with the bundled Dockerfile.',
    url: 'https://www.docker.com',
  },
]

const FILTERS = ['All', 'Build', 'UI', 'Quality'] as const
type Filter = (typeof FILTERS)[number]

export default function Toolbox() {
  const [filter, setFilter] = useState<Filter>('All')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const visible = TOOLS.filter((t) => filter === 'All' || t.category === filter)

  function toggleFavorite(name: string) {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  return (
    <section className="toolbox">
      <h1 className="toolbox__title">The Toolbox</h1>
      <p className="toolbox__subtitle">
        The tools behind this project. Filter by category and star your favorites.
      </p>

      <div className="toolbox__filters" role="group" aria-label="Filter tools by category">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={f === filter ? 'chip chip--active' : 'chip'}
            aria-pressed={f === filter}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <ul className="toolbox__grid">
        {visible.map((tool) => {
          const isFav = favorites.has(tool.name)
          return (
            <li key={tool.name} className="tool-card">
              <div className="tool-card__header">
                <span className="tool-card__emoji" aria-hidden="true">
                  {tool.emoji}
                </span>
                <button
                  type="button"
                  className={isFav ? 'tool-card__star tool-card__star--on' : 'tool-card__star'}
                  aria-pressed={isFav}
                  aria-label={`${isFav ? 'Unstar' : 'Star'} ${tool.name}`}
                  onClick={() => toggleFavorite(tool.name)}
                >
                  {isFav ? '★' : '☆'}
                </button>
              </div>
              <h2>{tool.name}</h2>
              <span className="tool-card__tag">{tool.category}</span>
              <p>{tool.description}</p>
              <a href={tool.url} target="_blank" rel="noreferrer">
                Learn more →
              </a>
            </li>
          )
        })}
      </ul>

      <p className="read-the-docs">
        {favorites.size === 0
          ? 'No favorites yet.'
          : `${favorites.size} favorite${favorites.size === 1 ? '' : 's'} starred.`}
      </p>
    </section>
  )
}
