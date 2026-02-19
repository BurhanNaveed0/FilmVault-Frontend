import { useEffect, useState } from 'react';

function HomePage() {
  const [films, setFilms] = useState([]);
  const [actors, setActors] = useState([]);
  const [loadingFilms, setLoadingFilms] = useState(false);
  const [loadingActors, setLoadingActors] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [loadingFilmDetail, setLoadingFilmDetail] = useState(false);
  const [selectedActor, setSelectedActor] = useState(null);
  const [actorFilms, setActorFilms] = useState([]);
  const [loadingActorFilms, setLoadingActorFilms] = useState(false);
  const [renting, setRenting] = useState(false);
  const [rentForm, setRentForm] = useState({ customer_id: '' });
  const [rentMessage, setRentMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
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
        setLoadingFilms(false);
      });

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
        setLoadingActors(false);
      });

    return () => { cancelled = true; };
  }, []);

  const handleFilmClick = film => {
    setSelectedFilm(null);
    setAvailability(null);
    setLoadingFilmDetail(true);
    Promise.all([
      fetch(`/api/films/${film.film_id}`).then(r => {
        if (!r.ok) throw new Error(`Failed to load film (${r.status})`);
        return r.json();
      }),
      fetch(`/api/films/${film.film_id}/availability`).then(r => {
        if (r.status === 404) return null;
        if (!r.ok) throw new Error(`Failed to load availability (${r.status})`);
        return r.json();
      }),
    ])
      .then(([detail, avail]) => {
        setSelectedFilm(detail);
        setAvailability(avail);
        setRentForm({ customer_id: '' });
        setLoadingFilmDetail(false);
      })
      .catch(e => {
        setSelectedFilm(null);
        setAvailability(null);
        setLoadingFilmDetail(false);
      });
  };

const handleRent = (e) => {
    e.preventDefault();
    const { customer_id } = rentForm;
    if (!selectedFilm || !customer_id?.trim()) {
      setRentMessage('Please enter Customer ID.');
      return;
    }
    setRentMessage('');
    setRenting(true);
    fetch('/api/rentals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        film_id: selectedFilm.film_id,
        customer_id: Number(customer_id),
        staff_id: 1,
      }),
    })
      .then(r => {
        if (!r.ok) throw new Error(r.status === 400 ? 'Invalid request' : `Rent failed (${r.status})`);
        return r.json();
      })
      .then(() => {
        setRentMessage('Rental recorded successfully.');
        setRentForm({ customer_id: '' });
        setRenting(false);
        fetch(`/api/films/${selectedFilm.film_id}/availability`)
          .then(r => (r?.ok ? r.json() : null))
          .then(avail => { if (avail) setAvailability(avail); })
          .catch(() => {});
      })
      .catch(e => {
        setRentMessage(e?.message || 'Rental failed.');
        setRenting(false);
      });
  };

  const handleActorClick = actor => {
    setSelectedActor(actor);
    setActorFilms([]);
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
        setLoadingActorFilms(false);
      });
  };

  return (
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
        <section className="section">
          <div className="sectionHeader">
            <div className="sectionTitle">Film Details</div>
          </div>
          <article className="detailCard">
            <h2 className="detailTitle">
              {selectedFilm.title}{' '}
              {selectedFilm.release_year ? `(${selectedFilm.release_year})` : ''}
            </h2>
            <div className="detailMeta">
              {selectedFilm.rating && <span>{selectedFilm.rating}</span>}
              {selectedFilm.length != null && <span>{selectedFilm.length} min</span>}
              {(selectedFilm.categories || []).length > 0 && (
                <span>{(selectedFilm.categories || []).join(' • ')}</span>
              )}
            </div>
            {selectedFilm.description && (
              <p className="detailDescription">{selectedFilm.description}</p>
            )}
            {(selectedFilm.actors || []).length > 0 && (
              <div className="detailMeta" style={{ marginTop: 12 }}>
                <span>Actors: {(selectedFilm.actors || []).map(a => `${a.first_name} ${a.last_name}`).join(', ')}</span>
              </div>
            )}
            {availability && (
              <div className="detailMeta availabilityBlock">
                <span><strong>Availability:</strong> {availability.available} of {availability.total_copies} copies available</span>
                <span>{availability.rented} currently rented</span>
              </div>
            )}

            <form onSubmit={handleRent} className="rentForm">
              <h3 className="rentFormTitle">Rent this film</h3>
              <div className="rentFormRow">
                <label htmlFor="rent-customer-id">Customer ID</label>
                <input
                  id="rent-customer-id"
                  type="number"
                  placeholder="e.g. 1"
                  value={rentForm.customer_id}
                  onChange={(e) => setRentForm(f => ({ ...f, customer_id: e.target.value }))}
                />
              </div>
              <button type="submit" className="searchBtn" disabled={renting}>
                {renting ? 'Processing...' : 'Rent Film'}
              </button>
              {rentMessage && <p className={rentMessage.includes('success') ? 'rentSuccess' : 'rentError'}>{rentMessage}</p>}
            </form>
          </article>
        </section>
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
              <div className="cardTitle">{a.first_name} {a.last_name}</div>
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
              <ul className="actorFilmList">
                {actorFilms.map(f => (
                  <li key={f.film_id}>
                    {f.title} — rentals: {f.rental_count}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default HomePage;
