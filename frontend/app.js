const {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext
} = React;
const API = 'http://localhost:5000';
const SPORTS = [{
  value: 'football',
  label: 'Football',
  icon: null
}, {
  value: 'cricket',
  label: 'Cricket',
  icon: null
}, {
  value: 'badminton',
  label: 'Badminton',
  icon: null
}, {
  value: 'basketball',
  label: 'Basketball',
  icon: null
}, {
  value: 'tennis',
  label: 'Tennis',
  icon: null
}, {
  value: 'volleyball',
  label: 'Volleyball',
  icon: null
}, {
  value: 'swimming',
  label: 'Swimming',
  icon: null
}, {
  value: 'boxing',
  label: 'Boxing',
  icon: null
}];
const SPORT_IMAGES = {
  football: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80',
  cricket: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=900&q=80',
  badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=900&q=80',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=900&q=80',
  tennis: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=900&q=80',
  volleyball: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=900&q=80',
  swimming: 'https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?w=900&q=80',
  boxing: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=900&q=80'
};

/* ============================
   API Helper
============================ */
const api = {
  headers: (auth = true) => {
    const h = {
      'Content-Type': 'application/json'
    };
    if (auth) {
      const t = localStorage.getItem('sa_token');
      if (t) h['Authorization'] = `Bearer ${t}`;
    }
    return h;
  },
  get: async (path, auth = false) => {
    const r = await fetch(`${API}${path}`, {
      headers: api.headers(auth)
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.error || 'Request failed');
    }
    return r.json();
  },
  post: async (path, body, auth = true) => {
    const r = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: api.headers(auth),
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.error || 'Request failed');
    }
    return r.json();
  },
  put: async (path, body) => {
    const r = await fetch(`${API}${path}`, {
      method: 'PUT',
      headers: api.headers(true),
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.error || 'Request failed');
    }
    return r.json();
  },
  delete: async path => {
    const r = await fetch(`${API}${path}`, {
      method: 'DELETE',
      headers: api.headers(true)
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.error || 'Request failed');
    }
    return r.json();
  }
};

/* ============================
   Auth
============================ */
const AuthContext = createContext(null);
function AuthProvider({
  children
}) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sa_token'));
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    if (token) {
      try {
        const p = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: p.id,
          name: p.name,
          email: p.email,
          role: p.role
        });
        const s = io(API);
        setSocket(s);
        s.on('connect', () => s.emit('join_user', p.id));
        return () => s.disconnect();
      } catch {
        localStorage.removeItem('sa_token');
        setToken(null);
      }
    } else {
      setSocket(null);
    }
    setLoading(false);
  }, [token]);
  const login = (u, t) => {
    localStorage.setItem('sa_token', t);
    setToken(t);
    setUser(u);
  };
  const logout = () => {
    localStorage.removeItem('sa_token');
    setToken(null);
    setUser(null);
  };
  return /*#__PURE__*/React.createElement(AuthContext.Provider, {
    value: {
      user,
      token,
      loading,
      socket,
      login,
      logout
    }
  }, children);
}
const useAuth = () => useContext(AuthContext);

/* ============================
   Toast
============================ */
function Toast({
  message,
  type,
  onClose
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4200);
    return () => clearTimeout(t);
  }, []);
  const colors = {
    success: '#1DB954',
    error: '#E8371A',
    info: '#3b82f6'
  };
  const labels = {
    success: 'SUCCESS',
    error: 'ERROR',
    info: 'INFO'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      top: 76,
      right: 20,
      zIndex: 9999,
      background: 'var(--surface)',
      border: `1px solid ${colors[type] || colors.info}`,
      borderLeft: `4px solid ${colors[type] || colors.info}`,
      borderRadius: 'var(--r-md)',
      padding: '14px 18px',
      maxWidth: 360,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      animation: 'slideRight 0.35s ease-out',
      boxShadow: '0 16px 40px rgba(0,0,0,0.5)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: colors[type],
      marginBottom: 3
    }
  }, labels[type] || 'INFO'), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text)',
      lineHeight: 1.5
    }
  }, message)), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--text3)',
      fontSize: 18,
      lineHeight: 1,
      padding: 0,
      marginTop: -2,
      flexShrink: 0
    }
  }, "\xD7"));
}

/* ============================
   Navbar
============================ */
function Navbar({
  currentPage,
  setPage
}) {
  const {
    user,
    logout
  } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("nav", {
    className: "navbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "navbar-inner"
  }, /*#__PURE__*/React.createElement("button", {
    className: "logo",
    onClick: () => setPage(user?.role === 'business' ? 'dashboard' : 'home')
  }, /*#__PURE__*/React.createElement("div", {
    className: "logo-mark"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
  }))), /*#__PURE__*/React.createElement("span", {
    className: "logo-text"
  }, "Sport", /*#__PURE__*/React.createElement("span", null, "Arena"))), user && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "nav-divider desktop-only"
  }), /*#__PURE__*/React.createElement("div", {
    className: "nav-links desktop-only"
  }, user.role === 'customer' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: `nav-link ${currentPage === 'home' ? 'active' : ''}`,
    onClick: () => setPage('home')
  }, "Explore"), /*#__PURE__*/React.createElement("button", {
    className: `nav-link ${currentPage === 'my-bookings' ? 'active' : ''}`,
    onClick: () => setPage('my-bookings')
  }, "My Bookings")), user.role === 'business' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: `nav-link ${currentPage === 'dashboard' ? 'active' : ''}`,
    onClick: () => setPage('dashboard')
  }, "Dashboard"), /*#__PURE__*/React.createElement("button", {
    className: `nav-link ${currentPage === 'my-arenas' ? 'active' : ''}`,
    onClick: () => setPage('my-arenas')
  }, "My Arenas")))), /*#__PURE__*/React.createElement("div", {
    className: "nav-right"
  }, user ? /*#__PURE__*/React.createElement("div", {
    className: "nav-user desktop-only"
  }, /*#__PURE__*/React.createElement("div", {
    className: "nav-avatar"
  }, user.name?.[0]?.toUpperCase()), /*#__PURE__*/React.createElement("span", {
    className: "nav-name"
  }, user.name), /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost",
    onClick: logout,
    style: {
      marginLeft: 4,
      color: 'var(--accent)',
      padding: '4px 10px'
    }
  }, "Logout")) : /*#__PURE__*/React.createElement("div", {
    className: "desktop-only",
    style: {
      gap: 8,
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost",
    onClick: () => setPage('login')
  }, "Log in"), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary btn-sm",
    onClick: () => setPage('register')
  }, "Get Started")), /*#__PURE__*/React.createElement("button", {
    className: "mobile-menu-btn mobile-only",
    onClick: () => setMobileOpen(o => !o)
  }, /*#__PURE__*/React.createElement("div", {
    className: "hamburger-line"
  }), /*#__PURE__*/React.createElement("div", {
    className: "hamburger-line",
    style: {
      width: 12
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "hamburger-line"
  }))))), mobileOpen && /*#__PURE__*/React.createElement("div", {
    className: "mobile-menu anim-slideDown"
  }, user ? /*#__PURE__*/React.createElement(React.Fragment, null, user.role === 'customer' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: "mobile-nav-link",
    onClick: () => {
      setPage('home');
      setMobileOpen(false);
    }
  }, "Explore Arenas"), /*#__PURE__*/React.createElement("button", {
    className: "mobile-nav-link",
    onClick: () => {
      setPage('my-bookings');
      setMobileOpen(false);
    }
  }, "My Bookings")), user.role === 'business' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: "mobile-nav-link",
    onClick: () => {
      setPage('dashboard');
      setMobileOpen(false);
    }
  }, "Dashboard"), /*#__PURE__*/React.createElement("button", {
    className: "mobile-nav-link",
    onClick: () => {
      setPage('my-arenas');
      setMobileOpen(false);
    }
  }, "My Arenas")), /*#__PURE__*/React.createElement("button", {
    className: "mobile-nav-link",
    onClick: logout,
    style: {
      color: 'var(--accent)'
    }
  }, "Logout")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: "mobile-nav-link",
    onClick: () => {
      setPage('login');
      setMobileOpen(false);
    }
  }, "Log In"), /*#__PURE__*/React.createElement("button", {
    className: "mobile-nav-link",
    onClick: () => {
      setPage('register');
      setMobileOpen(false);
    },
    style: {
      color: 'var(--accent)',
      fontWeight: 700
    }
  }, "Get Started"))));
}

/* ============================
   Ticker
============================ */
function Ticker() {
  const items = ['Football', 'Cricket', 'Badminton', 'Basketball', 'Tennis', 'Volleyball', 'Swimming', 'Boxing'];
  const repeated = [...items, ...items];
  return /*#__PURE__*/React.createElement("div", {
    className: "ticker"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ticker-label"
  }, "Live Now"), /*#__PURE__*/React.createElement("div", {
    style: {
      overflow: 'hidden',
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ticker-track"
  }, repeated.map((item, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "ticker-item"
  }, item, /*#__PURE__*/React.createElement("span", {
    className: "ticker-dot"
  }, "\u25CF"))))));
}

