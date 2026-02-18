import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [films, setFilms] = useState([]);
  const [actors, setActors] = useState([]);

  const [loadingFilms, setLoadingFilms] = useState(false);
  const [loadingActors, setLoadingActors] = useState(false);
  const [errorFilms, setErrorFilms] = useState('');
  const [errorActors, setErrorActors] = useState('');

  const [selectedFilm, setSelectedFilm] = useState(null);
  const [loadingFilmDetail, setLoadingFilmDetail] = useState(false);
  const [errorFilmDetail, setErrorFilmDetail] = useState('');

  const [selectedActor, setSelectedActor] = useState(null);
  const [actorFilms, setActorFilms] = useState([]);
  const [loadingActorFilms, setLoadingActorFilms] = useState(false);
  const [errorActorFilms, setErrorActorFilms] = useState('');

  useEffect(() => {
    let cancelled = false;
    setErrorFilms('');
    setLoadingFilms(true);

    fetch('/api/films')
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load films (${r.status})`);
        return r.json();
      })
      .then(data => {
        if (cancelled) return;
        setFilms(Array.isArray(data) ? data : []);
        setLoadingFilms(false);
      })
      .catch(e => {
        if (cancelled) return;
        setFilms([]);
        setErrorFilms(e?.message || 'Failed to load films');
        setLoadingFilms(false);
      });

    setErrorActors('');
    setLoadingActors(true);

    fetch('/api/actors')
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load actors (${r.status})`);
        return r.json();
      })
      .then(data => {
        if (cancelled) return;
        setActors(Array.isArray(data) ? data : []);
        setLoadingActors(false);
      })
      .catch(e => {
        if (cancelled) return;
        setActors([]);
        setErrorActors(e?.message || 'Failed to load actors');
        setLoadingActors(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleFilmClick = film => {
    setSelectedFilm(null);
    setErrorFilmDetail('');
    setLoadingFilmDetail(true);

    fetch(`/api/films/${film.film_id}`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load film (${r.status})`);
        return r.json();
      })
      .then(data => {
        setSelectedFilm(data);
        setLoadingFilmDetail(false);
      })
      .catch(e => {
        setSelectedFilm(null);
        setErrorFilmDetail(e?.message || 'Failed to load film details');
        setLoadingFilmDetail(false);
      });
  };

  const handleActorClick = actor => {
    setSelectedActor(actor);
    setActorFilms([]);
    setErrorActorFilms('');
    setLoadingActorFilms(true);

    fetch(`/api/actors/${actor.actor_id}/films`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load films (${r.status})`);
        return r.json();
      })
      .then(data => {
        setActorFilms(Array.isArray(data) ? data : []);
        setLoadingActorFilms(false);
      })
      .catch(e => {
        setActorFilms([]);
        setErrorActorFilms(e?.message || 'Failed to load films for actor');
        setLoadingActorFilms(false);
      });
  };

  return (
    <div className="appShell">
      <header className="topBar">
        <div className="brand">
          <div>
            <div className="brandName">FilmVault</div>
          </div>
        </div>
      </header>

      <main className="content">
        <section className="section">
          <div className="sectionHeader">
            
            <div className="sectionTitle">Top 5 Films (most rented)</div>

          </div>

          <div className="grid">
            {films.map(f => (
              <article
                key={f.film_id}
                className="card cardClickable"
                onClick={() => handleFilmClick(f)}
              >
                <div className="cardTitle">{f.title}</div>
                <div className="cardSub">Rentals: {f.rental_count}</div>
              </article>
            ))}
          </div>

          <div className="detailArea">
            {selectedFilm && (
              <article className="detailCard">
                <h2 className="detailTitle">
                  {selectedFilm.title}{' '}
                  {selectedFilm.release_year ? `(${selectedFilm.release_year})` : ''}
                </h2>
                <div className="detailMeta">
                  {selectedFilm.rating && <span>{selectedFilm.rating}</span>}
                  {selectedFilm.length && <span>{selectedFilm.length} min</span>}
                  {(selectedFilm.categories || []).length > 0 && (
                    <span>
                      {(selectedFilm.categories || []).join(' • ')}
                    </span>
                  )}
                </div>
                {selectedFilm.description && (
                  <p className="detailDescription">{selectedFilm.description}</p>
                )}
              </article>
            )}
          </div>
        </section>

        <section className="section">
          <div className="sectionHeader">
            <div className="sectionTitle">Top 5 Actors (most rented)</div>

          </div>

          <div className="grid">
            {actors.map(a => (
              <article
                key={a.actor_id}
                className="card cardClickable"
                onClick={() => handleActorClick(a)}
              >
                <div className="cardTitle">
                  {a.first_name} {a.last_name}
                </div>
                <div className="cardSub">Rentals: {a.rental_count}</div>
              </article>
            ))}
          </div>

          <div className="detailArea">
            {selectedActor && (
              <div className="detailCard">
                <h2 className="detailTitle">
                  {selectedActor.first_name} {selectedActor.last_name}
                </h2>
                {(
                  <ul className="actorFilmList">
                    {actorFilms.map(f => (
                      <li key={f.film_id}>
                        {f.title} — rentals: {f.rental_count}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
