import { useEffect, useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { Building2, LayoutDashboard, Users, Hotel, LogIn, ShieldCheck, CalendarDays, BedDouble, CheckCircle2, Clock3, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import axios from 'axios';

type AuthState = {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
};

const AUTH_STORAGE_KEY = 'travelconnect-auth';

function getStoredAuth(): AuthState | null {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as AuthState;
  } catch {
    return null;
  }
}

function persistAuth(auth: AuthState | null) {
  if (typeof window === 'undefined') return;
  if (!auth) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

function App() {
  const [auth, setAuth] = useState<AuthState | null>(getStoredAuth());

  useEffect(() => {
    persistAuth(auth);
  }, [auth]);

  const handleLogout = () => {
    setAuth(null);
  };

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
          <div className="topbar-actions">
            {auth ? <span className="status-badge confirmed">Signed in as {auth.user.email}</span> : <span className="status-badge pending">Not signed in</span>}
            {auth ? <button className="secondary-btn" onClick={handleLogout}>Logout</button> : <NavLink to="/auth" className="primary-btn">Sign in</NavLink>}
          </div>
        </header>

        <Routes>
          <Route path="/" element={<DashboardPage auth={auth} />} />
          <Route path="/users" element={<UsersPage auth={auth} />} />
          <Route path="/hotels" element={<HotelsPage auth={auth} />} />
          <Route path="/bookings" element={<BookingsPage auth={auth} />} />
          <Route path="/auth" element={<AuthPage auth={auth} onAuthChange={setAuth} />} />
        </Routes>
      </main>
    </div>
  );
}

function DashboardPage({ auth }: { auth: AuthState | null }) {
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

function UsersPage({ auth }: { auth: AuthState | null }) {
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

function HotelsPage({ auth }: { auth: AuthState | null }) {
  const [hotels, setHotels] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('South Africa');
  const [status, setStatus] = useState('pending');
  const [editingHotelId, setEditingHotelId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [roomCategory, setRoomCategory] = useState('standard');
  const [roomPrice, setRoomPrice] = useState('');
  const [roomInventory, setRoomInventory] = useState('1');
  const [availabilityDate, setAvailabilityDate] = useState('');
  const [availabilityCount, setAvailabilityCount] = useState('1');

  const loadHotels = async () => {
    if (!auth?.token) {
      setHotels([]);
      return;
    }

    try {
      const response = await axios.get('/api/hotels', { headers: { Authorization: `Bearer ${auth.token}` } });
      setHotels(response.data.hotels || []);
    } catch {
      setHotels([]);
    }
  };

  useEffect(() => {
    loadHotels();
  }, [auth?.token]);

  const resetHotelForm = () => {
    setName('');
    setCity('');
    setCountry('South Africa');
    setStatus('pending');
    setEditingHotelId(null);
  };

  const handleCreateOrUpdateHotel = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editingHotelId) {
        await axios.put(`/api/hotels/${editingHotelId}`, { name, city, country, status }, { headers: { Authorization: `Bearer ${auth?.token}` } });
      } else {
        await axios.post('/api/hotels', { name, city, country, status }, { headers: { Authorization: `Bearer ${auth?.token}` } });
      }
      resetHotelForm();
      await loadHotels();
    } catch {
      // No-op for now
    }
  };

  const handleEditHotel = (hotel: any) => {
    setEditingHotelId(hotel.id);
    setName(hotel.name);
    setCity(hotel.city);
    setCountry(hotel.country);
    setStatus(hotel.status);
  };

  const handleDeleteHotel = async (hotelId: string) => {
    try {
      await axios.delete(`/api/hotels/${hotelId}`, { headers: { Authorization: `Bearer ${auth?.token}` } });
      await loadHotels();
    } catch {
      // No-op for now
    }
  };

  const handleCreateRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    const hotelId = hotels[0]?.id;
    if (!hotelId) return;
    try {
      await axios.post(`/api/hotels/${hotelId}/rooms`, { name: roomName, category: roomCategory, price: roomPrice, inventory: roomInventory }, { headers: { Authorization: `Bearer ${auth?.token}` } });
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
      await axios.post(`/api/hotels/${hotelId}/availability`, { roomId: 'placeholder-room', date: availabilityDate, available: availabilityCount }, { headers: { Authorization: `Bearer ${auth?.token}` } });
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
        <form className="form-stack" onSubmit={handleCreateOrUpdateHotel}>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Hotel name" />
          <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City" />
          <input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="Country" />
          <input value={status} onChange={(event) => setStatus(event.target.value)} placeholder="Status" />
          <div className="inline-actions">
            <button className="primary-btn" type="submit">{editingHotelId ? 'Update hotel' : 'Create hotel'}</button>
            {editingHotelId ? <button className="secondary-btn" type="button" onClick={resetHotelForm}>Cancel</button> : null}
          </div>
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
        <div className="inline-list">
          {hotels.map((hotel) => (
            <div className="inline-row" key={hotel.id}>
              <div>
                <strong>{hotel.name}</strong>
                <div className="meta">{hotel.city}, {hotel.country}</div>
              </div>
              <div className="inline-actions">
                <span className={`status-badge ${hotel.status}`}>{hotel.status}</span>
                <button className="icon-btn" type="button" onClick={() => handleEditHotel(hotel)}><Pencil size={14} /></button>
                <button className="icon-btn danger" type="button" onClick={() => handleDeleteHotel(hotel.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function BookingsPage({ auth }: { auth: AuthState | null }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [guestName, setGuestName] = useState('');
  const [hotelId, setHotelId] = useState('');
  const [status, setStatus] = useState('pending');
  const [statusUpdate, setStatusUpdate] = useState('confirmed');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const loadBookings = async () => {
    if (!auth?.token) {
      setBookings([]);
      return;
    }

    try {
      const response = await axios.get('/api/bookings', { headers: { Authorization: `Bearer ${auth.token}` } });
      setBookings(response.data.bookings || []);
    } catch {
      setBookings([]);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [auth?.token]);

  const resetBookingForm = () => {
    setGuestName('');
    setHotelId('');
    setStatus('pending');
    setSelectedBookingId(null);
    setStatusUpdate('confirmed');
  };

  const handleCreateBooking = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await axios.post('/api/bookings', { guestName, hotelId, status }, { headers: { Authorization: `Bearer ${auth?.token}` } });
      resetBookingForm();
      await loadBookings();
    } catch {
      // No-op for now
    }
  };

  const handleSelectBooking = (booking: any) => {
    setSelectedBookingId(booking.id);
    setStatusUpdate(booking.status || 'confirmed');
  };

  const handleStatusUpdate = async () => {
    if (!selectedBookingId) return;
    try {
      await axios.post(`/api/bookings/${selectedBookingId}/status`, { status: statusUpdate || 'confirmed' }, { headers: { Authorization: `Bearer ${auth?.token}` } });
      setStatusUpdate('confirmed');
      await loadBookings();
    } catch {
      // No-op for now
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      await axios.delete(`/api/bookings/${bookingId}`, { headers: { Authorization: `Bearer ${auth?.token}` } });
      await loadBookings();
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
        <div className="inline-list">
          {bookings.map((booking) => (
            <div className="inline-row" key={booking.id}>
              <div>
                <strong>{booking.guestName}</strong>
                <div className="meta">Hotel {booking.hotelId}</div>
              </div>
              <div className="inline-actions">
                <span className={`status-badge ${booking.status}`}>{booking.status}</span>
                <button className="icon-btn" type="button" onClick={() => handleSelectBooking(booking)}><Pencil size={14} /></button>
                <button className="icon-btn danger" type="button" onClick={() => handleDeleteBooking(booking.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
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
          <button className="primary-btn" type="button" onClick={handleStatusUpdate}>Update selected booking</button>
        </div>
      </article>
    </section>
  );
}

function AuthPage({ auth, onAuthChange }: { auth: AuthState | null; onAuthChange: (auth: AuthState | null) => void }) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await axios.post('/api/auth/login', { email: loginEmail, password: loginPassword });
      onAuthChange(response.data);
      setMessage('Signed in successfully');
      setIsError(false);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to sign in');
      setIsError(true);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const registerResponse = await axios.post('/api/auth/register', { name: registerName, email: registerEmail, password: registerPassword });
      if (registerResponse.data.success) {
        const loginResponse = await axios.post('/api/auth/login', { email: registerEmail, password: registerPassword });
        onAuthChange(loginResponse.data);
        setMessage('Account created and signed in');
        setIsError(false);
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to create account');
      setIsError(true);
    }
  };

  return (
    <section className="grid two-col">
      {message ? <div className={`message ${isError ? 'error' : 'success'}`}>{message}</div> : null}
      <article className="card auth-card">
        <h3>Login</h3>
        <form className="form-stack" onSubmit={handleLogin}>
          <input value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} placeholder="Email" />
          <input value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} placeholder="Password" type="password" />
          <button className="primary-btn" type="submit">Sign in</button>
        </form>
      </article>
      <article className="card auth-card">
        <h3>Register</h3>
        <form className="form-stack" onSubmit={handleRegister}>
          <input value={registerName} onChange={(event) => setRegisterName(event.target.value)} placeholder="Full name" />
          <input value={registerEmail} onChange={(event) => setRegisterEmail(event.target.value)} placeholder="Email" />
          <input value={registerPassword} onChange={(event) => setRegisterPassword(event.target.value)} placeholder="Password" type="password" />
          <button className="primary-btn" type="submit">Create account</button>
        </form>
      </article>
      {auth ? <div className="message success">You are currently signed in and can manage hotels and bookings.</div> : null}
    </section>
  );
}

export default App;