/* ============================
   Hero Section
============================ */
function HeroSection({
  setPage
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-bg"
  }, /*#__PURE__*/React.createElement("img", {
    className: "hero-bg-img",
    src: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1600&q=80",
    alt: ""
  }), /*#__PURE__*/React.createElement("div", {
    className: "hero-bg-overlay"
  }), /*#__PURE__*/React.createElement("div", {
    className: "hero-noise"
  })), /*#__PURE__*/React.createElement("div", {
    className: "hero-line"
  }), /*#__PURE__*/React.createElement("div", {
    className: "hero-grid"
  }), /*#__PURE__*/React.createElement("div", {
    className: "hero-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-tag anim-fadeUp"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-tag-dot"
  }), "Now Live In Your City"), /*#__PURE__*/React.createElement("h1", {
    className: "hero-headline anim-fadeUp d1"
  }, "Book Your Game,", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("em", null, "Own The Arena")), /*#__PURE__*/React.createElement("p", {
    className: "hero-sub anim-fadeUp d2"
  }, "Discover and reserve premium sports arenas near you. Football, Cricket, Badminton \u2014 all at your fingertips, instantly confirmed."), /*#__PURE__*/React.createElement("div", {
    className: "hero-actions anim-fadeUp d3"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: () => setPage('register'),
    style: {
      fontSize: 15,
      padding: '12px 30px'
    }
  }, "Start Booking"), /*#__PURE__*/React.createElement("button", {
    className: "btn-outline",
    onClick: () => setPage('register'),
    style: {
      fontSize: 15,
      padding: '12px 30px'
    }
  }, "List Your Arena")), /*#__PURE__*/React.createElement("div", {
    className: "hero-stats anim-fadeUp d4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "hero-stat-val"
  }, "200", /*#__PURE__*/React.createElement("span", null, "+")), /*#__PURE__*/React.createElement("div", {
    className: "hero-stat-label"
  }, "Arenas Listed")), /*#__PURE__*/React.createElement("div", {
    className: "hero-stat-divider"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "hero-stat-val"
  }, "12", /*#__PURE__*/React.createElement("span", null, "k")), /*#__PURE__*/React.createElement("div", {
    className: "hero-stat-label"
  }, "Games Booked")), /*#__PURE__*/React.createElement("div", {
    className: "hero-stat-divider"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "hero-stat-val"
  }, "8", /*#__PURE__*/React.createElement("span", null, "+")), /*#__PURE__*/React.createElement("div", {
    className: "hero-stat-label"
  }, "Sports Available")))));
}

/* ============================
   Login Page
============================ */
function LoginPage({
  setPage,
  showToast
}) {
  const {
    login
  } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post('/auth/login', form, false);
      login(data.user, data.token);
      showToast(`Welcome back, ${data.user.name}`, 'success');
      setPage(data.user.role === 'business' ? 'dashboard' : 'home');
    } catch (err) {
      showToast(err.message, 'error');
    }
    setLoading(false);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "auth-page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-bg-lines"
  }), /*#__PURE__*/React.createElement("div", {
    className: "auth-card anim-scaleIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-card-stripe"
  }), /*#__PURE__*/React.createElement("div", {
    className: "auth-card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-eyebrow"
  }, "SportArena"), /*#__PURE__*/React.createElement("div", {
    className: "auth-title"
  }, "Welcome", /*#__PURE__*/React.createElement("br", null), "Back"), /*#__PURE__*/React.createElement("div", {
    className: "auth-sub"
  }, "Sign in to your account to continue"), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Email Address"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "email",
    placeholder: "you@example.com",
    required: true,
    value: form.email,
    onChange: e => setForm({
      ...form,
      email: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Password"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "password",
    placeholder: "Enter your password",
    required: true,
    value: form.password,
    onChange: e => setForm({
      ...form,
      password: e.target.value
    })
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: loading,
    className: "submit-btn"
  }, loading ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Spin, null), " Signing In") : 'Sign In')), /*#__PURE__*/React.createElement("div", {
    className: "auth-switch"
  }, "No account?", ' ', /*#__PURE__*/React.createElement("button", {
    className: "auth-switch-link",
    onClick: () => setPage('register')
  }, "Create one free")))));
}

/* ============================
   Register Page
============================ */
function RegisterPage({
  setPage,
  showToast
}) {
  const {
    login
  } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer'
  });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post('/auth/register', form, false);
      login(data.user, data.token);
      showToast(`Account created. Welcome, ${data.user.name}!`, 'success');
      setPage(data.user.role === 'business' ? 'dashboard' : 'home');
    } catch (err) {
      showToast(err.message, 'error');
    }
    setLoading(false);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "auth-page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-bg-lines"
  }), /*#__PURE__*/React.createElement("div", {
    className: "auth-card anim-scaleIn",
    style: {
      maxWidth: 480
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-card-stripe"
  }), /*#__PURE__*/React.createElement("div", {
    className: "auth-card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "auth-eyebrow"
  }, "Create Account"), /*#__PURE__*/React.createElement("div", {
    className: "auth-title"
  }, "Get", /*#__PURE__*/React.createElement("br", null), "Started"), /*#__PURE__*/React.createElement("div", {
    className: "auth-sub"
  }, "Join thousands booking and listing arenas"), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "I want to"), /*#__PURE__*/React.createElement("div", {
    className: "role-selector"
  }, [{
    val: 'customer',
    title: 'Book Arenas',
    desc: 'Find & play at arenas'
  }, {
    val: 'business',
    title: 'List Arenas',
    desc: 'Manage & earn revenue'
  }].map(r => /*#__PURE__*/React.createElement("div", {
    key: r.val,
    className: `role-option ${form.role === r.val ? 'active' : ''}`,
    onClick: () => setForm({
      ...form,
      role: r.val
    })
  }, /*#__PURE__*/React.createElement("div", {
    className: "role-option-title"
  }, r.title), /*#__PURE__*/React.createElement("div", {
    className: "role-option-desc"
  }, r.desc))))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Full Name"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "text",
    placeholder: "John Doe",
    required: true,
    value: form.name,
    onChange: e => setForm({
      ...form,
      name: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Email Address"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "email",
    placeholder: "you@example.com",
    required: true,
    value: form.email,
    onChange: e => setForm({
      ...form,
      email: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Password"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "password",
    placeholder: "Min. 6 characters",
    required: true,
    minLength: "6",
    value: form.password,
    onChange: e => setForm({
      ...form,
      password: e.target.value
    })
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: loading,
    className: "submit-btn"
  }, loading ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Spin, null), " Creating Account") : 'Create Account')), /*#__PURE__*/React.createElement("div", {
    className: "auth-switch"
  }, "Already have an account?", ' ', /*#__PURE__*/React.createElement("button", {
    className: "auth-switch-link",
    onClick: () => setPage('login')
  }, "Sign in")))));
}

/* ============================
   Home / Explore
============================ */
function HomePage({
  setPage,
  setSelectedArena,
  showToast
}) {
  const {
    user
  } = useAuth();
  const [arenas, setArenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sport_type: '',
    min_price: '',
    max_price: '',
    location: '',
    date: '',
    start_time: '',
    end_time: ''
  });
  const [userLoc, setUserLoc] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(pos => {
        setUserLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      });
    }
  }, []);
  const loadArenas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.sport_type) params.set('sport_type', filters.sport_type);
      if (filters.min_price) params.set('min_price', filters.min_price);
      if (filters.max_price) params.set('max_price', filters.max_price);
      if (filters.location) params.set('location', filters.location);
      if (filters.date) params.set('date', filters.date);
      if (filters.start_time) params.set('start_time', filters.start_time);
      if (filters.end_time) params.set('end_time', filters.end_time);
      if (userLoc) {
        params.set('lat', userLoc.lat);
        params.set('lng', userLoc.lng);
      }
      const qs = params.toString();
      const data = await api.get(`/arenas${qs ? '?' + qs : ''}`);
      setArenas(data);
    } catch (err) {
      showToast(err.message, 'error');
    }
    setLoading(false);
  }, [filters]);
  useEffect(() => {
    loadArenas();
  }, [loadArenas]);
  return /*#__PURE__*/React.createElement("div", null, !user && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Ticker, null), /*#__PURE__*/React.createElement(HeroSection, {
    setPage: setPage
  })), /*#__PURE__*/React.createElement("div", {
    className: "page-wrap section-pad"
  }, user && /*#__PURE__*/React.createElement("div", {
    className: "page-band",
    style: {
      padding: 0,
      marginBottom: 32,
      borderBottom: '1px solid var(--border)',
      paddingBottom: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "filter-label",
    style: {
      color: 'var(--accent)',
      marginBottom: 8
    }
  }, "Discover"), /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, "Find Your ", /*#__PURE__*/React.createElement("span", null, "Arena")), /*#__PURE__*/React.createElement("div", {
    className: "section-subtitle"
  }, "Browse premium venues across all sports")), /*#__PURE__*/React.createElement("div", {
    className: "filter-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "filter-bar-top"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "filter-label"
  }, "Location"), /*#__PURE__*/React.createElement("input", {
    className: "filter-input",
    type: "text",
    placeholder: "City, area...",
    value: filters.location,
    onChange: e => setFilters({
      ...filters,
      location: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "filter-label"
  }, "Sport"), /*#__PURE__*/React.createElement("select", {
    className: "filter-input filter-select",
    value: filters.sport_type,
    onChange: e => setFilters({
      ...filters,
      sport_type: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "All Sports"), SPORTS.map(s => /*#__PURE__*/React.createElement("option", {
    key: s.value,
    value: s.value
  }, s.label)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "filter-label"
  }, "Min Price"), /*#__PURE__*/React.createElement("input", {
    className: "filter-input",
    type: "number",
    placeholder: "Rs. 0",
    value: filters.min_price,
    onChange: e => setFilters({
      ...filters,
      min_price: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "filter-label"
  }, "Max Price"), /*#__PURE__*/React.createElement("input", {
    className: "filter-input",
    type: "number",
    placeholder: "Any",
    value: filters.max_price,
    onChange: e => setFilters({
      ...filters,
      max_price: e.target.value
    })
  }))), /*#__PURE__*/React.createElement("div", {
    className: "filter-divider"
  }), /*#__PURE__*/React.createElement("div", {
    className: "sport-chips"
  }, /*#__PURE__*/React.createElement("button", {
    className: `sport-chip ${!filters.sport_type ? 'active' : ''}`,
    onClick: () => setFilters({
      ...filters,
      sport_type: ''
    })
  }, "All"), SPORTS.map(s => /*#__PURE__*/React.createElement("button", {
    key: s.value,
    className: `sport-chip ${filters.sport_type === s.value ? 'active' : ''}`,
    onClick: () => setFilters({
      ...filters,
      sport_type: s.value
    })
  }, s.label)))), user?.role === 'customer' && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 48
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "filter-label",
    style: {
      color: 'var(--accent)'
    }
  }, "Join Others"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 800,
      fontFamily: 'var(--font-display)'
    }
  }, "Community ", /*#__PURE__*/React.createElement("span", null, "Games")))), /*#__PURE__*/React.createElement(CommunityGames, {
    showToast: showToast
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "filter-label",
    style: {
      color: 'var(--accent)'
    }
  }, "Arenas"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 800,
      fontFamily: 'var(--font-display)',
      marginBottom: 20
    }
  }, "Featured ", /*#__PURE__*/React.createElement("span", null, "Venues"))), loading ? /*#__PURE__*/React.createElement(SpinnerFull, null) : arenas.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    title: "No Arenas Found",
    desc: "Try adjusting your filters or check back soon for new venues."
  }) : /*#__PURE__*/React.createElement("div", {
    className: "arena-grid"
  }, arenas.map((arena, i) => /*#__PURE__*/React.createElement(ArenaCard, {
    key: arena.id,
    arena: arena,
    idx: i,
    onClick: () => {
      setSelectedArena(arena);
      setPage('arena-detail');
    }
  })))));
}

