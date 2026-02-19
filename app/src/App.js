import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import HomePage from './pages/HomePage';
import FilmsPage from './pages/FilmsPage';
import CustomersPage from './pages/CustomersPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="appShell">
        <header className="topBar">
          <NavLink to="/" className="brand brandLink">
            <div className="brandName">FilmVault</div>
          </NavLink>
          <nav className="navLinks">
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? 'navLink navLinkActive' : 'navLink')}
              end
            >
              Home
            </NavLink>
            <NavLink
              to="/films"
              className={({ isActive }) => (isActive ? 'navLink navLinkActive' : 'navLink')}
            >
              Films
            </NavLink>
            <NavLink
              to="/customers"
              className={({ isActive }) => (isActive ? 'navLink navLinkActive' : 'navLink')}
            >
              Customers
            </NavLink>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/films" element={<FilmsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
