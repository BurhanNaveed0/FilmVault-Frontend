import { useState } from 'react';

function FilmsPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [renting, setRenting] = useState(false);
  const [rentForm, setRentForm] = useState({ customer_id: '', staff_id: '' });
  const [rentMessage, setRentMessage] = useState('');

  const handleSearch = (e) => {
    e?.preventDefault();
    const q = (query || '').trim();
    if (!q) return;
    setError('');
    setLoading(true);
    setSelectedFilm(null);
    fetch(`/api/films/search?q=${encodeURIComponent(q)}`)
      .then(r => {
        if (!r.ok) throw new Error(`Search failed (${r.status})`);
        return r.json();
      })
      .then(data => {
        setResults(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(e => {
        setResults([]);
        setError(e?.message || 'Search failed');
        setLoading(false);
      });
  };

  const handleFilmClick = (film) => {
    setSelectedFilm(null);
    setAvailability(null);
    setRentMessage('');
    setLoadingDetail(true);
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
        setRentForm({ customer_id: '', staff_id: '' });
        setLoadingDetail(false);
      })
      .catch(e => {
        setSelectedFilm(null);
        setAvailability(null);
        setError(e?.message || 'Failed to load film details');
        setLoadingDetail(false);
      });
  };

  const handleRent = (e) => {
    e.preventDefault();
    const { customer_id, staff_id } = rentForm;
    if (!selectedFilm || !customer_id?.trim() || !staff_id?.trim()) {
      setRentMessage('Please enter both Customer ID and Staff ID.');
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
        staff_id: Number(staff_id),
      }),
    })
      .then(r => {
        if (!r.ok) throw new Error(r.status === 400 ? 'Invalid request' : `Rent failed (${r.status})`);
        return r.json();
      })
      .then(() => {
        setRentMessage('Rental recorded successfully.');
        setRentForm({ customer_id: '', staff_id: '' });
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

  return (
    <main className="content">
      <section className="section">
        <div className="sectionHeader">
          <div className="sectionTitle">Search Films</div>
        </div>
        <form onSubmit={handleSearch} className="searchForm">
          <input
            type="text"
            className="searchInput"
            placeholder="Search by film title, actor name, or genre..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search films"
          />
          <button type="submit" className="searchBtn" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
        {error && <p className="pill pillError">{error}</p>}
      </section>

      {results.length > 0 && (
        <section className="section">
          <div className="sectionHeader">
            <div className="sectionTitle">Results</div>
          </div>
          <div className="grid">
            {results.map(f => (
              <article
                key={f.film_id}
                className={`card cardClickable ${selectedFilm?.film_id === f.film_id ? 'cardSelected' : ''}`}
                onClick={() => handleFilmClick(f)}
              >
                <div className="cardTitle">{f.title}</div>
                {f.release_year && <div className="cardSub">{f.release_year}</div>}
              </article>
            ))}
          </div>
        </section>
      )}

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
              <div className="rentFormRow">
                <label htmlFor="rent-staff-id">Staff ID</label>
                <input
                  id="rent-staff-id"
                  type="number"
                  placeholder="e.g. 1"
                  value={rentForm.staff_id}
                  onChange={(e) => setRentForm(f => ({ ...f, staff_id: e.target.value }))}
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

      {loadingDetail && (
        <div className="detailArea">
          <p className="detailMeta">Loading film details...</p>
        </div>
      )}
    </main>
  );
}

export default FilmsPage;