/* ============================
   Arena Card
============================ */
function ArenaCard({
  arena,
  idx,
  onClick
}) {
  const sportTypes = arena.sport_type?.split(',').map(s => s.trim().toLowerCase()) || ['football'];
  const firstSport = sportTypes[0];
  const sportLabel = sportTypes.map(st => SPORTS.find(s => s.value === st)?.label || st).join(', ');
  const imgUrl = arena.image_url || SPORT_IMAGES[firstSport] || SPORT_IMAGES.football;
  return /*#__PURE__*/React.createElement("div", {
    className: "arena-card anim-fadeUp",
    style: {
      animationDelay: `${idx * 0.06}s`
    },
    onClick: onClick
  }, /*#__PURE__*/React.createElement("div", {
    className: "arena-card-img-wrap"
  }, /*#__PURE__*/React.createElement("img", {
    className: "arena-card-img",
    src: imgUrl,
    alt: arena.name,
    onError: e => {
      e.target.src = SPORT_IMAGES.football;
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "arena-card-img-overlay"
  }), /*#__PURE__*/React.createElement("div", {
    className: "arena-card-sport"
  }, sportLabel?.toUpperCase()), /*#__PURE__*/React.createElement("div", {
    className: "arena-card-price"
  }, "\u20B9", arena.price_day, "/hr")), /*#__PURE__*/React.createElement("div", {
    className: "arena-card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "arena-card-name"
  }, arena.name), /*#__PURE__*/React.createElement("div", {
    className: "arena-card-loc"
  }, /*#__PURE__*/React.createElement("div", {
    className: "loc-dot"
  }), arena.location), arena.description && /*#__PURE__*/React.createElement("div", {
    className: "arena-card-desc"
  }, arena.description), /*#__PURE__*/React.createElement("div", {
    className: "arena-card-footer"
  }, arena.contact && /*#__PURE__*/React.createElement("a", {
    href: `tel:${arena.contact}`,
    onClick: e => e.stopPropagation(),
    className: "card-btn-contact"
  }, "Call"), /*#__PURE__*/React.createElement("button", {
    className: "card-btn-book"
  }, "Book Now"))));
}

