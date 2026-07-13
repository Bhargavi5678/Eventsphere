import { API_BASE_URL } from './config';
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { AIAssistantWidget } from './components/AIAssistantWidget';
import { Dashboard } from './pages/Dashboard';
import { GuestRSVP } from './pages/GuestRSVP';
import { SeatingMap } from './pages/SeatingMap';
import { BudgetManager } from './pages/BudgetManager';
import { EventPlanner } from './pages/EventPlanner';
import { EventWebsiteGen } from './pages/EventWebsiteGen';
import { Certificates } from './pages/Certificates';
import { SponsorsStaff } from './pages/SponsorsStaff';
import { MediaGallery } from './pages/MediaGallery';
import { Ticketing } from './pages/Ticketing';
import { LandingPage } from './pages/LandingPage';
import { VendorMarket } from './pages/VendorMarket';
import { CalendarPage } from './pages/CalendarPage';
import { PollsQA } from './pages/PollsQA';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ShieldCheck, 
  Key, 
  CheckCircle,
  HelpCircle,
  Globe
} from 'lucide-react';

interface EventData {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  theme: string;
  website_slug: string;
  website_config: any;
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [activeEvent, setActiveEvent] = useState<EventData | null>(null);
  
  // Auth states
  const [token, setToken] = useState<string | null>(localStorage.getItem('es_token'));
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'verify'>('login');
  const [authRole, setAuthRole] = useState<string>('Guest');

  // Input states
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [verifyTokenInput, setVerifyTokenInput] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');

  const resetAuthInputs = () => {
    setEmailInput('');
    setPasswordInput('');
    setNameInput('');
    setVerifyTokenInput('');
    setResetEmail('');
    setResetToken('');
    setResetNewPassword('');
  };

