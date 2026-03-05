import { useEffect, useState } from 'react';

function CustomersPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 20 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ first_name: '', last_name: '', email: '' });
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    params.set('page', String(page));
    params.set('page_size', String(pageSize));

    fetch(`/api/customers?${params.toString()}`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load customers (${r.status})`);
        return r.json();
      })
      .then(json => {
        if (cancelled) return;
        setData({
          items: Array.isArray(json.items) ? json.items : [],
          total: json.total ?? 0,
          page: json.page ?? page,
          page_size: json.page_size ?? pageSize,
        });
        setLoading(false);
      })
      .catch(e => {
        if (cancelled) return;
        setData({ items: [], total: 0, page, page_size: pageSize });
        setError(e?.message || 'Failed to load customers');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [q, page, pageSize]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const first_name = form.first_name.trim();
    const last_name = form.last_name.trim();
    const email = form.email.trim();
    if (!first_name || !last_name) {
      setCreateMessage('First name and last name are required.');
      return;
    }
    setCreating(true);
    setCreateMessage('');
    fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name, last_name, email: email || undefined }),
    })
      .then(r => {
        if (!r.ok) throw new Error(`Create failed (${r.status})`);
        return r.json();
      })
      .then(newCustomer => {
        setForm({ first_name: '', last_name: '', email: '' });
        setCreateMessage('Customer created successfully.');
        setCreating(false);
        setData(prev => ({
          ...prev,
          items: [newCustomer, ...prev.items].slice(0, prev.page_size),
          total: (prev.total ?? 0) + 1,
        }));
      })
      .catch(e => {
        setCreateMessage(e?.message || 'Failed to create customer.');
        setCreating(false);
      });
  };

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / (data.page_size || pageSize)));

  return (
    <main className="content">
      <section className="section">
        <div className="sectionHeader">
          <div className="sectionTitle">Customers</div>
          <div className="metaLeft">
            {loading ? <span className="pill">Loading…</span> : null}
            {error ? <span className="pill pillError">{error}</span> : null}
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="searchForm">
          <input
            type="text"
            className="searchInput"
            placeholder="Search by ID, first name, or last name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="submit" className="searchBtn" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        <div style={{ marginTop: 18, overflowX: 'auto' }}>
          <table className="customersTable">
            <thead>
              <tr>
                <th>ID</th>
                <th>First name</th>
                <th>Last name</th>
                <th>Email</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '10px 0' }}>
                    No customers found.
                  </td>
                </tr>
              )}
              {data.items.map(c => (
                <tr key={c.customer_id}>
                  <td>{c.customer_id}</td>
                  <td>{c.first_name}</td>
                  <td>{c.last_name}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.create_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="metaRow" style={{ marginTop: 16 }}>
          <div className="pagination">
            <button
              type="button"
              className="paginationBtn"
              disabled={page <= 1 || loading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="paginationInfo">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="paginationBtn"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <div className="sectionTitle">Add New Customer</div>
        </div>
        <form onSubmit={handleCreate} className="rentForm">
          <div className="rentFormRow">
            <label htmlFor="new-first-name">First name</label>
            <input
              id="new-first-name"
              type="text"
              value={form.first_name}
              onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))}
            />
          </div>
          <div className="rentFormRow">
            <label htmlFor="new-last-name">Last name</label>
            <input
              id="new-last-name"
              type="text"
              value={form.last_name}
              onChange={(e) => setForm(f => ({ ...f, last_name: e.target.value }))}
            />
          </div>
          <div className="rentFormRow">
            <label htmlFor="new-email">Email (optional)</label>
            <input
              id="new-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <button type="submit" className="searchBtn" disabled={creating}>
            {creating ? 'Creating…' : 'Create customer'}
          </button>
          {createMessage && (
            <p className={createMessage.includes('success') ? 'rentSuccess' : 'rentError'}>
              {createMessage}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}

export default CustomersPage;
