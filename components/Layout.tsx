
import React, { useEffect, useState } from 'react';
import { Settings } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  isLoggedIn?: boolean;
  onLogout?: () => void;
  onViewChange?: (view: any, id?: string) => void;
  settings: Settings | null;
}

export const Layout: React.FC<LayoutProps> = ({ children, isLoggedIn, onLogout, onViewChange, settings }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (settings) {
      const link: any = document.querySelector("link[rel~='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = settings.faviconUrl;
      document.getElementsByTagName('head')[0].appendChild(link);
      document.title = settings.clinicName;
    }
  }, [settings]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isMobileMenuOpen]);

  if (!settings) return null;

  const handleNavClick = (e: React.MouseEvent, view: string, id?: string) => {
    setIsMobileMenuOpen(false);
    if (view.startsWith('#')) {
      const target = document.querySelector(view);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      } else {
        e.preventDefault();
        onViewChange?.('public');
        setTimeout(() => {
          document.querySelector(view)?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    } else {
      e.preventDefault();
      onViewChange?.(view, id);
    }
  };

  const navItems = [
    { id: 'all_services', label: 'Tedaviler' },
    { id: 'all_doctors', label: 'Hekimler' },
    { id: 'all_gallery', label: 'Galeri' },
    { id: 'all_blog', label: 'Blog' },
    { id: '#contact', label: 'İletişim' }
  ];

  const brandColor = settings.logoColor || '#111827';
  const subBrandColor = settings.logoSubColor || '#e11d48';
  const logoSize = parseInt(settings.logoSize || '64');

  // Footer Renkleri (Varsayılanlar belirtildi)
  const fHeaderColor = settings.footerHeaderColor || '#e11d48';
  const fTextColor = settings.footerTextColor || '#9ca3af';
  const fSloganColor = settings.footerSloganColor || '#9ca3af';

  const isImageLogo = (str: string) => {
    if (!str) return false;
    return str.startsWith('http') || str.startsWith('data:image') || str.startsWith('/uploads') || str.startsWith('./uploads');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-rose-100 selection:text-brand bg-white relative">
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-[100]">
        <div className="container mx-auto px-4 md:px-6 min-h-[80px] md:min-h-[96px] py-3 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 cursor-pointer shrink-0" onClick={() => onViewChange?.('public')}>
            <div 
              style={{ height: `${logoSize}px` }}
              className="flex items-center justify-center transition-all duration-300"
            >
              {isImageLogo(settings.logoEmoji) ? (
                <img src={settings.logoEmoji} alt="Logo" className="h-full w-auto object-contain block" />
              ) : (
                <span style={{ fontSize: `${logoSize * 0.8}px`, lineHeight: 1 }} className="flex items-center">{settings.logoEmoji}</span>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <span style={{ color: brandColor }} className="text-lg md:text-2xl font-black tracking-tighter leading-none uppercase">
                {settings.logoText}
              </span>
              <span style={{ color: subBrandColor }} className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest mt-1 leading-none">
                {settings.logoSubText}
              </span>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map(item => (
              <a 
                key={item.id} 
                href={`#${item.id}`} 
                onClick={(e) => handleNavClick(e, item.id)} 
                className="text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center space-x-2 md:space-x-4">
            <a 
              href={`tel:${settings.phone.replace(/\D/g,'')}`} 
              className="flex items-center justify-center px-4 py-2.5 md:px-6 md:py-3.5 rounded-2xl transition-all shadow-lg bg-white space-x-2 hover:bg-gray-50 active:scale-95 border border-gray-100"
            >
               <span className="text-lg md:text-xl">📞</span>
               <span style={{ color: subBrandColor }} className="text-[10px] md:text-xs font-black hidden sm:inline tracking-tight uppercase">{settings.phone}</span>
            </a>
            
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="lg:hidden w-11 h-11 flex flex-col justify-center items-center gap-1.5 focus:outline-none bg-gray-50 rounded-2xl border border-gray-100"
            >
              <span style={{ backgroundColor: subBrandColor }} className="h-0.5 w-6 rounded-full"></span>
              <span style={{ backgroundColor: subBrandColor }} className="h-0.5 w-6 rounded-full"></span>
              <span style={{ backgroundColor: subBrandColor }} className="h-0.5 w-6 rounded-full"></span>
            </button>
          </div>
        </div>
      </header>

      {/* MOBİL MENÜ PANELİ */}
      <div 
        className={`fixed inset-0 z-[1000] lg:hidden transition-all duration-300 ${isMobileMenuOpen ? 'visible' : 'invisible'}`}
      >
         <div 
           className={`absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`} 
           onClick={() => setIsMobileMenuOpen(false)}
         ></div>
         
         <div 
           className={`absolute inset-y-0 left-0 w-[280px] bg-white shadow-2xl transition-transform duration-500 ease-out transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}
         >
            <div className="p-5 flex items-center justify-between border-b border-gray-50 shrink-0">
               <div className="flex items-center space-x-3">
                  <div className="h-10 w-auto flex items-center justify-center">
                     {isImageLogo(settings.logoEmoji) ? (
                        <img src={settings.logoEmoji} alt="Logo" className="h-full w-auto object-contain" />
                     ) : (
                        <span className="text-2xl">{settings.logoEmoji}</span>
                     )}
                  </div>
                  <span className="text-sm font-black text-gray-900 uppercase tracking-tighter">{settings.logoText}</span>
               </div>
               <button 
                 onClick={() => setIsMobileMenuOpen(false)} 
                 className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 font-bold border border-gray-100"
               >
                 ✕
               </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6">
               <nav className="flex flex-col space-y-2">
                 {navItems.map((item) => (
                   <a 
                     key={item.id} 
                     href={`#${item.id}`} 
                     onClick={(e) => handleNavClick(e, item.id)} 
                     className="w-full px-5 py-4 text-base font-black text-gray-800 bg-gray-50/50 hover:bg-gray-100 rounded-2xl transition-all flex items-center justify-between border border-transparent hover:border-gray-200 group"
                   >
                     <span className="uppercase tracking-widest">{item.label}</span>
                     <span style={{ color: subBrandColor }} className="text-xs opacity-30 group-hover:opacity-100 transition-all">→</span>
                   </a>
                 ))}
               </nav>
            </div>

            <div className="p-5 border-t border-gray-50 bg-gray-50/30 shrink-0">
               <a 
                 href={`tel:${settings.phone.replace(/\D/g,'')}`}
                 className="w-full py-4 bg-gray-900 text-white rounded-2xl flex items-center justify-center space-x-2 font-black text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-transform"
               >
                 <span>BİZİ ARAYIN</span>
                 <span className="opacity-20">|</span>
                 <span>📞</span>
               </a>
            </div>
         </div>
      </div>

      <main className="flex-grow">{children}</main>

      <footer className="bg-gray-900 text-white pt-20 pb-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-4">
                <div className="h-16 md:h-24 w-auto flex items-center justify-center shrink-0">
                   {settings.footerLogoUrl ? (
                      <img src={settings.footerLogoUrl} alt="Footer Logo" className="h-full w-auto object-contain" />
                   ) : isImageLogo(settings.logoEmoji) ? (
                      <img src={settings.logoEmoji} alt="Logo" className="h-full w-auto object-contain" />
                   ) : (
                      <span className="text-4xl">{settings.logoEmoji}</span>
                   )}
                </div>
                {!settings.footerLogoUrl && <span style={{ color: 'white' }} className="text-2xl font-black tracking-tighter uppercase">{settings.logoText}</span>}
              </div>
              <p style={{ color: fSloganColor }} className="text-sm font-medium leading-relaxed">{settings.footerSlogan}</p>
            </div>
            
            <div className="space-y-6 text-center sm:text-left">
              <h4 style={{ color: fHeaderColor }} className="text-xs font-black uppercase tracking-widest text-brand">Hızlı Menü</h4>
              <ul className="space-y-3 text-sm font-bold">
                <li><a href="#" style={{ color: fTextColor }} onClick={(e) => handleNavClick(e, 'all_services')} className="hover:text-white transition-colors">Tedavi Seçenekleri</a></li>
                <li><a href="#" style={{ color: fTextColor }} onClick={(e) => handleNavClick(e, 'all_gallery')} className="hover:text-white transition-colors">Klinik Galeri</a></li>
                <li><a href="#" style={{ color: fTextColor }} onClick={(e) => handleNavClick(e, 'all_doctors')} className="hover:text-white transition-colors">Hekim Kadromuz</a></li>
              </ul>
            </div>

            <div className="space-y-6 text-center sm:text-left">
              <h4 style={{ color: fHeaderColor }} className="text-xs font-black uppercase tracking-widest text-brand">İletişim</h4>
              <div className="space-y-3 text-sm font-bold">
                <p style={{ color: fTextColor }} className="leading-relaxed">{settings.address}</p>
                <p className="text-white text-lg">{settings.phone}</p>
                <p style={{ color: fTextColor }} className="text-xs">{settings.email}</p>
              </div>
            </div>

            <div className="space-y-6 text-center sm:text-left">
              <h4 style={{ color: fHeaderColor }} className="text-xs font-black uppercase tracking-widest text-brand">Çalışma Saatleri</h4>
              <div className="space-y-2 text-xs font-bold">
                <div style={{ color: fTextColor }} className="flex justify-between border-b border-white/5 pb-2"><span>Hafta içi</span><span className="text-white">{settings.workingHoursWeekday}</span></div>
                <div style={{ color: fTextColor }} className="flex justify-between border-b border-white/5 pb-2"><span>Cumartesi</span><span className="text-white">{settings.workingHoursSaturday}</span></div>
                <div style={{ color: fTextColor }} className="flex justify-between"><span>Pazar</span><span className="text-rose-500 uppercase">{settings.workingHoursSunday}</span></div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 text-center">
            <p style={{ color: fTextColor }} className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-50">
              &copy; {settings.copyrightText || `${new Date().getFullYear()} ${settings.clinicName} | TÜM HAKLARI SAKLIDIR`}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
