import { Routes, Route, NavLink } from 'react-router-dom';
import { Building2, LayoutDashboard, Users, Hotel, LogIn, ShieldCheck, CalendarDays, BedDouble, CheckCircle2, Clock3, PlusCircle } from 'lucide-react';

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
  return (
    <section className="grid">
      <article className="card">
        <h3>User Management</h3>
        <p>Create, approve, suspend, and assign roles from a unified administration experience.</p>
      </article>
      <article className="card">
        <div className="card-title"><Users size={18} /> Admin Actions</div>
        <ul className="list">
          <li>Approve new partner accounts</li>
          <li>Assign super admin or hotel admin roles</li>
          <li>Review login history and access changes</li>
        </ul>
      </article>
    </section>
  );
}

function HotelsPage() {
  return (
    <section className="grid">
      <article className="card">
        <div className="card-title"><Building2 size={18} /> Hotel Administration</div>
        <p>Register properties, manage rooms, pricing, availability, and approval states from a single admin workspace.</p>
        <div className="form-stack">
          <input placeholder="Hotel name" />
          <input placeholder="City" />
          <input placeholder="Country" />
          <button className="primary-btn">Create hotel</button>
        </div>
      </article>

      <article className="card">
        <div className="card-title"><BedDouble size={18} /> Rooms & Pricing</div>
        <ul className="list">
          <li>Add deluxe, suite, and standard room categories</li>
          <li>Set nightly pricing and inventory count</li>
          <li>Link room inventory to availability calendars</li>
        </ul>
      </article>

      <article className="card">
        <div className="card-title"><CalendarDays size={18} /> Availability Calendar</div>
        <ul className="list">
          <li>Block dates when rooms are unavailable</li>
          <li>Adjust availability for peak travel periods</li>
          <li>Keep room inventory aligned with real bookings</li>
        </ul>
      </article>

      <article className="card">
        <div className="card-title"><CheckCircle2 size={18} /> Approval Queue</div>
        <ul className="list">
          <li>Approve or reject hotel submissions</li>
          <li>Flag properties that need updates</li>
          <li>Track status history for review audits</li>
        </ul>
      </article>
    </section>
  );
}

function BookingsPage() {
  return (
    <section className="grid">
      <article className="card">
        <div className="card-title"><CalendarDays size={18} /> Booking Operations</div>
        <p>Review pending bookings, approve confirmations, and monitor status changes across the platform.</p>
      </article>

      <article className="card">
        <div className="card-title"><Clock3 size={18} /> Booking Queue</div>
        <ul className="list">
          <li>Pending stays requiring confirmation</li>
          <li>Confirmed bookings with active reservations</li>
          <li>Cancelled bookings with audit trail details</li>
        </ul>
      </article>

      <article className="card">
        <div className="card-title"><PlusCircle size={18} /> Create Booking</div>
        <div className="form-stack">
          <input placeholder="Guest name" />
          <input placeholder="Hotel ID" />
          <input placeholder="Booking status" />
          <button className="primary-btn">Create booking</button>
        </div>
      </article>
    </section>
  );
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