/* ============================
   Arena Detail — 7-day slots, duration selector, tiered pricing
============================ */
// Arena Detail Page Component
function ArenaDetailPage({
  arena,
  setPage,
  showToast
}) {
  const {
    user
  } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [passes, setPasses] = useState([]);
  const [userPasses, setUserPasses] = useState([]);
  useEffect(() => {
    if (!arena) return;
    setLoading(true);
    Promise.all([api.get(`/slots/${arena.id}`), api.get(`/arenas/${arena.id}/reviews`), api.get(`/arenas/${arena.id}/passes`), user ? api.get('/my-passes', true) : Promise.resolve([])]).then(([slotData, reviewData, passData, myPassData]) => {
      setSlots(slotData);
      setReviews(reviewData);
      setPasses(passData);
      setUserPasses(myPassData.filter(p => p.arena_id === arena.id));
    }).catch(err => showToast(err.message, 'error')).finally(() => setLoading(false));
  }, [arena.id, user]);
  if (!arena) {
    setPage('home');
    return null;
  }
  const imgUrl = arena.image_url || SPORT_IMAGES[arena.sport_type?.toLowerCase()] || SPORT_IMAGES.football;
  const sportLabel = SPORTS.find(s => s.value === arena.sport_type?.toLowerCase())?.label || arena.sport_type;

  // Generate 7 day tabs
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      date: d,
      dateStr: d.toISOString().split('T')[0],
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', {
        weekday: 'short'
      }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString('en-US', {
        month: 'short'
      })
    });
  }

  // Helper to format hour
  const fmtHour = t => {
    if (!t) return '';
    const h = parseInt(t.substring(0, 2));
    if (h === 0) return '12 AM';
    if (h < 12) return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
  };
  const openH = arena.open_hour ?? 6;
  const peakH = arena.peak_start_hour ?? 17;
  const closeH = arena.close_hour ?? 23;
  const closeDisplay = closeH > 24 ? `${closeH - 24} AM` : closeH === 24 ? '12 AM' : fmtHour(`${String(closeH).padStart(2, '0')}:00`);
  const openDisplay = fmtHour(`${String(openH).padStart(2, '0')}:00`);
  const peakDisplay = fmtHour(`${String(peakH).padStart(2, '0')}:00`);
  const activeDateStr = days[activeDay]?.dateStr;
  const daySlots = slots.filter(s => {
    const slotDate = new Date(s.date).toISOString().split('T')[0];
    return slotDate === activeDateStr;
  }).sort((a, b) => {
    const ha = parseInt(a.start_time.substring(0, 2));
    const hb = parseInt(b.start_time.substring(0, 2));
    const ea = ha < openH ? ha + 24 : ha;
    const eb = hb < openH ? hb + 24 : hb;
    return ea - eb;
  });
  const toggleSlot = slot => {
    if (!slot.is_available) return;
    setSelectedSlots(prev => {
      const exists = prev.find(s => s.id === slot.id);
      if (exists) return prev.filter(s => s.id !== slot.id);

      // Check if same day
      if (prev.length > 0 && prev[0].date !== slot.date) {
        showToast("Please select slots from the same day", "info");
        return [slot];
      }
      return [...prev, slot].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
  };
  const handleWaitlist = async slot => {
    if (!user) {
      setPage('login');
      return;
    }
    try {
      await api.post('/waitlist', {
        arena_id: arena.id,
        date: slot.date,
        start_time: slot.start_time
      });
      showToast('Added to waitlist! We will notify you if it becomes available.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
  const totalPrice = selectedSlots.reduce((sum, s) => sum + parseFloat(s.price), 0);
  const handleBook = () => {
    if (selectedSlots.length === 0) {
      showToast('Select at least one time slot', 'error');
      return;
    }
    setShowPayment(true);
  };
  const handlePayment = async (method, upiId, guestName, guestPhone, isPublic, maxPlayers, couponCode, passId) => {
    try {
      const payload = {
        arena_id: arena.id,
        slot_ids: selectedSlots.map(s => s.id),
        amount: totalPrice,
        payment_method: method,
        upi_id: upiId,
        user_name: guestName,
        user_email: user?.email || '',
        user_phone: guestPhone,
        is_public: isPublic,
        max_players: maxPlayers,
        coupon_code: couponCode,
        pass_id: passId
      };
      const result = await api.post('/bookings', payload);
      setBookingResult({
        payment: {
          success: true,
          message: 'Booking Successful!',
          transaction_id: result.transaction_id
        }
      });
      setShowPayment(false);
      const updated = await api.get(`/slots/${arena.id}`);
      setSlots(updated);
      setSelectedSlots([]);
    } catch (err) {
      showToast(err.message, 'error');
      setBookingResult({
        payment: {
          success: false,
          message: err.message
        }
      });
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "anim-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-wrap",
    style: {
      paddingTop: 28
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "back-btn",
    onClick: () => setPage('home'),
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M19 12H5M12 5l-7 7 7 7"
  })), "Back to Arenas"), /*#__PURE__*/React.createElement("div", {
    className: "detail-grid"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-hero"
  }, /*#__PURE__*/React.createElement("img", {
    src: imgUrl,
    alt: arena.name,
    onError: e => {
      e.target.src = SPORT_IMAGES.football;
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "detail-hero-overlay"
  }), /*#__PURE__*/React.createElement("div", {
    className: "detail-hero-info"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-sport-badge"
  }, sportLabel?.toUpperCase()), /*#__PURE__*/React.createElement("div", {
    className: "detail-arena-name"
  }, arena.name), /*#__PURE__*/React.createElement("div", {
    className: "detail-arena-loc"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "10",
    r: "3"
  })), arena.location))), /*#__PURE__*/React.createElement("div", {
    className: "detail-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-section-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-section-title"
  }, "Pricing & Hours")), /*#__PURE__*/React.createElement("div", {
    className: "detail-section-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "info-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "info-tile",
    style: {
      borderLeft: '3px solid var(--green)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "info-tile-label"
  }, "\u2600\uFE0F Day Rate (", openDisplay, "\u2013", peakDisplay, ")"), /*#__PURE__*/React.createElement("div", {
    className: "info-tile-val accent"
  }, "\u20B9", arena.price_day, "/hr")), /*#__PURE__*/React.createElement("div", {
    className: "info-tile",
    style: {
      borderLeft: '3px solid var(--gold)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "info-tile-label"
  }, "\uD83C\uDF19 Night Rate (", peakDisplay, "\u2013", closeDisplay, ")"), /*#__PURE__*/React.createElement("div", {
    className: "info-tile-val",
    style: {
      color: 'var(--gold)'
    }
  }, "\u20B9", arena.price_night, "/hr"))), arena.description && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: 'var(--text2)',
      lineHeight: 1.7,
      marginTop: 16
    }
  }, arena.description))), /*#__PURE__*/React.createElement("div", {
    className: "detail-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-section-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-section-title"
  }, "Available Slots")), /*#__PURE__*/React.createElement("div", {
    className: "detail-section-body"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginBottom: 20,
      overflowX: 'auto',
      paddingBottom: 4
    }
  }, days.map((day, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => {
      setActiveDay(i);
      setSelectedSlots([]);
    },
    style: {
      minWidth: 64,
      padding: '10px 8px',
      border: activeDay === i ? '2px solid var(--accent)' : '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      background: activeDay === i ? 'rgba(232, 55, 26, 0.1)' : 'var(--surface2)',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      transition: 'all var(--transition)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      color: activeDay === i ? 'var(--accent)' : 'var(--text3)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em'
    }
  }, day.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 800,
      color: activeDay === i ? 'var(--text)' : 'var(--text2)',
      fontFamily: 'var(--font-display)'
    }
  }, day.dayNum), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--text3)'
    }
  }, day.month)))), loading ? /*#__PURE__*/React.createElement(SpinnerFull, null) : daySlots.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    title: "No Slots Found",
    desc: "Arena is closed for this date."
  }) : /*#__PURE__*/React.createElement("div", {
    className: "slots-grid"
  }, daySlots.map(slot => {
    const isSel = selectedSlots.some(s => s.id === slot.id);
    const isAvail = slot.is_available && slot.status === 'available';
    return /*#__PURE__*/React.createElement("button", {
      key: slot.id,
      className: `slot-btn ${isSel ? 'selected' : ''}`,
      disabled: !isAvail && slot.status !== 'booked',
      style: !isAvail ? {
        opacity: 0.5,
        cursor: slot.status === 'booked' ? 'pointer' : 'not-allowed'
      } : {},
      onClick: () => isAvail ? toggleSlot(slot) : slot.status === 'booked' ? handleWaitlist(slot) : null
    }, /*#__PURE__*/React.createElement("div", {
      className: "slot-time"
    }, fmtHour(slot.start_time)), !isAvail && slot.status === 'booked' && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 8,
        color: 'var(--accent)',
        fontWeight: 700,
        marginTop: 4
      }
    }, "WAITLIST"), !isAvail && slot.status !== 'booked' && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 8,
        color: 'var(--text3)',
        fontWeight: 700,
        marginTop: 4
      }
    }, slot.status?.toUpperCase()), isAvail && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: 'var(--text3)',
        marginTop: 4
      }
    }, "\u20B9", slot.price));
  })))), /*#__PURE__*/React.createElement("div", {
    className: "detail-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-section-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-section-title"
  }, "Community Reviews")), /*#__PURE__*/React.createElement("div", {
    className: "detail-section-body"
  }, reviews.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text3)',
      fontSize: 13,
      textAlign: 'center',
      padding: '20px 0'
    }
  }, "No reviews yet. Be the first to book and rate!") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, reviews.map(rev => /*#__PURE__*/React.createElement("div", {
    key: rev.id,
    style: {
      paddingBottom: 16,
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      fontSize: 14
    }
  }, rev.user_name), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--gold)',
      fontSize: 12
    }
  }, '★'.repeat(rev.rating), '☆'.repeat(5 - rev.rating))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: 'var(--text2)',
      lineHeight: 1.5
    }
  }, rev.comment))))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "booking-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "booking-card-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "booking-card-header-title"
  }, "Booking Summary"), /*#__PURE__*/React.createElement("div", {
    className: "booking-price-big"
  }, "\u20B9", totalPrice), /*#__PURE__*/React.createElement("div", {
    className: "booking-price-sub"
  }, selectedSlots.length, " Hour(s) Selected")), /*#__PURE__*/React.createElement("div", {
    className: "booking-card-body"
  }, selectedSlots.length > 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginBottom: 20
    }
  }, selectedSlots.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.id,
    className: "booking-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "booking-row-label"
  }, fmtHour(s.start_time), " \u2013 ", fmtHour(s.end_time)), /*#__PURE__*/React.createElement("span", {
    className: "booking-row-val"
  }, "\u20B9", s.price)))) : /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '30px 0',
      color: 'var(--text3)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "32",
    height: "32",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "12 6 12 12 16 14"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13
    }
  }, "Please select one or more slots")), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--border)',
      paddingTop: 16,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 15
    }
  }, "Total Amount"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 900,
      fontSize: 22,
      color: 'var(--accent)'
    }
  }, "\u20B9", totalPrice)), /*#__PURE__*/React.createElement("button", {
    className: "book-cta",
    disabled: selectedSlots.length === 0,
    onClick: handleBook
  }, "Proceed to Checkout")))), passes.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "detail-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-section-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-section-title"
  }, "Membership Passes")), /*#__PURE__*/React.createElement("div", {
    className: "detail-section-body"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 16
    }
  }, passes.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: {
      padding: 16,
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      background: 'var(--surface2)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 800,
      fontSize: 16
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text3)'
    }
  }, p.credits, " Hours \xB7 ", p.validity_days, " Days"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 900,
      fontSize: 20,
      color: 'var(--accent)'
    }
  }, "\u20B9", p.price), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary btn-sm",
    onClick: async () => {
      if (!user) return setPage('login');
      try {
        await api.post('/buy-pass', {
          pass_plan_id: p.id
        });
        showToast('Pass purchased successfully!', 'success');
        window.location.reload();
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  }, "Buy Now"))))))))), showPayment && /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: () => setShowPayment(false)
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-box",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-title"
  }, "Checkout"), /*#__PURE__*/React.createElement("button", {
    className: "modal-close",
    onClick: () => setShowPayment(false)
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement(PaymentForm, {
    user: user,
    arena: arena,
    totalPrice: totalPrice,
    count: selectedSlots.length,
    userPasses: userPasses,
    onPay: handlePayment,
    onClose: () => setShowPayment(false)
  })))), bookingResult && /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: () => setBookingResult(null)
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-box",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-title"
  }, bookingResult.payment.success ? 'Success' : 'Failed'), /*#__PURE__*/React.createElement("button", {
    className: "modal-close",
    onClick: () => setBookingResult(null)
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    className: "modal-body",
    style: {
      textAlign: 'center',
      padding: '40px 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: `result-icon-wrap ${bookingResult.payment.success ? 'result-icon-success' : 'result-icon-fail'}`
  }, bookingResult.payment.success ? '✓' : '×'), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      marginBottom: 8
    }
  }, bookingResult.payment.message), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: () => {
      setBookingResult(null);
      if (bookingResult.payment.success) setPage('my-bookings');
    }
  }, bookingResult.payment.success ? 'View My Bookings' : 'Try Again')))));
}

