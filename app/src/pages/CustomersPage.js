import { useEffect, useState } from 'react';

function CustomersPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 20 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');

  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '' });
  const [editing, setEditing] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [returningRentalId, setReturningRentalId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

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

    return () => { cancelled = true; };
  }, [q, page, pageSize]);

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(null);
    setDetailError('');
    setEditMessage('');
    setDeleteConfirm(false);
    setLoadingDetail(true);
    fetch(`/api/customers/${customer.customer_id}`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load customer (${r.status})`);
        return r.json();
      })
      .then(cust => {
        setSelectedCustomer(cust);
        setEditForm({
          first_name: cust.first_name || '',
          last_name: cust.last_name || '',
          email: cust.email || '',
        });
        setLoadingDetail(false);
      })
      .catch(e => {
        setSelectedCustomer(null);
        setDetailError(e?.message || 'Failed to load customer');
        setLoadingDetail(false);
      });
  };

  const handleEdit = (e) => {
    e.preventDefault();
    const first_name = editForm.first_name.trim();
    const last_name = editForm.last_name.trim();
    const email = editForm.email.trim();
    if (!first_name && !last_name && !email) {
      setEditMessage('At least one field (first name, last name, or email) is required.');
      return;
    }
    setEditing(true);
    setEditMessage('');
    const body = {};
    if (first_name) body.first_name = first_name;
    if (last_name) body.last_name = last_name;
    if (email) body.email = email;

    fetch(`/api/customers/${selectedCustomer.customer_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(r => {
        if (!r.ok) throw new Error(`Update failed (${r.status})`);
        return r.json();
      })
      .then(updated => {
        setSelectedCustomer(updated);
        setEditForm({ first_name: updated.first_name || '', last_name: updated.last_name || '', email: updated.email || '' });
        setEditMessage('Customer updated successfully.');
        setEditing(false);
        setData(prev => ({
          ...prev,
          items: prev.items.map(c => c.customer_id === updated.customer_id ? updated : c),
        }));
      })
      .catch(e => {
        setEditMessage(e?.message || 'Failed to update customer.');
        setEditing(false);
      });
  };

  const handleDelete = () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setDeleting(true);
    fetch(`/api/customers/${selectedCustomer.customer_id}`, { method: 'DELETE' })
      .then(r => {
        if (!r.ok) throw new Error(`Deactivate failed (${r.status})`);
        return r.json();
      })
      .then(() => {
        setSelectedCustomer(null);
        setDeleting(false);
        setDeleteConfirm(false);
        setData(prev => ({
          ...prev,
          items: prev.items.filter(c => c.customer_id !== selectedCustomer.customer_id),
          total: Math.max(0, (prev.total ?? 1) - 1),
        }));
      })
      .catch(e => {
        setEditMessage(e?.message || 'Failed to deactivate customer.');
        setDeleting(false);
      });
  };

  const handleMarkReturned = (rentalId) => {
    setReturningRentalId(rentalId);
    fetch(`/api/rentals/${rentalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(r => {
        if (r.status === 409) throw new Error('Rental already returned.');
        if (!r.ok) throw new Error(`Return failed (${r.status})`);
        return r.json();
      })
      .then(() => {
        return fetch(`/api/customers/${selectedCustomer.customer_id}`).then(r => r.json());
      })
      .then(updated => {
        setSelectedCustomer(updated);
        setReturningRentalId(null);
      })
      .catch(e => {
        setEditMessage(e?.message || 'Failed to mark returned.');
        setReturningRentalId(null);
      });
  };

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
  const pastRentals = selectedCustomer?.rentals?.past ?? [];
  const presentRentals = selectedCustomer?.rentals?.present ?? [];

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
                <th>Active</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '10px 0' }}>
                    No customers found.
                  </td>
                </tr>
              )}
              {data.items.map(c => (
                <tr
                  key={c.customer_id}
                  className={`customersTableRow ${selectedCustomer?.customer_id === c.customer_id ? 'rowSelected' : ''}`}
                  onClick={() => handleCustomerClick(c)}
                >
                  <td>{c.customer_id}</td>
                  <td>{c.first_name}</td>
                  <td>{c.last_name}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.active ? 'Yes' : 'No'}</td>
                  <td>{c.create_date || '—'}</td>
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

      {loadingDetail && (
        <section className="section">
          <div className="detailCard">
            <p className="detailMeta">Loading customer details…</p>
          </div>
        </section>
      )}

      {detailError && (
        <section className="section">
          <div className="detailCard">
            <p className="rentError">{detailError}</p>
          </div>
        </section>
      )}

      {selectedCustomer && !loadingDetail && (
        <section className="section">
          <div className="sectionHeader">
            <div className="sectionTitle">Customer Details</div>
          </div>
          <article className="detailCard">
            <h2 className="detailTitle">
              {selectedCustomer.first_name} {selectedCustomer.last_name}
            </h2>
            <div className="detailMeta">
              <span>ID: {selectedCustomer.customer_id}</span>
              <span>Email: {selectedCustomer.email || '—'}</span>
              <span>Active: {selectedCustomer.active ? 'Yes' : 'No'}</span>
              <span>Store: {selectedCustomer.store_id ?? '—'}</span>
              <span>Created: {selectedCustomer.create_date || '—'}</span>
            </div>

            <form onSubmit={handleEdit} className="rentForm">
              <h3 className="rentFormTitle">Edit customer</h3>
              <div className="rentFormRow">
                <label htmlFor="edit-first-name">First name</label>
                <input
                  id="edit-first-name"
                  type="text"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm(f => ({ ...f, first_name: e.target.value }))}
                  className="rentFormInputWide"
                />
              </div>
              <div className="rentFormRow">
                <label htmlFor="edit-last-name">Last name</label>
                <input
                  id="edit-last-name"
                  type="text"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm(f => ({ ...f, last_name: e.target.value }))}
                  className="rentFormInputWide"
                />
              </div>
              <div className="rentFormRow">
                <label htmlFor="edit-email">Email</label>
                <input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className="rentFormInputWide"
                />
              </div>
              <div className="customerActions">
                <button type="submit" className="searchBtn" disabled={editing}>
                  {editing ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  className="deleteBtn"
                  disabled={deleting || !selectedCustomer.active}
                  onClick={handleDelete}
                >
                  {deleteConfirm ? 'Confirm deactivate?' : (deleting ? 'Deactivating…' : 'Deactivate customer')}
                </button>
              </div>
              {editMessage && (
                <p className={editMessage.includes('success') ? 'rentSuccess' : 'rentError'}>{editMessage}</p>
              )}
            </form>

            <div className="rentalsSection">
              <h3 className="rentFormTitle">Present rentals (out)</h3>
              {presentRentals.length === 0 ? (
                <p className="detailMeta">No current rentals.</p>
              ) : (
                <ul className="rentalList">
                  {presentRentals.map(r => (
                    <li key={r.rental_id} className="rentalItem">
                      <span>{r.film_title || `Film #${r.film_id}`}</span>
                      <span className="rentalMeta">Rented: {r.rental_date}</span>
                      <button
                        type="button"
                        className="returnBtn"
                        disabled={returningRentalId === r.rental_id}
                        onClick={(e) => { e.stopPropagation(); handleMarkReturned(r.rental_id); }}
                      >
                        {returningRentalId === r.rental_id ? 'Returning…' : 'Mark returned'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rentalsSection">
              <h3 className="rentFormTitle">Past rentals</h3>
              {pastRentals.length === 0 ? (
                <p className="detailMeta">No past rentals.</p>
              ) : (
                <ul className="rentalList rentalListPast">
                  {pastRentals.map(r => (
                    <li key={r.rental_id} className="rentalItem">
                      <span>{r.film_title || `Film #${r.film_id}`}</span>
                      <span className="rentalMeta">Rented: {r.rental_date} · Returned: {r.return_date || '—'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        </section>
      )}

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
