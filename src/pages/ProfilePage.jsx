import React from 'react';
import { Link } from 'react-router-dom';
import { PARENT, LINKED_STUDENTS } from '../data/parentMock.js';

const FOOTER_LINKS = [
  { label: 'Privacy Policy', path: '#' },
  { label: 'Terms of Service', path: '#' },
  { label: 'Help Center', path: '/support' }
];

const SIDEBAR_LINKS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'home', active: false },
  { label: 'Applications', path: '/applications', icon: 'description', active: false },
  { label: 'Profile', path: '/profile', icon: 'person', active: true },
  { label: 'Messages', path: '/student/messages', icon: 'chat_bubble', active: false }
];

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('');
}

const dependents = LINKED_STUDENTS.filter((s) => !s.isAdult);
const adults = LINKED_STUDENTS.filter((s) => s.isAdult);

export function ProfilePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Public Sans, system-ui, sans-serif', background: '#f9f9ff', color: '#141b2b' }}>
      <header style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, background: '#111827', color: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 64px', height: '64px' }}>
        <div style={{ fontSize: '24px', fontWeight: 700 }}>ScholarShip</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <span class="material-symbols-outlined" style={{ color: '#ffffff' }}>notifications</span>
            <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%', border: '2px solid #111827' }}></span>
          </div>
          <span class="material-symbols-outlined" style={{ color: '#ffffff', cursor: 'pointer', fontVariationSettings: "'FILL' 1" }}>account_circle</span>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', marginTop: '64px' }}>
        <aside style={{ position: 'fixed', left: 0, top: '64px', height: 'calc(100vh - 64px)', width: '256px', background: '#f1f3ff', boxShadow: 'inset -1px 0 0 rgba(195,198,214,0.3)', display: 'flex', flexDirection: 'column', padding: '16px 0' }}>
          <div style={{ padding: '0 24px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #003594, #004ac6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px' }}>
                {getInitials(PARENT.fullName)}
              </div>
              <div>
                <p style={{ fontFamily: 'Public Sans', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', color: '#003594', margin: 0 }}>Welcome, Guardian</p>
                <p style={{ fontSize: '10px', color: '#434654', margin: '4px 0 0' }}>Parent Portal</p>
              </div>
            </div>
          </div>
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {SIDEBAR_LINKS.map((link) => (
              <Link key={link.path} to={link.path} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 24px', color: link.active ? '#003594' : '#434654', fontWeight: link.active ? 700 : 400, borderRight: link.active ? '4px solid #003594' : 'none', background: link.active ? 'rgba(0,53,148,0.1)' : 'transparent', textDecoration: 'none', fontSize: '12px', fontFamily: 'Public Sans', letterSpacing: '0.05em', transition: 'all 0.2s' }}>
                <span class="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: link.active ? "'FILL' 1" : "'FILL' 0" }}>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
          <div style={{ padding: '24px', borderTop: '1px solid rgba(195,198,214,0.3)' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 0', color: '#434654', textDecoration: 'none', fontSize: '12px', fontFamily: 'Public Sans' }}>
              <span class="material-symbols-outlined" style={{ fontSize: '20px' }}>settings</span>
              <span>Settings</span>
            </Link>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 0', color: '#434654', textDecoration: 'none', fontSize: '12px', fontFamily: 'Public Sans' }}>
              <span class="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
              <span>Logout</span>
            </Link>
          </div>
        </aside>

        <main style={{ flex: 1, marginLeft: '256px', padding: '64px', overflowX: 'hidden' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <section style={{ marginBottom: '64px' }}>
              <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', position: 'relative', overflow: 'hidden', boxShadow: '0px 8px 30px rgba(15,23,42,0.06)', border: '1px solid rgba(241,228,193,0.3)' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '256px', height: '256px', background: 'rgba(0,53,148,0.05)', borderRadius: '50%', marginRight: '-128px', marginTop: '-128px' }}></div>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '128px', height: '128px', borderRadius: '1rem', background: 'linear-gradient(135deg, #003594, #004ac6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '48px', fontWeight: 700, boxShadow: '0px 8px 30px rgba(15,23,42,0.06)', border: '4px solid white' }}>
                    {getInitials(PARENT.fullName)}
                  </div>
                </div>
                <div style={{ textAlign: 'center', zIndex: 10 }}>
                  <h1 style={{ fontFamily: 'Public Sans', fontSize: '44px', fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#003594', margin: '0 0 4px' }}>{PARENT.fullName}</h1>
                  <p style={{ fontFamily: 'Public Sans', fontSize: '16px', color: '#434654', margin: '0 0 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span class="material-symbols-outlined" style={{ fontSize: '18px' }}>school</span>
                    Primary Guardian
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
                    <span style={{ padding: '6px 16px', background: '#f1f3ff', color: '#003594', borderRadius: '9999px', border: '1px solid rgba(0,53,148,0.1)', fontFamily: 'Public Sans', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em' }}>ID: {PARENT.nationalId}</span>
                    <span style={{ padding: '6px 16px', background: '#FFF9EB', color: '#755b00', borderRadius: '9999px', border: '1px solid rgba(241,228,193,0.5)', fontFamily: 'Public Sans', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span class="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>verified</span>
                      Verified Institutional Access
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <section style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '32px', border: '1px solid rgba(241,228,193,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <h2 style={{ fontFamily: 'Public Sans', fontSize: '24px', fontWeight: 600, letterSpacing: '-0.01em', color: '#141b2b', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span class="material-symbols-outlined" style={{ color: '#003594' }}>person_outline</span>
                      Personal Details
                    </h2>
                    <button style={{ fontFamily: 'Public Sans', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', color: '#003594', border: 'none', background: 'none', cursor: 'pointer' }}>Update All</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontFamily: 'Public Sans', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', color: '#434654', padding: '0 4px' }}>Full Legal Name</label>
                      <input style={{ background: '#ffffff', border: '1px solid #c3c6d6', borderRadius: '0.75rem', padding: '12px 16px', fontFamily: 'Public Sans', fontSize: '14px', color: '#141b2b' }} type="text" value={PARENT.fullName} readOnly />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontFamily: 'Public Sans', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', color: '#434654', padding: '0 4px' }}>Phone Number</label>
                      <input style={{ background: '#ffffff', border: '1px solid #c3c6d6', borderRadius: '0.75rem', padding: '12px 16px', fontFamily: 'Public Sans', fontSize: '14px', color: '#141b2b' }} type="tel" value={PARENT.phone} readOnly />
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontFamily: 'Public Sans', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', color: '#434654', padding: '0 4px' }}>Email</label>
                      <input style={{ background: '#f1f3ff', border: '1px solid rgba(195,198,214,0.3)', borderRadius: '0.75rem', padding: '12px 16px', fontFamily: 'Public Sans', fontSize: '14px', color: '#434654', cursor: 'not-allowed' }} type="email" value={PARENT.email} readOnly />
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontFamily: 'Public Sans', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', color: '#434654', padding: '0 4px' }}>Ward</label>
                      <input style={{ background: '#ffffff', border: '1px solid #c3c6d6', borderRadius: '0.75rem', padding: '12px 16px', fontFamily: 'Public Sans', fontSize: '14px', color: '#141b2b' }} type="text" value={PARENT.ward} readOnly />
                    </div>
                  </div>
                </section>

                <section style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '32px', border: '1px solid rgba(241,228,193,0.3)' }}>
                  <h2 style={{ fontFamily: 'Public Sans', fontSize: '24px', fontWeight: 600, letterSpacing: '-0.01em', color: '#141b2b', margin: '0 0 32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span class="material-symbols-outlined" style={{ color: '#003594' }}>task_alt</span>
                    Document Verification
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                    {LINKED_STUDENTS.map((s) => (
                      <div key={s.id} style={{ padding: '16px', background: '#f1f3ff', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: s.documentStatus === 'Complete' ? '#dcfce7' : 'rgba(0,53,148,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.documentStatus === 'Complete' ? '#15803d' : '#003594' }}>
                            <span class="material-symbols-outlined" style={{ fontSize: '20px' }}>{s.documentStatus === 'Complete' ? 'id_card' : 'description'}</span>
                          </div>
                          <div>
                            <p style={{ fontFamily: 'Public Sans', fontSize: '14px', fontWeight: 600, color: '#141b2b', margin: 0 }}>{s.fullName}</p>
                            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: s.documentStatus === 'Complete' ? '#15803d' : '#003594', margin: 0 }}>
                              {s.documentStatus}
                            </p>
                          </div>
                        </div>
                        <span class="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", color: s.documentStatus === 'Complete' ? '#15803d' : '#003594' }}>
                          {s.documentStatus === 'Complete' ? 'check_circle' : 'pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {dependents.length > 0 && (
                  <section style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '32px', border: '1px solid rgba(241,228,193,0.3)' }}>
                    <h2 style={{ fontFamily: 'Public Sans', fontSize: '24px', fontWeight: 600, letterSpacing: '-0.01em', color: '#141b2b', margin: '0 0 32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span class="material-symbols-outlined" style={{ color: '#003594' }}>group</span>
                      Dependent Students
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                      {dependents.map((s) => (
                        <div key={s.id} style={{ padding: '16px', background: '#f1f3ff', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,53,148,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#003594', fontWeight: 700, fontSize: '14px' }}>
                              {getInitials(s.fullName)}
                            </div>
                            <div>
                              <p style={{ fontFamily: 'Public Sans', fontSize: '14px', fontWeight: 600, color: '#141b2b', margin: 0 }}>{s.fullName}</p>
                              <p style={{ fontSize: '12px', color: '#434654', margin: '4px 0 0' }}>{s.school} &middot; {s.grade}</p>
                            </div>
                          </div>
                          <span style={{ padding: '4px 8px', background: s.accessType === 'Full Control' ? '#dcfce7' : s.accessType === 'Delegated Access' ? '#ffedd5' : '#ede9fe', color: s.accessType === 'Full Control' ? '#15803d' : s.accessType === 'Delegated Access' ? '#c2410c' : '#7c3aed', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em' }}>
                            {s.accessType}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <section style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '32px', border: '1px solid rgba(241,228,193,0.3)' }}>
                  <h2 style={{ fontFamily: 'Public Sans', fontSize: '24px', fontWeight: 600, letterSpacing: '-0.01em', color: '#141b2b', margin: '0 0 32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span class="material-symbols-outlined" style={{ color: '#003594' }}>shield</span>
                    Security
                  </h2>
                  <div>
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontFamily: 'Public Sans', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', color: '#434654', textTransform: 'uppercase', margin: '0 0 12px' }}>Password Management</h3>
                      <button style={{ width: '100%', padding: '12px', border: '1px solid rgba(0,53,148,0.2)', background: 'rgba(0,53,148,0.05)', color: '#003594', borderRadius: '0.75rem', fontFamily: 'Public Sans', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span class="material-symbols-outlined" style={{ fontSize: '18px' }}>lock_reset</span>
                        Update Portal Password
                      </button>
                      <p style={{ margin: '8px 0 0', fontSize: '11px', color: 'rgba(67,70,84,0.7)', fontStyle: 'italic', padding: '0 4px' }}>Last changed 42 days ago</p>
                    </div>
                    <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(195,198,214,0.3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <h3 style={{ fontFamily: 'Public Sans', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', color: '#434654', textTransform: 'uppercase', margin: 0 }}>Two-Factor Auth</h3>
                        <span style={{ padding: '4px 8px', background: '#dcfce7', color: '#15803d', fontSize: '10px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700 }}>Active</span>
                      </div>
                      <div style={{ background: '#f1f3ff', borderRadius: '0.75rem', padding: '16px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <span class="material-symbols-outlined" style={{ color: '#003594', marginTop: '2px' }}>phonelink_ring</span>
                          <div>
                            <p style={{ fontFamily: 'Public Sans', fontSize: '14px', fontWeight: 600, color: '#141b2b', margin: 0 }}>Authenticator App</p>
                            <p style={{ fontSize: '12px', color: '#434654', margin: '4px 0 0' }}>Using Google Authenticator</p>
                          </div>
                        </div>
                      </div>
                      <button style={{ fontSize: '12px', fontWeight: 600, color: '#003594', border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}>Manage 2FA Methods</button>
                    </div>
                  </div>
                </section>

                <section style={{ background: 'linear-gradient(135deg, #111827, #003594)', borderRadius: '1.5rem', padding: '32px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '128px', height: '128px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', marginRight: '-64px', marginTop: '-64px' }}></div>
                  <h3 style={{ fontFamily: 'Public Sans', fontSize: '24px', fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 8px' }}>Parent Guardian</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: '0 0 24px', lineHeight: 1.5 }}>As a verified guardian, you have priority access to application management and direct communication with the scholarship board.</p>
                  <button style={{ width: '100%', background: '#FFF9EB', color: '#003594', padding: '12px', borderRadius: '0.75rem', border: 'none', fontFamily: 'Public Sans', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', cursor: 'pointer' }}>
                    View Member Benefits
                  </button>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer style={{ background: '#111827', color: '#ffffff', padding: '32px 64px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ fontFamily: 'Public Sans', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em' }}>ScholarShip Education Management</div>
        <p style={{ fontSize: '12px', opacity: 0.6, margin: 0 }}>&copy; 2026 ScholarShip Education Management. All rights reserved.</p>
        <div style={{ display: 'flex', gap: '32px', fontSize: '16px' }}>
          {FOOTER_LINKS.map((link) => (
            <Link key={link.label} to={link.path} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px' }}>{link.label}</Link>
          ))}
        </div>
      </footer>

      <nav style={{ position: 'fixed', bottom: 0, width: '100%', background: 'rgba(249,249,255,0.8)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(195,198,214,0.3)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '64px', zIndex: 50 }}>
        {[
          { label: 'Home', path: '/dashboard', icon: 'home' },
          { label: 'Profile', path: '/profile', icon: 'person', active: true },
          { label: 'Applications', path: '/applications', icon: 'description' },
          { label: 'Settings', path: '/profile', icon: 'settings' }
        ].map((tab) => (
          <Link key={tab.path} to={tab.path} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: tab.active ? '#003594' : '#434654', textDecoration: 'none', fontSize: '10px', fontWeight: 700 }}>
            <span class="material-symbols-outlined" style={{ fontVariationSettings: tab.active ? "'FILL' 1" : "'FILL' 0", fontSize: '24px' }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