/* ============================
   Payment Form
============================ */
function PaymentForm({
  user,
  arena,
  totalPrice,
  count,
  userPasses,
  onPay,
  onClose
}) {
  const [method, setMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [selectedPass, setSelectedPass] = useState(userPasses?.[0]?.id || '');
  const [guestName, setGuestName] = useState(user?.name || '');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPassword, setGuestPassword] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await fetch(`${API}/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          arena_id: arena.id,
          coupon_code: couponCode
        })
      });
      const data = await res.json();
      if (data.valid) {
        setDiscount(parseFloat(data.discount_value));
        alert(`Coupon applied! Discount of ₹${data.discount_value} added.`);
      } else {
        alert(data.error || 'Invalid coupon code');
        setDiscount(0);
      }
    } catch (err) {
      alert('Error validating coupon');
    }
    setValidatingCoupon(false);
  };
  const finalPrice = Math.max(0, totalPrice - discount);
  const handlePay = async () => {
    if (!guestName.trim() || !guestPhone.trim()) {
      alert('Please enter your name and phone number.');
      return;
    }
    if (!user && (!guestEmail.trim() || !guestPassword.trim())) {
      alert('Email and password are required for registration.');
      return;
    }
    if (method === 'upi' && (!upiId.trim() || !upiId.includes('@'))) {
      alert('Please enter a valid UPI ID (e.g. yourname@upi)');
      return;
    }
    setLoading(true);
    try {
      if (!user) {
        const res = await fetch(`${API}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: guestName,
            email: guestEmail,
            password: guestPassword,
            role: 'customer'
          })
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.error || 'Registration failed.');
          setLoading(false);
          return;
        }
        localStorage.setItem('sa_token', data.token);
      }
      await onPay(method, upiId, guestName, guestPhone, isPublic, maxPlayers, couponCode, selectedPass);
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };
  const upiApps = [{
    name: 'Google Pay',
    color: '#4285F4',
    icon: 'G'
  }, {
    name: 'PhonePe',
    color: '#5f259f',
    icon: 'P'
  }, {
    name: 'Paytm',
    color: '#00BAF2',
    icon: '₽'
  }, {
    name: 'BHIM',
    color: '#00897B',
    icon: 'B'
  }];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "payment-amount-box"
  }, /*#__PURE__*/React.createElement("div", {
    className: "payment-amount-label"
  }, "Amount Due"), /*#__PURE__*/React.createElement("div", {
    className: "payment-amount-val"
  }, "\u20B9", finalPrice), /*#__PURE__*/React.createElement("div", {
    className: "payment-amount-sub"
  }, arena.name, " \u2014 ", count, " Slot(s)", discount > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--green)',
      fontWeight: 700
    }
  }, " (\u20B9", totalPrice, " - \u20B9", discount, " discount)"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: `action-btn ${method === 'upi' ? 'active' : ''}`,
    onClick: () => setMethod('upi'),
    style: {
      flex: 1,
      background: method === 'upi' ? 'var(--accent)' : 'var(--surface2)',
      color: method === 'upi' ? 'white' : 'var(--text)'
    }
  }, "UPI Payment"), /*#__PURE__*/React.createElement("button", {
    className: `action-btn ${method === 'credits' ? 'active' : ''}`,
    onClick: () => setMethod('credits'),
    disabled: !userPasses || userPasses.length === 0,
    style: {
      flex: 1,
      background: method === 'credits' ? 'var(--accent)' : 'var(--surface2)',
      color: method === 'credits' ? 'white' : 'var(--text)'
    }
  }, "Use Pass Credits")), method === 'upi' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 14px',
      background: 'rgba(46, 124, 209, 0.08)',
      border: '1px solid rgba(46, 124, 209, 0.2)',
      borderRadius: 'var(--r-sm)',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#2E7CD1",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "8",
    x2: "12",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "16",
    x2: "12.01",
    y2: "16"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#2E7CD1',
      lineHeight: 1.4
    }
  }, /*#__PURE__*/React.createElement("strong", null, "Razorpay integration coming soon."), " Payments are confirmed instantly for now.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "filter-label",
    style: {
      marginBottom: 8,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", null, "Pay via UPI"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      background: 'var(--accent)',
      color: '#fff',
      padding: '2px 8px',
      borderRadius: 20,
      fontWeight: 700
    }
  }, "RECOMMENDED")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 8,
      marginBottom: 16
    }
  }, upiApps.map(app => /*#__PURE__*/React.createElement("div", {
    key: app.name,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      padding: '12px 8px',
      background: 'var(--surface2)',
      borderRadius: 'var(--r-sm)',
      border: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: '50%',
      background: app.color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 16,
      fontWeight: 800,
      color: '#fff',
      fontFamily: 'var(--font-display)'
    }
  }, app.icon), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--text3)',
      fontWeight: 600
    }
  }, app.name)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Your UPI ID"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "yourname@upi",
    value: upiId,
    onChange: e => setUpiId(e.target.value),
    style: {
      fontSize: 15
    }
  })))) : /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Select Your Pass"), /*#__PURE__*/React.createElement("select", {
    className: "form-input",
    value: selectedPass,
    onChange: e => setSelectedPass(e.target.value)
  }, userPasses.map(p => /*#__PURE__*/React.createElement("option", {
    key: p.id,
    value: p.id
  }, p.plan_name, " (", p.credits_remaining, " credits left)"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text3)',
      marginTop: 8
    }
  }, "Each slot requires 1 credit. You are booking ", count, " slot(s).")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface2)',
      padding: 16,
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--accent)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      fontWeight: 700,
      marginBottom: 12
    }
  }, !user ? 'Account Details (Auto-Register)' : 'Booking Details'), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Full Name"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "John Doe",
    value: guestName,
    onChange: e => setGuestName(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Phone Number"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "+91 9876543210",
    value: guestPhone,
    onChange: e => setGuestPhone(e.target.value)
  })), !user && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Email"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "email",
    placeholder: "john@example.com",
    value: guestEmail,
    onChange: e => setGuestEmail(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Password"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "password",
    placeholder: "Create a password",
    value: guestPassword,
    onChange: e => setGuestPassword(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
      borderTop: '1px solid var(--border)',
      paddingTop: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label",
    style: {
      marginBottom: 0
    }
  }, "Find a Team? (Public Game)"), /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: isPublic,
    onChange: e => setIsPublic(e.target.checked)
  })), isPublic && /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Max Players Needed"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    className: "form-input",
    value: maxPlayers,
    onChange: e => setMaxPlayers(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      background: 'var(--surface2)',
      padding: 16,
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Coupon Code"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "Enter coupon...",
    value: couponCode,
    onChange: e => setCouponCode(e.target.value),
    disabled: discount > 0
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn-outline btn-sm",
    onClick: applyCoupon,
    disabled: validatingCoupon || !couponCode.trim() || discount > 0
  }, validatingCoupon ? '...' : discount > 0 ? 'Applied' : 'Apply')), discount > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--green)',
      marginTop: 6,
      fontWeight: 600
    }
  }, "Discount of \u20B9", discount, " will be applied!")), /*#__PURE__*/React.createElement("button", {
    className: "pay-btn",
    onClick: handlePay,
    disabled: loading || method === 'upi' && !upiId.trim() || method === 'credits' && !selectedPass
  }, loading ? 'Confirming Payment...' : method === 'credits' ? `Book using Credits (${count})` : `Pay ₹${finalPrice} via UPI`));
}

/* ============================
   My Bookings
============================ */
function MyBookingsPage({
  setPage,
  showToast
}) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [chatBooking, setChatBooking] = useState(null);
  const load = async () => {
    setLoading(true);
    try {
      const d = await api.get('/bookings/my', true);
      setBookings(d);
    } catch (err) {
      showToast(err.message, 'error');
    }
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);
  const cancelBooking = async id => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.put(`/bookings/${id}/cancel`, {});
      showToast('Booking cancelled', 'success');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
  const handleReviewSubmit = async (arena_id, booking_id, rating, comment) => {
    try {
      await api.post('/reviews', {
        arena_id,
        booking_id,
        rating,
        comment
      });
      showToast('Thank you for your review!', 'success');
      setReviewBooking(null);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "page-wrap section-pad anim-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderBottom: '1px solid var(--border)',
      paddingBottom: 28,
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "filter-label",
    style: {
      color: 'var(--accent)',
      marginBottom: 8
    }
  }, "History"), /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, "My ", /*#__PURE__*/React.createElement("span", null, "Bookings")), /*#__PURE__*/React.createElement("div", {
    className: "section-subtitle"
  }, "Track your upcoming games and rate your past experiences")), loading ? /*#__PURE__*/React.createElement(SpinnerFull, null) : bookings.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    title: "No Bookings Yet",
    desc: "Head to Explore and book your first arena.",
    action: /*#__PURE__*/React.createElement("button", {
      className: "btn-primary",
      onClick: () => setPage('home')
    }, "Explore Arenas")
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, bookings.map(b => /*#__PURE__*/React.createElement("div", {
    key: b.id,
    className: "booking-item anim-fadeUp"
  }, /*#__PURE__*/React.createElement("div", {
    className: "booking-item-info"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "booking-item-name"
  }, b.arena_name), /*#__PURE__*/React.createElement("div", {
    className: "booking-item-meta"
  }, new Date(b.slot_date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })), /*#__PURE__*/React.createElement("div", {
    className: "booking-item-meta",
    style: {
      marginTop: 4,
      color: 'var(--text)'
    }
  }, b.start_time?.substring(0, 5), " \u2013 ", b.end_time?.substring(0, 5))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "booking-item-amount"
  }, "\u20B9", b.amount), parseFloat(b.discount_amount) > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--green)',
      fontWeight: 700,
      marginBottom: 4
    }
  }, "SAVED \u20B9", b.discount_amount, " (", b.applied_coupon, ")"), /*#__PURE__*/React.createElement(StatusBadge, {
    status: b.status
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 16,
      borderTop: '1px solid var(--border)',
      paddingTop: 16
    }
  }, b.status === 'confirmed' && /*#__PURE__*/React.createElement("button", {
    className: "action-btn danger",
    onClick: () => cancelBooking(b.id)
  }, "Cancel Booking"), (b.status === 'checked-in' || b.status === 'confirmed') && /*#__PURE__*/React.createElement("button", {
    className: "action-btn",
    onClick: () => setReviewBooking(b)
  }, "Rate Experience"), b.status === 'confirmed' && /*#__PURE__*/React.createElement("button", {
    className: "action-btn primary",
    onClick: () => setChatBooking(b)
  }, "Coordinate Chat")))))), reviewBooking && /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: () => setReviewBooking(null)
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-box",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-title"
  }, "Rate ", reviewBooking.arena_name), /*#__PURE__*/React.createElement("button", {
    className: "modal-close",
    onClick: () => setReviewBooking(null)
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement(ReviewForm, {
    onSubmit: (rating, comment) => handleReviewSubmit(reviewBooking.arena_id, reviewBooking.id, rating, comment)
  })))), chatBooking && /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: () => setChatBooking(null)
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-box",
    onClick: e => e.stopPropagation(),
    style: {
      height: '80vh',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-title"
  }, "Team Chat: ", chatBooking.arena_name), /*#__PURE__*/React.createElement("button", {
    className: "modal-close",
    onClick: () => setChatBooking(null)
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    className: "modal-body",
    style: {
      flex: 1,
      padding: 0,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(ChatRoom, {
    booking: chatBooking
  })))));
}