  // Notification states
  const [notifications, setNotifications] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Attempt to restore user profile from token on mount
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          setActiveTab('dashboard'); // Redirect to dashboard if logged in
        } else {
          // Token expired or invalid
          handleLogout();
        }
      } catch (err) {
        console.error("Error restoring auth user profile", err);
      }
    };
    fetchMe();
  }, [token]);

  const fetchActiveEvent = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/events/1`);
      if (res.ok) {
        const data = await res.json();
        setActiveEvent(data);
      }
    } catch (err) {
      console.error("Error fetching active event data", err);
    }
  };

  useEffect(() => {
    fetchActiveEvent();
  }, []);

  const triggerNotification = (message: string) => {
    setNotifications(prev => [message, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const clearNotifications = () => {
    setUnreadCount(0);
  };

  const handleLogout = () => {
    localStorage.removeItem('es_token');
    setToken(null);
    setUser(null);
    setActiveTab('landing');
    triggerNotification("Logged out successfully.");
  };

  // PRE-SEEDED LOGINS FOR QUICK TESTING
  const handleSeededLogin = (role: string) => {
    let email = '';
    switch (role) {
      case 'Admin': email = 'admin@eventsphere.com'; break;
      case 'Event Organizer': email = 'organizer@eventsphere.com'; break;
      case 'Vendor': email = 'vendor@eventsphere.com'; break;
      case 'Guest': email = 'guest@eventsphere.com'; break;
    }
    setEmailInput(email);
    setPasswordInput('password');
    setAuthRole(role);
  };

  // STANDARD EMAIL LOGIN
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: passwordInput })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('es_token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
        setShowAuthModal(false);
        setActiveTab('dashboard');
        triggerNotification(`Welcome back, ${data.user.name}!`);
        // Reset inputs
        setEmailInput('');
        setPasswordInput('');
      } else {
        const err = await res.json();
        alert(err.detail || "Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting auth servers.");
    }
  };

  // GOOGLE LOGIN MOCK
  const handleGoogleLoginSimulate = async () => {
    try {
      // Simulate OAuth popup
      let email = 'agent.lukky.google@gmail.com';
      let name = 'Agent Lukky (Google)';
      if (authRole === 'Event Organizer') {
        email = 'organizer.google@gmail.com';
        name = 'Google Host';
      }

      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('es_token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
        setShowAuthModal(false);
        setActiveTab('dashboard');
        triggerNotification("Google Sign-In simulation successful!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // REGISTER
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput,
          name: nameInput,
          password: passwordInput,
          role: authRole
        })
      });
      if (res.ok) {
        triggerNotification("Registration successful! Verify email below.");
        setAuthMode('verify');
      } else {
        const err = await res.json();
        alert(err.detail || "Registration failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // EMAIL VERIFICATION MOCK
  const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, token: verifyTokenInput })
      });
      if (res.ok) {
        triggerNotification("Email verified! You can now log in.");
        setAuthMode('login');
        setPasswordInput('');
      } else {
        const err = await res.json();
        alert(err.detail || "Verification failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // FORGOT PASSWORD
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput })
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Forgot Password Simulation: A mock reset link has been created.\n\nLink: ${data.reset_link}`);
        // Extract token
        const match = data.reset_link.match(/token=([a-f0-9]+)/);
        if (match) {
          setResetToken(match[1]);
        }
        setResetEmail(emailInput);
        setAuthMode('forgot'); // Stays on page but lets them complete reset
      }
    } catch (err) {
      console.error(err);
    }
  };

  // PASSWORD RESET CONFIRMATION
  const handlePasswordResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          token: resetToken,
          password: resetNewPassword
        })
      });
      if (res.ok) {
        triggerNotification("Password updated! Log in with your new credentials.");
        setAuthMode('login');
        setEmailInput(resetEmail);
        setPasswordInput('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAuth = (role?: string) => {
    resetAuthInputs();
    if (role) {
      setAuthRole(role);
      setAuthMode('register');
    } else {
      setAuthMode('login');
    }
    setShowAuthModal(true);
  };

  // Main Page Switcher
  const renderActivePage = () => {
    const role = user?.role || 'Guest';
    switch (activeTab) {
      case 'landing':
        return (
          <LandingPage 
            onLoginClick={handleOpenAuth} 
            isLoggedIn={!!user} 
            currentUser={user}
            onNavigate={setActiveTab} 
          />
        );
      case 'dashboard':
        return (
          <Dashboard 
            eventId={1} 
            triggerNotification={triggerNotification} 
            userRole={role}
            userEmail={user?.email}
            userId={user?.id}
            onNavigate={setActiveTab}
          />
        );
      case 'guests':
        return <GuestRSVP eventId={1} triggerNotification={triggerNotification} />;
      case 'seating':
        return <SeatingMap eventId={1} triggerNotification={triggerNotification} />;
      case 'budget':
        return <BudgetManager eventId={1} triggerNotification={triggerNotification} />;
      case 'aiPlanner':
        return <EventPlanner eventId={1} triggerNotification={triggerNotification} />;
      case 'websiteGen':
        return <EventWebsiteGen eventId={1} activeEvent={activeEvent} refreshEvent={fetchActiveEvent} triggerNotification={triggerNotification} />;
      case 'engagement':
        return <PollsQA eventId={1} triggerNotification={triggerNotification} userRole={role} />;
      case 'certificates':
        return <Certificates eventId={1} triggerNotification={triggerNotification} />;
      case 'sponsorsStaff':
        return <SponsorsStaff eventId={1} triggerNotification={triggerNotification} />;
      case 'gallery':
        return <MediaGallery eventId={1} triggerNotification={triggerNotification} />;
      case 'ticketing':
        return <Ticketing eventId={1} triggerNotification={triggerNotification} />;
      case 'marketplace':
        return <VendorMarket eventId={1} triggerNotification={triggerNotification} userRole={role} />;
      case 'calendar':
        return <CalendarPage eventId={1} triggerNotification={triggerNotification} />;
      default:
        return <LandingPage onLoginClick={handleOpenAuth} isLoggedIn={!!user} currentUser={user} onNavigate={setActiveTab} />;
    }
  };

  // Check if current tab is the landing page to hide navigation panels
  const isLanding = activeTab === 'landing';

  return (
    <div className="min-h-screen bg-[#080B11] text-[#F3F4F6] font-sans flex antialiased">
      
      {/* Sidebar Navigation - HIDE on Landing page */}
      {!isLanding && (
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          userRole={user?.role} 
          userName={user?.name}
          userEmail={user?.email}
          onLogout={handleLogout}
        />
      )}
      
      {/* Main Content Layout */}
      <div className={`flex-1 flex flex-col min-h-screen ${isLanding ? 'pl-0' : 'pl-72'}`}>
        
        {/* Navbar - HIDE on Landing page */}
        {!isLanding && (
          <Navbar 
            activeEvent={activeEvent} 
            notificationCount={unreadCount} 
            clearNotifications={clearNotifications}
            notifications={notifications} 
          />
        )}
        
        {/* Content Wrapper */}
        <main className={`flex-1 ${isLanding ? 'mt-0 p-0 overflow-y-auto' : 'mt-20 p-8 pb-24 overflow-y-auto'}`}>
          {renderActivePage()}
        </main>
        
      </div>

      {/* Floating AI Chat Assistant - HIDE on Landing page */}
      {!isLanding && <AIAssistantWidget eventId={1} />}

      {/* --- AUTHENTICATION MODAL DIALOG --- */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-[#04060a]/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="glass-panel max-w-lg w-full border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-300 shadow-2xl bg-[#090d16] max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="font-black text-white text-lg">
                  {authMode === 'login' ? 'Welcome Back' : authMode === 'register' ? 'Create Account' : authMode === 'forgot' ? 'Reset Password' : 'Verify Email'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {authMode === 'login' ? 'Access your event sphere dashboard' : 'Join EventSphere to create and manage events'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowAuthModal(false);
                  resetAuthInputs();
                }}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QUICK LOGINS SHORTCUTS (Login Mode only) */}
            {authMode === 'login' && (
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 space-y-2">
                <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block">Developer Seed Login Shortcuts</span>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                  <button 
                    type="button"
                    onClick={() => handleSeededLogin('Admin')}
                    className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/15 cursor-pointer text-left truncate"
                  >
                    ★ Admin
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleSeededLogin('Event Organizer')}
                    className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/15 cursor-pointer text-left truncate"
                  >
                    ✦ Organizer
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleSeededLogin('Vendor')}
                    className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/15 cursor-pointer text-left truncate"
                  >
                    ⚙ Vendor
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleSeededLogin('Guest')}
                    className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/15 cursor-pointer text-left truncate"
                  >
                    ✔ Guest
                  </button>
                </div>
              </div>
            )}

            {/* AUTH WIZARD SCREENS */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="email@eventsphere.com"
                      required
                      className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                    <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Password</label>
                    <button 
                      type="button" 
                      onClick={() => setAuthMode('forgot')} 
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide transition-all cursor-pointer glow-primary border border-indigo-500/50"
                >
                  Sign In
                </button>
              </form>
            )}

            {authMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Choose Platform Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Guest', 'Event Organizer', 'Vendor'].map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setAuthRole(role)}
                        className={`p-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                          authRole === role 
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                            : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Jane Doe"
                      required
                      className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                    <UserIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="jane@eventsphere.com"
                      required
                      className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                    <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide transition-all cursor-pointer glow-primary border border-indigo-500/50"
                >
                  Create Account
                </button>
              </form>
            )}

            {authMode === 'verify' && (
              <form onSubmit={handleVerifyEmailSubmit} className="space-y-4">
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl flex gap-3 text-indigo-300 text-xs">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-indigo-400" />
                  <div>
                    <strong className="block text-white font-bold">Email Verification Simulation</strong>
                    We've simulated sending a token to <strong className="text-white">{emailInput}</strong>. 
                    <br />Your mock verification token is: <strong className="text-white font-mono select-all uppercase">ANYTHING (or type: verification)</strong>.
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Verification Code</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={verifyTokenInput}
                      onChange={(e) => setVerifyTokenInput(e.target.value)}
                      placeholder="Enter verification code..."
                      required
                      className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                    <Key className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wide transition-all cursor-pointer"
                >
                  Confirm Verification
                </button>
              </form>
            )}

            {authMode === 'forgot' && (
              <div className="space-y-4">
                {resetToken ? (
                  <form onSubmit={handlePasswordResetConfirm} className="space-y-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex gap-3 text-emerald-300 text-xs">
                      <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
                      <div>
                        <strong className="block text-white font-bold">Token verified!</strong>
                        Complete the password reset below for user: <strong className="text-white">{resetEmail}</strong>.
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">New Password</label>
                      <div className="relative">
                        <input
                          type="password"
                          value={resetNewPassword}
                          onChange={(e) => setResetNewPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white"
                        />
                        <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide transition-colors cursor-pointer"
                    >
                      Save Password
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block">Account Email</label>
                      <div className="relative">
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="email@eventsphere.com"
                          required
                          className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white"
                        />
                        <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide transition-colors cursor-pointer"
                    >
                      Generate Mock Reset Link
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* MOCK GOOGLE AUTH TRIGGER (Only login/register mode) */}
            {(authMode === 'login' || authMode === 'register') && (
              <div className="space-y-4 border-t border-white/5 pt-5">
                <button
                  type="button"
                  onClick={handleGoogleLoginSimulate}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold text-xs transition-colors border border-white/5 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Globe className="w-4.5 h-4.5 text-[#db4437]" />
                  Continue with Google
                </button>

                {/* Switch screen buttons */}
                <div className="text-center text-xs font-semibold text-gray-400">
                  {authMode === 'login' ? (
                    <p>
                      Don't have an account?{' '}
                      <button 
                        type="button" 
                        onClick={() => {
                          resetAuthInputs();
                          setAuthMode('register');
                        }} 
                        className="text-indigo-400 hover:text-indigo-300 transition-colors font-bold cursor-pointer"
                      >
                        Sign Up
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{' '}
                      <button 
                        type="button" 
                        onClick={() => {
                          resetAuthInputs();
                          setAuthMode('login');
                        }} 
                        className="text-indigo-400 hover:text-indigo-300 transition-colors font-bold cursor-pointer"
                      >
                        Sign In
                      </button>
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default App;
