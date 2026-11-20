import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { getCachedHymns, saveHymns } from './hymnStorage'
import './App.css'

type Hymn = {
  id: string
  number: number
  title: string
  category: string | null
  lyrics: string
  author: string | null
  composer: string | null
}

function App() {
  const [hymns, setHymns] = useState<Hymn[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [usingOfflineData, setUsingOfflineData] = useState(false)
  const [selectedHymn, setSelectedHymn] = useState<Hymn | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [theme, setTheme] = useState<'claro' | 'oscuro'>('claro')
  const [fontSize, setFontSize] = useState(19)

  // Aplicar el tema y el tamaño de letra
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--fs-base',
      `${fontSize}px`
    )
  }, [fontSize])

// Consultar Supabase y guardar los himnos para usarlos sin Internet

// Consultar Supabase y guardar los himnos para usarlos sin Internet
useEffect(() => {
  let isMounted = true

  async function loadHymns() {
    setLoading(true)
    setError('')
    setUsingOfflineData(false)

    try {
      const { data, error } = await supabase
        .from('hymns')
        .select('id, number, title, category, lyrics, author, composer')
        .eq('status', 'published')
        .order('number', { ascending: true })

      if (error) {
        console.error('Error al consultar Supabase:', error)
        throw error
      }

      const publishedHymns = data ?? []

      if (!isMounted) return

      setHymns(publishedHymns)

      try {
        await saveHymns(publishedHymns)
      } catch (cacheError) {
        console.error('Error al guardar himnos localmente:', cacheError)
      }

    } catch (connectionError) {
      console.error('No se pudieron consultar los himnos en Supabase:', connectionError)

      try {
        const cachedHymns = await getCachedHymns()

        if (!isMounted) return

        if (cachedHymns.length > 0) {
          setHymns(cachedHymns)
          setUsingOfflineData(true)
        } else {
          setHymns([])
          setError('No hay conexión ni himnos guardados en este dispositivo.')
        }

      } catch (cacheError) {
        console.error('Error al recuperar himnos locales:', cacheError)

        if (!isMounted) return

        setHymns([])
        setError('No se pudieron cargar los himnos.')
      }

    } finally {
      if (isMounted) {
        setLoading(false)
      }
    }
  }

  loadHymns()

  return () => {
    isMounted = false
  }
}, [])


  // Obtener las categorías disponibles
  const categories = [
    'Todas',
    ...Array.from(
      new Set(
        hymns
          .map((hymn) => hymn.category?.trim())
          .filter((category): category is string => Boolean(category))
      )
    ).sort((a, b) => a.localeCompare(b, 'es')),
  ]

  // Filtrar por búsqueda y categoría
  const filteredHymns = hymns.filter((hymn) => {
    const term = search.trim().toLowerCase()

    const matchesSearch =
      hymn.title.toLowerCase().includes(term) ||
      hymn.number.toString().includes(term)

    const matchesCategory =
      selectedCategory === 'Todas' ||
      hymn.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Separar la letra en estrofas y versos
  const lyricsParagraphs = selectedHymn
    ? selectedHymn.lyrics
        .trim()
        .split(/\n\s*\n/)
        .filter((paragraph) => paragraph.trim() !== '')
    : []

  function goHome() {
    setSelectedHymn(null)
    setFontSize(19)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {selectedHymn ? (
        <>
          <header className="hero hero--ficha">
            <div className="hero__inner">
              <div className="ficha-top">
                <button
                  className="btn-volver"
                  type="button"
                  onClick={goHome}
                >
                  ← Volver
                </button>

                <button
                  className="interruptor"
                  type="button"
                  role="switch"
                  aria-checked={theme === 'oscuro'}
                  aria-label="Cambiar entre modo claro y oscuro"
                  onClick={() =>
                    setTheme(theme === 'claro' ? 'oscuro' : 'claro')
                  }
                >
                  <span className="interruptor__etiqueta">
                    {theme === 'claro' ? 'Modo claro' : 'Modo oscuro'}
                  </span>
                  <span className="interruptor__pista">
                    <span className="interruptor__bola">
                      {theme === 'claro' ? '☀' : '☾'}
                    </span>
                  </span>
                </button>
              </div>

              <div className="ficha-cab">
                <div className="ficha-num">
                  {selectedHymn.number}
                </div>

                <div className="ficha-txt">
                  <p className="ficha-col">HIMNARIO DIGITAL</p>
                  <h1 className="ficha-titulo">
                    {selectedHymn.title}
                  </h1>

                  {selectedHymn.category && (
                    <span className="ficha-cat">
                      {selectedHymn.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="ficha-wrap">
            <article className="hoja">
              <div className="letra">
                {lyricsParagraphs.map((paragraph, index) => (
                  <section className="estrofa" key={index}>
                    <span className="estrofa__num">
                      {index + 1}
                    </span>

                    {paragraph.split('\n').map((verse, verseIndex) => (
                      <span className="verso" key={verseIndex}>
                        {verse || '\u00A0'}
                      </span>
                    ))}
                  </section>
                ))}
              </div>

              {(selectedHymn.author || selectedHymn.composer) && (
                <dl className="creditos">
                  {selectedHymn.author && (
                    <div>
                      <dt>Autor:</dt>
                      <dd>{selectedHymn.author}</dd>
                    </div>
                  )}

                  {selectedHymn.composer && (
                    <div>
                      <dt>Compositor:</dt>
                      <dd>{selectedHymn.composer}</dd>
                    </div>
                  )}
                </dl>
              )}
            </article>
          </main>

          <div className="a11y" aria-label="Tamaño de letra">
            <button
              className="a11y__btn"
              type="button"
              aria-label="Reducir tamaño de letra"
              disabled={fontSize <= 15}
              onClick={() => setFontSize((size) => Math.max(15, size - 2))}
            >
              <span className="a11y__a--s">A</span>
              <span className="a11y__signo">−</span>
            </button>

            <span className="a11y__sep" />

            <button
              className="a11y__btn"
              type="button"
              aria-label="Restablecer tamaño de letra"
              aria-current={fontSize === 19}
              onClick={() => setFontSize(19)}
            >
              <span className="a11y__a--m">A</span>
            </button>

            <span className="a11y__sep" />

            <button
              className="a11y__btn"
              type="button"
              aria-label="Aumentar tamaño de letra"
              disabled={fontSize >= 29}
              onClick={() => setFontSize((size) => Math.min(29, size + 2))}
            >
              <span className="a11y__a--l">A</span>
              <span className="a11y__signo">+</span>
            </button>
          </div>

          <footer className="pie">
            Himnario Digital · Un espacio para alabar juntos
          </footer>
        </>
      ) : (
        <>
          <header className="hero">
            <div className="hero__inner">
              <div className="hero__top">
                <img
  className="hero__logo"
  src="/logo-iglesia-sin-fondo.png"
  alt="Iglesia de Dios (7° día)"
/>

                <button
                  className="interruptor"
                  type="button"
                  role="switch"
                  aria-checked={theme === 'oscuro'}
                  aria-label="Cambiar entre modo claro y oscuro"
                  onClick={() =>
                    setTheme(theme === 'claro' ? 'oscuro' : 'claro')
                  }
                >
                  <span className="interruptor__etiqueta">
                    {theme === 'claro' ? 'Modo claro' : 'Modo oscuro'}
                  </span>

                  <span className="interruptor__pista">
                    <span className="interruptor__bola">
                      {theme === 'claro' ? '☀' : '☾'}
                    </span>
                  </span>
                </button>
              </div>

              <div className="hero__centro">
                <div className="logo-aro">
  <img
    className="logo-aro__imagen"
    src="/icon-iglesia-sin-fondo.png"
    alt="Isotipo de la Iglesia de Dios (7° día)"
  />
</div>

                <h1>Alabemos juntos</h1>

                <p className="hero__sub">
                  Encuentra tus himnos de manera sencilla.
                </p>
              </div>
            </div>
          </header>

          <div className="buscador-wrap">
            <div className="buscador">
              <span className="buscador__icono" aria-hidden="true">
                ⌕
              </span>

              <label className="sr-only" htmlFor="buscar-himno">
                Buscar himno por número o título
              </label>

              <input
                id="buscar-himno"
                type="search"
                placeholder="Buscar por número o título..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              {search && (
                <button
                  className="buscador__borrar"
                  type="button"
                  aria-label="Borrar búsqueda"
                  onClick={() => setSearch('')}
                >
                  ×
                </button>
              )}
            </div>
          </div>
          {usingOfflineData && (
  <div className="aviso aviso--offline" role="status">
    Estás consultando los himnos guardados en este dispositivo.
    Es posible que no estén actualizados.
  </div>
)}

          {!loading && !error && categories.length > 1 && (
            <nav className="filtros" aria-label="Filtrar por categoría">
              <div className="filtros__fila">
                {categories.map((category) => (
                  <button
                    className="chip"
                    type="button"
                    key={category}
                    aria-pressed={selectedCategory === category}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </nav>
          )}

          <main className="contenido">
            <p className="resumen" aria-live="polite">
              {loading
                ? 'Cargando colección...'
                : `${filteredHymns.length} ${
                    filteredHymns.length === 1 ? 'himno disponible' : 'himnos disponibles'
                  }`}
            </p>

            {error && (
              <div className="aviso" role="alert">
                {error}
                <button
                  className="btn"
                  type="button"
                  onClick={() => window.location.reload()}
                >
                  Intentar nuevamente
                </button>
              </div>
            )}

            {loading && (
              <div className="lista" aria-label="Cargando himnos">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div className="esqueleto" key={index} />
                ))}
              </div>
            )}

            {!loading && !error && (
              <>
                {filteredHymns.length > 0 ? (
                  <ul className="lista lista--entra">
                    {filteredHymns.map((hymn, index) => (
                      <li key={hymn.id}>
                        <button
                          className="tarjeta"
                          type="button"
                          style={{ width: '100%', textAlign: 'left', '--i': index } as React.CSSProperties}
                          onClick={() => {
                            setSelectedHymn(hymn)
                            setFontSize(19)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                        >
                          <span className="tarjeta__num">
                            {hymn.number}
                          </span>

                          <span className="tarjeta__txt">
                            <span className="tarjeta__titulo">
                              {hymn.title}
                            </span>

                            <span className="tarjeta__meta">
                              <span className="etiqueta">
                                {hymn.category || 'Himno'}
                              </span>
                            </span>
                          </span>

                          <span className="tarjeta__fin" aria-hidden="true">
                            ›
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="vacio">
                    <div className="vacio__icono" aria-hidden="true">
                      ♫
                    </div>

                    <h2>
                      {search || selectedCategory !== 'Todas'
                        ? 'No encontramos resultados'
                        : 'Todavía no hay himnos publicados'}
                    </h2>

                    <p>
                      {search || selectedCategory !== 'Todas'
                        ? 'Prueba con otro número, título o categoría.'
                        : 'Los himnos aparecerán aquí cuando estén publicados.'}
                    </p>

                    {(search || selectedCategory !== 'Todas') && (
                      <button
                        className="btn"
                        type="button"
                        onClick={() => {
                          setSearch('')
                          setSelectedCategory('Todas')
                        }}
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </main>

          <footer className="pie">
            Himnario Digital · Un espacio para alabar juntos
          </footer>
        </>
      )}
    </>
  )
}

export default App