/* ============================
   Chat Room Component
============================ */
function ChatRoom({
  booking
}) {
  const {
    user,
    socket
  } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollRef = React.useRef();
  useEffect(() => {
    if (!booking || !api) return;
    api.get(`/messages/${booking.id}`, true).then(setMessages).catch(e => console.error(e));
    if (socket) {
      socket.emit('join_chat', booking.id);
      socket.on('receive_message', msg => {
        setMessages(prev => [...prev, msg]);
      });
    }
    return () => {
      if (socket) socket.off('receive_message');
    };
  }, [booking.id, socket]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);
  const send = e => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    socket.emit('send_message', {
      booking_id: booking.id,
      sender_id: user.id,
      sender_name: user.name,
      message: input
    });
    setInput('');
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: scrollRef,
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: 20,
      background: 'var(--surface2)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, messages.map((m, i) => {
    const isMe = m.sender_id === user?.id;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        alignSelf: isMe ? 'flex-end' : 'flex-start',
        maxWidth: '70%',
        padding: '10px 14px',
        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isMe ? 'var(--accent)' : 'var(--surface)',
        color: isMe ? 'white' : 'var(--text)',
        fontSize: 13,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }
    }, !isMe && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        marginBottom: 4,
        color: 'var(--accent)'
      }
    }, m.sender_name), /*#__PURE__*/React.createElement("div", null, m.message), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        opacity: 0.6,
        marginTop: 4,
        textAlign: 'right'
      }
    }, new Date(m.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })));
  })), /*#__PURE__*/React.createElement("form", {
    onSubmit: send,
    style: {
      padding: 16,
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    style: {
      borderRadius: 24,
      padding: '10px 20px'
    },
    placeholder: "Type a message...",
    value: input,
    onChange: e => setInput(e.target.value)
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    type: "submit",
    style: {
      width: 44,
      height: 44,
      borderRadius: '50%',
      padding: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "22",
    y1: "2",
    x2: "11",
    y2: "13"
  }), /*#__PURE__*/React.createElement("polygon", {
    points: "22 2 15 22 11 13 2 9 22 2"
  })))));
}
function ReviewForm({
  onSubmit
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Rating"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      fontSize: 24,
      color: 'var(--gold)'
    }
  }, [1, 2, 3, 4, 5].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      cursor: 'pointer'
    },
    onClick: () => setRating(i)
  }, i <= rating ? '★' : '☆')))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Your Comment"), /*#__PURE__*/React.createElement("textarea", {
    className: "form-input",
    rows: "4",
    value: comment,
    onChange: e => setComment(e.target.value),
    placeholder: "How was the court quality and lighting?"
  })), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: () => onSubmit(rating, comment)
  }, "Submit Review"));
}

/* ============================
   Dashboard
============================ */
function DashboardPage({
  setPage,
  showToast
}) {
  const {
    user
  } = useAuth();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([api.get('/dashboard/stats', true), api.get('/dashboard/analytics', true)]).then(([statsData, analyticsData]) => {
      setStats(statsData);
      setAnalytics(analyticsData);
    }).catch(err => showToast(err.message, 'error')).finally(() => setLoading(false));
  }, []);
  if (loading) return /*#__PURE__*/React.createElement(SpinnerFull, null);
  return /*#__PURE__*/React.createElement("div", {
    className: "page-wrap section-pad anim-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--border)',
      paddingBottom: 28,
      marginBottom: 32,
      gap: 16,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "filter-label",
    style: {
      color: 'var(--accent)',
      marginBottom: 8
    }
  }, "Welcome, ", user?.name), /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, "Business ", /*#__PURE__*/React.createElement("span", null, "Dashboard")), /*#__PURE__*/React.createElement("div", {
    className: "section-subtitle"
  }, "Your arena performance and analytics")), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: () => setPage('my-arenas')
  }, "Manage Arenas")), /*#__PURE__*/React.createElement("div", {
    className: "stats-grid"
  }, [{
    label: 'Total Arenas',
    val: stats?.totalArenas || 0,
    color: 'var(--accent)'
  }, {
    label: 'Total Bookings',
    val: stats?.totalBookings || 0,
    color: 'var(--green)'
  }, {
    label: 'Revenue (Rs.)',
    val: (stats?.totalRevenue || 0).toLocaleString(),
    color: 'var(--gold)'
  }].map(s => /*#__PURE__*/React.createElement("div", {
    key: s.label,
    className: "stat-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-card-accent-line",
    style: {
      background: s.color
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "stat-card-label"
  }, s.label), /*#__PURE__*/React.createElement("div", {
    className: "stat-card-val",
    style: {
      color: s.color
    }
  }, s.val)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 20,
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-section-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-section-title"
  }, "Revenue by Sport")), /*#__PURE__*/React.createElement("div", {
    className: "detail-section-body"
  }, !analytics?.bySport || analytics.bySport.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text3)',
      fontSize: 13
    }
  }, "No data yet") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, analytics.bySport.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.sport_type
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 4,
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("span", null, s.sport_type?.toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700
    }
  }, "\u20B9", s.revenue, " (", s.bookings, " bookings)")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      background: 'var(--surface2)',
      borderRadius: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: `${stats?.totalRevenue > 0 ? Math.min(100, s.revenue / stats.totalRevenue * 100) : 0}%`,
      background: 'var(--accent)',
      borderRadius: 4
    }
  }))))))), /*#__PURE__*/React.createElement("div", {
    className: "detail-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-section-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-section-title"
  }, "Customer Retention")), /*#__PURE__*/React.createElement("div", {
    className: "detail-section-body",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text3)',
      marginBottom: 4
    }
  }, "RETURNING CUSTOMERS"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 900,
      color: 'var(--green)'
    }
  }, analytics?.retention?.returning_customers || 0)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text3)',
      marginBottom: 4
    }
  }, "NEW CUSTOMERS"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 900,
      color: 'var(--gold)'
    }
  }, analytics?.retention?.new_customers || 0))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 120,
      height: 120,
      borderRadius: '50%',
      border: '12px solid var(--surface2)',
      borderTopColor: 'var(--green)',
      transform: 'rotate(45deg)'
    }
  })))), /*#__PURE__*/React.createElement("div", {
    className: "detail-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-section-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-section-title"
  }, "Recent Bookings")), !stats?.recentBookings?.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '40px 24px',
      textAlign: 'center',
      color: 'var(--text3)',
      fontSize: 13
    }
  }, "No bookings yet.") : /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "data-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Customer"), /*#__PURE__*/React.createElement("th", null, "Arena"), /*#__PURE__*/React.createElement("th", null, "Date & Time"), /*#__PURE__*/React.createElement("th", null, "Status"), /*#__PURE__*/React.createElement("th", null, "Action"))), /*#__PURE__*/React.createElement("tbody", null, stats.recentBookings.map(b => /*#__PURE__*/React.createElement("tr", {
    key: b.id
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      color: 'var(--text)',
      fontWeight: 500
    }
  }, b.customer_name), /*#__PURE__*/React.createElement("td", null, b.arena_name), /*#__PURE__*/React.createElement("td", null, new Date(b.slot_date).toLocaleDateString(), " \xB7 ", b.start_time?.substring(0, 5), " \u2013 ", b.end_time?.substring(0, 5)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(StatusBadge, {
    status: b.status
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("select", {
    className: "filter-input btn-sm",
    value: b.status,
    onChange: async e => {
      try {
        await api.put(`/bookings/${b.id}/status`, {
          status: e.target.value
        });
        showToast('Status updated', 'success');
        window.location.reload();
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "confirmed"
  }, "Confirmed"), /*#__PURE__*/React.createElement("option", {
    value: "checked-in"
  }, "Checked In"), /*#__PURE__*/React.createElement("option", {
    value: "no-show"
  }, "No Show"), /*#__PURE__*/React.createElement("option", {
    value: "cancelled"
  }, "Cancelled"))))))))));
}

