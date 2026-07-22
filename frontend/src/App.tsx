import { Routes, Route, NavLink } from 'react-router-dom';
import { Building2, LayoutDashboard, Users, Hotel, LogIn, ShieldCheck, CalendarDays } from 'lucide-react';

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">TC</div>
          <div>
            <h1>TravelConnect SA</h1>
            <p>Tourism SaaS Platform</p>
          </div>
        </div>

        <nav className="nav-links">
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><LayoutDashboard size={18} /> Dashboard</NavLink>
          <NavLink to="/users" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><Users size={18} /> Users</NavLink>
          <NavLink to="/hotels" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><Hotel size={18} /> Hotels</NavLink>
          <NavLink to="/bookings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><CalendarDays size={18} /> Bookings</NavLink>
          <NavLink to="/auth" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><LogIn size={18} /> Auth</NavLink>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">TravelConnect Africa (Pty) Ltd</p>
            <h2>Modern tourism operations at scale</h2>
          </div>
          <button className="primary-btn">+ New Booking</button>
        </header>

        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/hotels" element={<HotelsPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </main>
    </div>
  );
}

function DashboardPage() {
  return (
    <section className="grid">
      <article className="card hero-card">
        <div>
          <p className="eyebrow">Super Admin Dashboard</p>
          <h3>Operational visibility for Africa’s hotels and travel partners</h3>
          <p>Monitor bookings, users, hotels, and platform health from a single responsive control center.</p>
        </div>
        <div className="stats-grid">
          <div className="stat-box"><strong>124</strong><span>Users</span></div>
          <div className="stat-box"><strong>38</strong><span>Hotels</span></div>
          <div className="stat-box"><strong>512</strong><span>Bookings</span></div>
          <div className="stat-box"><strong>R2.9M</strong><span>Revenue</span></div>
        </div>
      </article>

      <article className="card">
        <div className="card-title"><ShieldCheck size={18}/> Platform Health</div>
        <ul className="list">
          <li>RBAC enabled</li>
          <li>Secure sessions and JWT</li>
          <li>Audit logging active</li>
        </ul>
      </article>

      <article className="card">
        <div className="card-title"><Building2 size={18}/> Properties</div>
        <ul className="list">
          <li>7 new approvals pending</li>
          <li>8 amenities configured</li>
          <li>3 properties need images</li>
        </ul>
      </article>
    </section>
  );
}

function UsersPage() {
  return <section className="card"><h3>User Management</h3><p>Create, approve, suspend, and assign roles from a unified administration experience.</p></section>;
}

function HotelsPage() {
  return <section className="card"><h3>Hotel Management</h3><p>Register properties, manage rooms, pricing, amenities, availability, and gallery content.</p></section>;
}

function BookingsPage() {
  return <section className="card"><h3>Bookings</h3><p>Track stay reservations, status changes, and payment readiness across the platform.</p></section>;
}

function AuthPage() {
  return (
    <section className="grid two-col">
      <article className="card auth-card">
        <h3>Login</h3>
        <form className="form-stack">
          <input placeholder="Email" />
          <input placeholder="Password" type="password" />
          <button className="primary-btn">Sign in</button>
        </form>
      </article>
      <article className="card auth-card">
        <h3>Register</h3>
        <form className="form-stack">
          <input placeholder="Full name" />
          <input placeholder="Email" />
          <input placeholder="Password" type="password" />
          <button className="primary-btn">Create account</button>
        </form>
      </article>
    </section>
  );
}

export default App;
