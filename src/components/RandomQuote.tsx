import { useState } from 'react'

type Quote = {
  text: string
  author?: string
}

const QUOTES: Quote[] = [
  { text: 'Make it work, make it right, make it fast.', author: 'Kent Beck' },
  { text: 'Simplicity is prerequisite for reliability.', author: 'Edsger W. Dijkstra' },
  { text: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
  { text: 'Programs must be written for people to read.', author: 'Harold Abelson' },
  { text: 'Done is better than perfect.' },
]

function randomIndex(maxExclusive: number) {
  return Math.floor(Math.random() * maxExclusive)
}

function pickQuote(): Quote | undefined {
  if (QUOTES.length === 0) return undefined
  return QUOTES[randomIndex(QUOTES.length)]
}

export default function RandomQuote() {
  const [quote, setQuote] = useState(pickQuote)

  return (
    <section className="random-quote" aria-label="Random quote">
      <h2>Random Quote</h2>
      {quote ? (
        <figure className="random-quote__figure">
          <blockquote className="random-quote__text">“{quote.text}”</blockquote>
          {quote.author ? (
            <figcaption className="random-quote__author">— {quote.author}</figcaption>
          ) : null}
        </figure>
      ) : (
        <p>No quotes available.</p>
      )}

      <button type="button" onClick={() => setQuote(pickQuote())}>
        Reroll
      </button>
    </section>
  )
}