/* ============================
   My Arenas (Business)
============================ */
function MyArenasPage({
  setPage,
  showToast
}) {
  const [arenas, setArenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showSlots, setShowSlots] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const [selected, setSelected] = useState(null);
  const [arenaBookings, setArenaBookings] = useState([]);
  const load = async () => {
    try {
      const d = await api.get('/arenas/my/list', true);
      setArenas(d);
    } catch (err) {
      showToast(err.message, 'error');
    }
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);
  const deleteArena = async id => {
    if (!confirm('Delete this arena?')) return;
    try {
      await api.delete(`/arenas/${id}`);
      showToast('Arena deleted', 'success');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
  const viewBookings = async arena => {
    setSelected(arena);
    try {
      const d = await api.get(`/bookings/arena/${arena.id}`, true);
      setArenaBookings(d);
    } catch (err) {
      showToast(err.message, 'error');
      setArenaBookings([]);
    }
    setShowBookings(true);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "page-wrap section-pad anim-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--border)',
      paddingBottom: 28,
      marginBottom: 32,
      gap: 16,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "filter-label",
    style: {
      color: 'var(--accent)',
      marginBottom: 8
    }
  }, "Management"), /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, "My ", /*#__PURE__*/React.createElement("span", null, "Arenas")), /*#__PURE__*/React.createElement("div", {
    className: "section-subtitle"
  }, "Create and manage your sports venues")), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: () => setShowCreate(true)
  }, "+ Add Arena")), loading ? /*#__PURE__*/React.createElement(SpinnerFull, null) : arenas.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    title: "No Arenas Yet",
    desc: "Create your first arena and start accepting bookings from players.",
    action: /*#__PURE__*/React.createElement("button", {
      className: "btn-primary",
      onClick: () => setShowCreate(true)
    }, "Create Arena")
  }) : /*#__PURE__*/React.createElement("div", {
    className: "arena-manage-grid"
  }, arenas.map(arena => {
    const imgUrl = arena.image_url || SPORT_IMAGES[arena.sport_type?.toLowerCase()] || SPORT_IMAGES.football;
    return /*#__PURE__*/React.createElement("div", {
      key: arena.id,
      className: "arena-manage-card"
    }, /*#__PURE__*/React.createElement("div", {
      className: "arena-manage-img"
    }, /*#__PURE__*/React.createElement("img", {
      src: imgUrl,
      alt: arena.name,
      onError: e => {
        e.target.src = SPORT_IMAGES.football;
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 12,
        left: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "badge badge-gray"
    }, arena.sport_type?.toUpperCase()))), /*#__PURE__*/React.createElement("div", {
      className: "arena-manage-body"
    }, /*#__PURE__*/React.createElement("div", {
      className: "arena-manage-name"
    }, arena.name), /*#__PURE__*/React.createElement("div", {
      className: "arena-manage-meta"
    }, arena.location, " \xB7 \u20B9", arena.price_day, "/hr (Day) / \u20B9", arena.price_night, "/hr (Night)"), arena.coupon_code && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        background: 'rgba(29, 185, 84, 0.1)',
        color: 'var(--green)',
        padding: '4px 8px',
        borderRadius: 4,
        display: 'inline-block',
        marginBottom: 12,
        border: '1px solid rgba(29, 185, 84, 0.2)'
      }
    }, "COUPON: ", /*#__PURE__*/React.createElement("strong", null, arena.coupon_code), " (\u20B9", arena.discount_value, " off)"), /*#__PURE__*/React.createElement("div", {
      className: "arena-manage-actions"
    }, /*#__PURE__*/React.createElement("button", {
      className: "action-btn",
      onClick: () => {
        setSelected(arena);
        setShowSlots(true);
      }
    }, "Slots"), /*#__PURE__*/React.createElement("button", {
      className: "action-btn",
      onClick: () => viewBookings(arena)
    }, "Bookings"), /*#__PURE__*/React.createElement("button", {
      className: "action-btn danger",
      onClick: () => deleteArena(arena.id)
    }, "Delete"))));
  })), showCreate && /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: () => setShowCreate(false)
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-box lg",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-title"
  }, "Create Arena"), /*#__PURE__*/React.createElement("button", {
    className: "modal-close",
    onClick: () => setShowCreate(false)
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement(CreateArenaForm, {
    onCreated: () => {
      setShowCreate(false);
      load();
      showToast('Arena created!', 'success');
    },
    showToast: showToast
  })))), showSlots && selected && /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: () => setShowSlots(false)
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-box lg",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-title"
  }, "Manage Slots"), /*#__PURE__*/React.createElement("button", {
    className: "modal-close",
    onClick: () => setShowSlots(false)
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement(ManageSlotsForm, {
    arena: selected,
    showToast: showToast
  })))), showBookings && /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: () => setShowBookings(false)
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-box",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-title"
  }, selected?.name, " \u2014 Bookings"), /*#__PURE__*/React.createElement("button", {
    className: "modal-close",
    onClick: () => setShowBookings(false)
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, arenaBookings.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    title: "No Bookings",
    desc: "No customers have booked this arena yet."
  }) : /*#__PURE__*/React.createElement("div", {
    className: "slot-scroll"
  }, arenaBookings.map(b => /*#__PURE__*/React.createElement("div", {
    key: b.id,
    className: "slot-manage-item"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "slot-manage-date"
  }, b.customer_name), /*#__PURE__*/React.createElement("div", {
    className: "slot-manage-time"
  }, b.customer_email), /*#__PURE__*/React.createElement("div", {
    className: "slot-manage-time",
    style: {
      marginTop: 4
    }
  }, new Date(b.slot_date).toLocaleDateString(), " \xB7 ", b.start_time?.substring(0, 5), " \u2013 ", b.end_time?.substring(0, 5))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(StatusBadge, {
    status: b.status
  }), /*#__PURE__*/React.createElement(PayBadge, {
    status: b.payment_status
  })))))))));
}

