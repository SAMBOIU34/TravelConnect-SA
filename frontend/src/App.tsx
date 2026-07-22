import { useEffect, useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { Building2, LayoutDashboard, Users, Hotel, LogIn, ShieldCheck, CalendarDays, BedDouble, CheckCircle2, Clock3, PlusCircle } from 'lucide-react';
import axios from 'axios';

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
  const [hotels, setHotels] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('South Africa');
  const [status, setStatus] = useState('pending');
  const [roomName, setRoomName] = useState('');
  const [roomCategory, setRoomCategory] = useState('standard');
  const [roomPrice, setRoomPrice] = useState('');
  const [roomInventory, setRoomInventory] = useState('1');
  const [availabilityDate, setAvailabilityDate] = useState('');
  const [availabilityCount, setAvailabilityCount] = useState('1');

  const loadHotels = async () => {
    try {
      const response = await axios.get('/api/hotels', { headers: { Authorization: 'Bearer test-token' } });
      setHotels(response.data.hotels || []);
    } catch {
      setHotels([]);
    }
  };

  useEffect(() => {
    loadHotels();
  }, []);

  const handleCreateHotel = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await axios.post('/api/hotels', { name, city, country, status }, { headers: { Authorization: 'Bearer test-token' } });
      setName('');
      setCity('');
      setCountry('South Africa');
      setStatus('pending');
      loadHotels();
    } catch {
      // No-op for now
    }
  };

  const handleCreateRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    const hotelId = hotels[0]?.id;
    if (!hotelId) return;
    try {
      await axios.post(`/api/hotels/${hotelId}/rooms`, { name: roomName, category: roomCategory, price: roomPrice, inventory: roomInventory }, { headers: { Authorization: 'Bearer test-token' } });
      setRoomName('');
      setRoomCategory('standard');
      setRoomPrice('');
      setRoomInventory('1');
    } catch {
      // No-op for now
    }
  };

  const handleCreateAvailability = async (event: React.FormEvent) => {
    event.preventDefault();
    const hotelId = hotels[0]?.id;
    if (!hotelId) return;
    try {
      await axios.post(`/api/hotels/${hotelId}/availability`, { roomId: 'placeholder-room', date: availabilityDate, available: availabilityCount }, { headers: { Authorization: 'Bearer test-token' } });
      setAvailabilityDate('');
      setAvailabilityCount('1');
    } catch {
      // No-op for now
    }
  };

  return (
    <section className="grid">
      <article className="card">
        <div className="card-title"><Building2 size={18} /> Hotel Administration</div>
        <p>Register properties, manage rooms, pricing, availability, and approval states from a single admin workspace.</p>
        <form className="form-stack" onSubmit={handleCreateHotel}>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Hotel name" />
          <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City" />
          <input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="Country" />
          <input value={status} onChange={(event) => setStatus(event.target.value)} placeholder="Status" />
          <button className="primary-btn" type="submit">Create hotel</button>
        </form>
      </article>

      <article className="card">
        <div className="card-title"><BedDouble size={18} /> Rooms & Pricing</div>
        <form className="form-stack" onSubmit={handleCreateRoom}>
          <input value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder="Room name" />
          <input value={roomCategory} onChange={(event) => setRoomCategory(event.target.value)} placeholder="Room category" />
          <input value={roomPrice} onChange={(event) => setRoomPrice(event.target.value)} placeholder="Price" />
          <input value={roomInventory} onChange={(event) => setRoomInventory(event.target.value)} placeholder="Inventory" />
          <button className="primary-btn" type="submit">Add room</button>
        </form>
      </article>

      <article className="card">
        <div className="card-title"><CalendarDays size={18} /> Availability Calendar</div>
        <form className="form-stack" onSubmit={handleCreateAvailability}>
          <input value={availabilityDate} onChange={(event) => setAvailabilityDate(event.target.value)} placeholder="Date (YYYY-MM-DD)" />
          <input value={availabilityCount} onChange={(event) => setAvailabilityCount(event.target.value)} placeholder="Available count" />
          <button className="primary-btn" type="submit">Set availability</button>
        </form>
      </article>

      <article className="card">
        <div className="card-title"><CheckCircle2 size={18} /> Approval Queue</div>
        <ul className="list">
          {hotels.map((hotel) => (
            <li key={hotel.id}>{hotel.name} — {hotel.status}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}

function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [guestName, setGuestName] = useState('');
  const [hotelId, setHotelId] = useState('');
  const [status, setStatus] = useState('pending');
  const [statusUpdate, setStatusUpdate] = useState('');

  const loadBookings = async () => {
    try {
      const response = await axios.get('/api/bookings', { headers: { Authorization: 'Bearer test-token' } });
      setBookings(response.data.bookings || []);
    } catch {
      setBookings([]);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCreateBooking = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await axios.post('/api/bookings', { guestName, hotelId, status }, { headers: { Authorization: 'Bearer test-token' } });
      setGuestName('');
      setHotelId('');
      setStatus('pending');
      loadBookings();
    } catch {
      // No-op for now
    }
  };

  const handleStatusUpdate = async (bookingId: string) => {
    try {
      await axios.post(`/api/bookings/${bookingId}/status`, { status: statusUpdate || 'confirmed' }, { headers: { Authorization: 'Bearer test-token' } });
      setStatusUpdate('');
      loadBookings();
    } catch {
      // No-op for now
    }
  };

  return (
    <section className="grid">
      <article className="card">
        <div className="card-title"><CalendarDays size={18} /> Booking Operations</div>
        <p>Review pending bookings, approve confirmations, and monitor status changes across the platform.</p>
      </article>

      <article className="card">
        <div className="card-title"><Clock3 size={18} /> Booking Queue</div>
        <ul className="list">
          {bookings.map((booking) => (
            <li key={booking.id}>{booking.guestName} — {booking.status}</li>
          ))}
        </ul>
      </article>

      <article className="card">
        <div className="card-title"><PlusCircle size={18} /> Create Booking</div>
        <form className="form-stack" onSubmit={handleCreateBooking}>
          <input value={guestName} onChange={(event) => setGuestName(event.target.value)} placeholder="Guest name" />
          <input value={hotelId} onChange={(event) => setHotelId(event.target.value)} placeholder="Hotel ID" />
          <input value={status} onChange={(event) => setStatus(event.target.value)} placeholder="Booking status" />
          <button className="primary-btn" type="submit">Create booking</button>
        </form>
      </article>

      <article className="card">
        <div className="card-title"><CheckCircle2 size={18} /> Update Booking Status</div>
        <div className="form-stack">
          <input value={statusUpdate} onChange={(event) => setStatusUpdate(event.target.value)} placeholder="New status" />
          <button className="primary-btn" onClick={() => bookings[0] && handleStatusUpdate(bookings[0].id)}>Update selected booking</button>
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
