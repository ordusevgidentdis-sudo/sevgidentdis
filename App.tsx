
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { PublicView } from './components/PublicView';
import { AdminPanel } from './components/AdminPanel';
import { api } from './services/apiService';
import { View, Post, Service, Doctor, GalleryItem, Settings } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<View>('public');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('sevgident_token'));
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  
  const [data, setData] = useState<{
    posts: Post[],
    services: Service[],
    doctors: Doctor[],
    gallery: GalleryItem[],
    settings: Settings | null
  }>({
    posts: [],
    services: [],
    doctors: [],
    gallery: [],
    settings: null
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [settings, posts, services, doctors, gallery] = await Promise.all([
        api.getSettings(),
        api.getPosts(),
        api.getServices(),
        api.getDoctors(),
        api.getGallery()
      ]);
      setData({ settings, posts, services, doctors, gallery });
      setIsOffline(api.isUsingMock);
    } catch (err) {
      console.error("Veri yüklenemedi:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getHashParams = () => {
    const hash = window.location.hash;
    const parts = hash.split('/');
    return {
      base: parts[0] || '',
      id: parts[1] || null
    };
  };

  useEffect(() => {
    const handleHash = () => {
      const { base } = getHashParams();
      const adminPath = data.settings?.adminPath || 'admin';

      if (base === '#' + adminPath) {
        if (isLoggedIn) setView('admin');
        else setView('login');
      }
      else if (base === '#services') setView('all_services');
      else if (base === '#doctors') setView('all_doctors');
      else if (base === '#gallery') setView('all_gallery');
      else if (base === '#blog') setView('all_blog');
      else if (base === '#login') setView('login');
      else if (base === '#service_detail') setView('service_detail');
      else if (base === '#doctor_detail') setView('doctor_detail');
      else if (base === '#blog_detail') setView('blog_detail');
      else if (base === '' || base === '#') setView('public');
      else setView('public');
    };

    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, [isLoggedIn, data.settings?.adminPath]);

  const navigate = (newView: View, id?: string) => {
    const adminPath = data.settings?.adminPath || 'admin';
    let hash = '';
    if (newView === 'public') hash = '';
    else if (newView === 'all_services') hash = 'services';
    else if (newView === 'all_doctors') hash = 'doctors';
    else if (newView === 'all_gallery') hash = 'gallery';
    else if (newView === 'all_blog') hash = 'blog';
    else if (newView === 'admin') hash = adminPath;
    else if (newView === 'login') hash = 'login';
    else if (newView === 'service_detail') hash = `service_detail/${id}`;
    else if (newView === 'doctor_detail') hash = `doctor_detail/${id}`;
    else if (newView === 'blog_detail') hash = `blog_detail/${id}`;
    
    window.location.hash = hash;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await api.login(loginForm.username, loginForm.password);
      setIsLoggedIn(true);
      const adminPath = data.settings?.adminPath || 'admin';
      window.location.hash = adminPath;
    } catch (err: any) {
      setLoginError(err.message || "Giriş başarısız.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sevgident_token');
    setIsLoggedIn(false);
    window.location.hash = '';
  };

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const settings: Settings = data.settings || {
    clinicName: 'Sevgi Dent',
    logoText: 'KLİNİK',
    logoSubText: 'DİŞ POLİKLİNİĞİ',
    logoEmoji: '🦷',
    footerLogoUrl: '',
    logoColor: '#e11d48',
    logoSize: '64',
    phone: '0000 000 00 00',
    address: 'Adres girilmemiş',
    email: '',
    faviconUrl: '',
    mapsIframe: '',
    footerSlogan: '',
    workingHoursWeekday: '',
    workingHoursSaturday: '',
    workingHoursSunday: '',
    adminPath: 'admin'
  };

  const renderContent = () => {
    const { id } = getHashParams();

    switch (view) {
      case 'public': return <PublicView onNavigate={navigate} />;
      
      case 'all_services':
        return (
          <div className="container mx-auto px-6 py-24">
            <h1 className="text-5xl font-black mb-12">Hizmetlerimiz</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {data.services.filter(s => s.isVisible !== false).map(s => (
                <div key={s.id} onClick={() => navigate('service_detail', s.id)} className="cursor-pointer group">
                  <img src={s.image} className="w-full h-64 object-cover rounded-3xl" alt={s.name} />
                  <h3 className="text-xl font-bold mt-4 group-hover:text-brand">{s.name}</h3>
                </div>
              ))}
            </div>
          </div>
        );

      case 'service_detail':
        const s = data.services.find(x => x.id.toString() === id);
        if (!s) return <PublicView onNavigate={navigate} />;
        return (
          <div className="container mx-auto px-6 py-24 max-w-4xl">
            <img src={s.image} className="w-full h-[500px] object-cover rounded-[3rem] shadow-xl" alt={s.name} />
            <h1 className="text-5xl font-black mt-12">{s.name}</h1>
            <p className="mt-8 text-xl text-gray-600 whitespace-pre-wrap leading-relaxed">{s.description}</p>
            <button onClick={() => navigate('all_services')} className="mt-12 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold">← Tüm Tedavilere Dön</button>
          </div>
        );

      case 'all_doctors':
        return (
          <div className="container mx-auto px-6 py-24">
            <h1 className="text-5xl font-black mb-12">Hekimlerimiz</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {data.doctors.filter(d => d.isVisible !== false).map(d => (
                <div key={d.id} onClick={() => navigate('doctor_detail', d.id)} className="cursor-pointer text-center group">
                  <img src={d.image} className="w-full h-80 object-cover rounded-3xl" alt={d.name} />
                  <h3 className="text-xl font-bold mt-4 group-hover:text-brand">{d.name}</h3>
                  <p className="text-brand font-bold text-xs uppercase">{d.title}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'doctor_detail':
        const d = data.doctors.find(x => x.id.toString() === id);
        if (!d) return <PublicView onNavigate={navigate} />;
        return (
          <div className="container mx-auto px-6 py-24 max-w-5xl grid md:grid-cols-2 gap-12">
            <img src={d.image} className="w-full h-[600px] object-cover rounded-[3rem] shadow-xl" alt={d.name} />
            <div className="py-8">
              <span className="text-brand font-black text-xs uppercase tracking-widest">{d.title}</span>
              <h1 className="text-5xl font-black mt-2">{d.name}</h1>
              <p className="mt-8 text-lg text-gray-600 whitespace-pre-wrap">{d.description}</p>
              <button onClick={() => navigate('all_doctors')} className="mt-12 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold">← Tüm Hekimlere Dön</button>
            </div>
          </div>
        );

      case 'all_blog':
        return (
          <div className="container mx-auto px-6 py-24">
            <h1 className="text-5xl font-black mb-12">Blog</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {data.posts.filter(p => p.status === 'published' && p.isVisible !== false).map(p => (
                <div key={p.id} onClick={() => navigate('blog_detail', p.id)} className="cursor-pointer group">
                  <img src={p.image} className="w-full h-64 object-cover rounded-3xl" alt={p.title} />
                  <p className="text-brand text-xs font-bold mt-4 uppercase">{p.date}</p>
                  <h3 className="text-xl font-bold mt-2 group-hover:text-brand">{p.title}</h3>
                </div>
              ))}
            </div>
          </div>
        );

      case 'blog_detail':
        const p = data.posts.find(x => x.id.toString() === id);
        if (!p) return <PublicView onNavigate={navigate} />;
        return (
          <div className="container mx-auto px-6 py-24 max-w-4xl">
            <img src={p.image} className="w-full h-[500px] object-cover rounded-[3rem] shadow-xl" alt={p.title} />
            <div className="mt-12 space-y-4">
              <span className="bg-rose-50 text-brand px-4 py-2 rounded-xl font-bold text-sm">{p.date}</span>
              <h1 className="text-5xl font-black">{p.title}</h1>
              <p className="text-xl text-gray-600 whitespace-pre-wrap leading-relaxed pt-6">{p.content}</p>
            </div>
            <button onClick={() => navigate('all_blog')} className="mt-12 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold">← Tüm Yazılara Dön</button>
          </div>
        );

      case 'all_gallery':
        return (
          <div className="container mx-auto px-6 py-24">
             <h1 className="text-5xl font-black mb-12">Galeri</h1>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {data.gallery.filter(g => g.isVisible !== false).map(g => (
                <div key={g.id} className="relative aspect-square overflow-hidden rounded-3xl shadow-lg group">
                  <img src={g.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={g.caption || "Galeri"} />
                  {g.caption && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6 text-center">
                      <span className="text-white font-bold text-lg">{g.caption}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'login':
        return (
          <div className="min-h-[80vh] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-2xl border">
              <h2 className="text-3xl font-black mb-8 text-center">Yönetici Girişi</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <input type="text" placeholder="Kullanıcı Adı" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border focus:border-brand" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
                <input type="password" placeholder="Şifre" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border focus:border-brand" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
                {loginError && <p className="text-red-500 text-xs font-bold">{loginError}</p>}
                <button disabled={isLoggingIn} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black">Giriş Yap</button>
              </form>
            </div>
          </div>
        );

      case 'admin':
        return <AdminPanel onLogout={handleLogout} />;

      default:
        return <PublicView onNavigate={navigate} />;
    }
  };

  return (
    <Layout 
      settings={settings}
      isLoggedIn={isLoggedIn} 
      onLogout={handleLogout} 
      onViewChange={(v, id) => navigate(v as View, id)}
    >
      {isOffline && (
        <div className="fixed bottom-4 left-4 z-[200] bg-orange-500 text-white px-4 py-2 rounded-full text-[10px] font-bold shadow-lg">
          ⚠️ Çevrimdışı Mod
        </div>
      )}
      {renderContent()}
    </Layout>
  );
};

export default App;