/* ============================
   Create Arena Form
============================ */
/* ============================
   Create Arena Form — Tiered Pricing & Hours
============================ */
function CreateArenaForm({
  onCreated,
  showToast
}) {
  const [form, setForm] = useState({
    name: '',
    location: '',
    address: '',
    map_url: '',
    sport_type: ['football'],
    price_day: '500',
    price_night: '800',
    price_weekend_day: '600',
    price_weekend_night: '900',
    open_hour: '6',
    peak_start_hour: '17',
    close_hour: '23',
    image_url: '',
    description: '',
    contact: '',
    coupon_code: '',
    discount_value: '0'
  });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!form.sport_type || form.sport_type.length === 0) throw new Error('Please select at least one sport.');
      await api.post('/arenas', {
        ...form,
        sport_type: form.sport_type.join(',')
      });
      onCreated();
    } catch (err) {
      showToast(err.message, 'error');
    }
    setLoading(false);
  };
  const hours = Array.from({
    length: 24
  }, (_, i) => ({
    val: i,
    label: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`
  }));

  // For closing hours past midnight
  const closeHours = [...hours, {
    val: 24,
    label: '12 AM (Next Day)'
  }, {
    val: 25,
    label: '1 AM (Next Day)'
  }, {
    val: 26,
    label: '2 AM (Next Day)'
  }, {
    val: 27,
    label: '3 AM (Next Day)'
  }, {
    val: 28,
    label: '4 AM (Next Day)'
  }];
  return /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit
  }, /*#__PURE__*/React.createElement("div", {
    className: "create-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      gridColumn: '1 / -1'
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Arena Name"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    required: true,
    placeholder: "Thunder Arena",
    value: form.name,
    onChange: e => setForm({
      ...form,
      name: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      gridColumn: '1 / -1'
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Sport Types"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8
    }
  }, SPORTS.map(s => {
    const active = form.sport_type.includes(s.value);
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      key: s.value,
      onClick: () => {
        setForm(f => ({
          ...f,
          sport_type: active ? f.sport_type.filter(x => x !== s.value) : [...f.sport_type, s.value]
        }));
      },
      style: {
        padding: '8px 16px',
        borderRadius: 'var(--r-sm)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        background: active ? 'rgba(232,55,26,0.1)' : 'var(--surface2)',
        color: active ? 'white' : 'var(--text2)',
        transition: 'all 0.2s'
      }
    }, s.label);
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16,
      marginBottom: 16,
      background: 'rgba(255,255,255,0.03)',
      padding: 16,
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      marginBottom: 0
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Day Price (\u20B9/hr)"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "number",
    required: true,
    value: form.price_day,
    onChange: e => setForm({
      ...form,
      price_day: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      marginBottom: 0
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Night/Peak Price (\u20B9/hr)"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "number",
    required: true,
    value: form.price_night,
    onChange: e => setForm({
      ...form,
      price_night: e.target.value
    })
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16,
      marginBottom: 16,
      background: 'rgba(232, 55, 26, 0.03)',
      padding: 16,
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      marginBottom: 0
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Weekend Day Price (\u20B9/hr)"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "number",
    required: true,
    value: form.price_weekend_day,
    onChange: e => setForm({
      ...form,
      price_weekend_day: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      marginBottom: 0
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Weekend Peak Price (\u20B9/hr)"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "number",
    required: true,
    value: form.price_weekend_night,
    onChange: e => setForm({
      ...form,
      price_weekend_night: e.target.value
    })
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 12,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Opens At"), /*#__PURE__*/React.createElement("select", {
    className: "form-input form-select",
    value: form.open_hour,
    onChange: e => setForm({
      ...form,
      open_hour: e.target.value
    })
  }, hours.map(h => /*#__PURE__*/React.createElement("option", {
    key: h.val,
    value: h.val
  }, h.label)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Peak Price Starts"), /*#__PURE__*/React.createElement("select", {
    className: "form-input form-select",
    value: form.peak_start_hour,
    onChange: e => setForm({
      ...form,
      peak_start_hour: e.target.value
    })
  }, hours.map(h => /*#__PURE__*/React.createElement("option", {
    key: h.val,
    value: h.val
  }, h.label)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Closes At"), /*#__PURE__*/React.createElement("select", {
    className: "form-input form-select",
    value: form.close_hour,
    onChange: e => setForm({
      ...form,
      close_hour: e.target.value
    })
  }, closeHours.slice(form.open_hour).map(h => /*#__PURE__*/React.createElement("option", {
    key: h.val,
    value: h.val
  }, h.label))))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "City / Area"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    required: true,
    placeholder: "Mumbai, Andheri",
    value: form.location,
    onChange: e => setForm({
      ...form,
      location: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Full Address"), /*#__PURE__*/React.createElement("textarea", {
    className: "form-input",
    rows: "1",
    placeholder: "Plot No. 45, Sector 12, Andheri West...",
    value: form.address,
    onChange: e => setForm({
      ...form,
      address: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Google Maps Link"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "https://maps.google.com/...",
    value: form.map_url,
    onChange: e => setForm({
      ...form,
      map_url: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Contact Number"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "+91 9876543210",
    value: form.contact,
    onChange: e => setForm({
      ...form,
      contact: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Image URL"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "https://...",
    value: form.image_url,
    onChange: e => setForm({
      ...form,
      image_url: e.target.value
    })
  }))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Description"), /*#__PURE__*/React.createElement("textarea", {
    className: "form-input",
    rows: "2",
    placeholder: "Brief info about facilities...",
    value: form.description,
    onChange: e => setForm({
      ...form,
      description: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(232, 55, 26, 0.03)',
      padding: 16,
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--accent)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      fontWeight: 700,
      marginBottom: 12
    }
  }, "Coupon Settings"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      marginBottom: 0
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Coupon Code (Optional)"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "e.g. SAVE100",
    value: form.coupon_code,
    onChange: e => setForm({
      ...form,
      coupon_code: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      marginBottom: 0
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Discount Value (\u20B9)"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "number",
    value: form.discount_value,
    onChange: e => setForm({
      ...form,
      discount_value: e.target.value
    })
  })))), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: loading,
    className: "submit-btn"
  }, loading ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Spin, null), " Creating Arena...") : 'Create Arena'));
}
/* ============================
   Manage Slots Form — Simplified (Automatic)
============================ */
function ManageSlotsForm({
  arena,
  showToast
}) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadSlots = async () => {
    try {
      const d = await api.get(`/slots/${arena.id}`);
      setSlots(d);
    } catch (err) {
      showToast(err.message, 'error');
    }
    setLoading(false);
  };
  useEffect(() => {
    loadSlots();
  }, []);
  const setStatus = async (slotId, status) => {
    try {
      await api.post(`/slots/block`, {
        slot_id: slotId,
        status
      });
      showToast(`Slot status updated to ${status}`, 'success');
      loadSlots();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
  const grouped = {};
  slots.forEach(s => {
    const d = new Date(s.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(s);
  });
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(232, 55, 26, 0.05)',
      border: '1px solid rgba(232, 55, 26, 0.15)',
      borderRadius: 'var(--r-md)',
      padding: 14,
      marginBottom: 20,
      fontSize: 13,
      color: 'var(--text2)'
    }
  }, /*#__PURE__*/React.createElement("strong", null, "Manual Override:"), " Use \"Block\" for maintenance or private events. \"Available\" makes it open for booking."), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 600,
      overflowY: 'auto',
      paddingRight: 8
    }
  }, loading ? /*#__PURE__*/React.createElement(SpinnerFull, null) : Object.keys(grouped).length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    title: "No Slots Available",
    desc: "Try checking your operating hours."
  }) : Object.keys(grouped).map(date => /*#__PURE__*/React.createElement("div", {
    key: date,
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "filter-label",
    style: {
      marginBottom: 12,
      borderBottom: '1px solid var(--border)',
      paddingBottom: 6
    }
  }, date), /*#__PURE__*/React.createElement("div", {
    className: "slots-grid"
  }, grouped[date].map(slot => /*#__PURE__*/React.createElement("div", {
    key: slot.id,
    className: `slot-btn-manage ${slot.status}`,
    style: {
      display: 'flex',
      flexDirection: 'column',
      padding: 10,
      border: '1px solid var(--border)',
      borderRadius: 8,
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 14
    }
  }, slot.start_time?.substring(0, 5)), /*#__PURE__*/React.createElement(StatusBadge, {
    status: slot.status
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-sm",
    style: {
      flex: 1,
      fontSize: 10,
      padding: '4px'
    },
    onClick: () => setStatus(slot.id, 'available')
  }, "Available"), /*#__PURE__*/React.createElement("button", {
    className: "btn-sm danger",
    style: {
      flex: 1,
      fontSize: 10,
      padding: '4px'
    },
    onClick: () => setStatus(slot.id, 'blocked')
  }, "Block")))))))));
}
function CommunityGames({
  showToast
}) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/bookings/public').then(setGames).catch(err => showToast(err.message, 'error')).finally(() => setLoading(false));
  }, []);
  if (loading) return /*#__PURE__*/React.createElement(SpinnerFull, null);
  if (games.length === 0) return /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text3)',
      fontSize: 13,
      textAlign: 'center',
      padding: '30px',
      background: 'var(--surface2)',
      borderRadius: 12,
      border: '1px dashed var(--border)'
    }
  }, "No public games currently looking for players. Check back later!");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 16
    }
  }, games.map(game => /*#__PURE__*/React.createElement("div", {
    key: game.id,
    style: {
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge badge-green",
    style: {
      textTransform: 'uppercase'
    }
  }, game.sport_type), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--text3)'
    }
  }, game.max_players, " Slots")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 800,
      fontSize: 16
    }
  }, game.arena_name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text2)',
      marginTop: 4
    }
  }, new Date(game.slot_date).toLocaleDateString(), " \xB7 ", game.start_time?.substring(0, 5))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text3)'
    }
  }, "By ", game.customer_name), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary btn-sm",
    onClick: () => showToast('Request sent to join game!', 'success')
  }, "Join Game")))));
}
function Spin() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 16,
      height: 16,
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: 'white',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0
    }
  });
}
function SpinnerFull() {
  return /*#__PURE__*/React.createElement("div", {
    className: "spinner-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "spinner"
  }));
}
function EmptyState({
  title,
  desc,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "empty-state anim-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "empty-icon"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "8",
    x2: "12",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "16",
    x2: "12.01",
    y2: "16"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "empty-title"
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "empty-desc"
  }, desc), action);
}
function StatusBadge({
  status
}) {
  const map = {
    confirmed: 'badge-green',
    pending: 'badge-amber',
    cancelled: 'badge-red',
    payment_failed: 'badge-red'
  };
  return /*#__PURE__*/React.createElement("span", {
    className: `badge ${map[status] || 'badge-gray'}`
  }, status?.replace('_', ' ') || 'Unknown');
}
function PayBadge({
  status
}) {
  const map = {
    paid: 'badge-green',
    unpaid: 'badge-gray',
    failed: 'badge-red'
  };
  return /*#__PURE__*/React.createElement("span", {
    className: `badge ${map[status] || 'badge-gray'}`
  }, status || 'Unpaid');
}
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    className: "footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "footer-inner"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "logo-mark",
    style: {
      width: 28,
      height: 28
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    style: {
      width: 14,
      height: 14
    },
    fill: "white"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 16,
      color: 'var(--text)',
      textTransform: 'uppercase'
    }
  }, "SportArena")), /*#__PURE__*/React.createElement("div", {
    className: "footer-copy"
  }, "\xA9 2025 SportArena. All rights reserved."), /*#__PURE__*/React.createElement("div", {
    className: "footer-right"
  }, /*#__PURE__*/React.createElement("span", {
    className: "footer-link"
  }, "Privacy"), /*#__PURE__*/React.createElement("span", {
    className: "footer-link"
  }, "Terms"), /*#__PURE__*/React.createElement("span", {
    className: "footer-link"
  }, "Support"))));
}

/* ============================
   App Root
============================ */
function App() {
  const [page, setPage] = useState('home');
  const [selectedArena, setSelectedArena] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'info') => setToast({
    message,
    type
  });
  return /*#__PURE__*/React.createElement(AuthProvider, null, /*#__PURE__*/React.createElement(AppContent, {
    page: page,
    setPage: setPage,
    selectedArena: selectedArena,
    setSelectedArena: setSelectedArena,
    toast: toast,
    setToast: setToast,
    showToast: showToast
  }));
}
function AppContent({
  page,
  setPage,
  selectedArena,
  setSelectedArena,
  toast,
  setToast,
  showToast
}) {
  const {
    user,
    loading,
    socket
  } = useAuth();
  useEffect(() => {
    if (socket) {
      socket.on('notification', data => {
        showToast(data.message, data.type === 'booking_confirmed' ? 'success' : 'info');
      });
      return () => socket.off('notification');
    }
  }, [socket]);
  useEffect(() => {
    if (loading) return;
    const authPages = ['login', 'register', 'home', 'arena-detail'];
    if (!user && !authPages.includes(page)) setPage('home');
  }, [user, loading, page]);
  if (loading) return /*#__PURE__*/React.createElement(SpinnerFull, null);
  const renderPage = () => {
    switch (page) {
      case 'login':
        return /*#__PURE__*/React.createElement(LoginPage, {
          setPage: setPage,
          showToast: showToast
        });
      case 'register':
        return /*#__PURE__*/React.createElement(RegisterPage, {
          setPage: setPage,
          showToast: showToast
        });
      case 'home':
        return /*#__PURE__*/React.createElement(HomePage, {
          setPage: setPage,
          setSelectedArena: setSelectedArena,
          showToast: showToast
        });
      case 'arena-detail':
        return /*#__PURE__*/React.createElement(ArenaDetailPage, {
          arena: selectedArena,
          setPage: setPage,
          showToast: showToast
        });
      case 'my-bookings':
        return /*#__PURE__*/React.createElement(MyBookingsPage, {
          setPage: setPage,
          showToast: showToast
        });
      case 'dashboard':
        return user?.role === 'business' ? /*#__PURE__*/React.createElement(DashboardPage, {
          setPage: setPage,
          showToast: showToast
        }) : /*#__PURE__*/React.createElement(HomePage, {
          setPage: setPage,
          setSelectedArena: setSelectedArena,
          showToast: showToast
        });
      case 'my-arenas':
        return user?.role === 'business' ? /*#__PURE__*/React.createElement(MyArenasPage, {
          setPage: setPage,
          showToast: showToast
        }) : /*#__PURE__*/React.createElement(HomePage, {
          setPage: setPage,
          setSelectedArena: setSelectedArena,
          showToast: showToast
        });
      default:
        return /*#__PURE__*/React.createElement(HomePage, {
          setPage: setPage,
          setSelectedArena: setSelectedArena,
          showToast: showToast
        });
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(Navbar, {
    currentPage: page,
    setPage: setPage
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1
    }
  }, renderPage()), /*#__PURE__*/React.createElement(Footer, null), toast && /*#__PURE__*/React.createElement(Toast, {
    message: toast.message,
    type: toast.type,
    onClose: () => setToast(null)
  }));
}
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }
  componentDidCatch(error, errorInfo) {
    console.error("React Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return /*#__PURE__*/React.createElement("div", {
        style: {
          padding: '40px',
          color: 'red',
          background: '#111'
        }
      }, /*#__PURE__*/React.createElement("h1", null, "React Crashed"), /*#__PURE__*/React.createElement("pre", null, this.state.error.toString()));
    }
    return this.props.children;
  }
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(/*#__PURE__*/React.createElement(ErrorBoundary, null, /*#__PURE__*/React.createElement(App, null)));