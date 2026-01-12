
import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import { ContactMessage, Settings, Service, Doctor, Post, SliderItem, GalleryItem, AdminUser } from '../types';

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'services' | 'doctors' | 'posts' | 'sliders' | 'gallery' | 'settings' | 'logo' | 'admins' | 'messages' | 'footer'>('services');
  const [editItem, setEditItem] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  const [data, setData] = useState<{
    services: Service[],
    doctors: Doctor[],
    posts: Post[],
    sliders: SliderItem[],
    gallery: GalleryItem[],
    settings: Settings | null,
    admins: AdminUser[],
    messages: ContactMessage[]
  }>({
    services: [],
    doctors: [],
    posts: [],
    sliders: [],
    gallery: [],
    settings: null,
    admins: [],
    messages: []
  });

  const [tempSettings, setTempSettings] = useState<Settings | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  // POLLING: Mesajlar sekmesi aktifken her 30 saniyede bir yeni mesajları otomatik kontrol eden polling mekanizması
  useEffect(() => {
    let interval: any;
    if (activeTab === 'messages' && !editItem) {
      interval = setInterval(async () => {
        try {
          const messages = await api.getMessages();
          setData(prev => ({ ...prev, messages }));
        } catch (err) {
          console.debug("Anlık mesaj tazeleme başarısız.");
        }
      }, 30000); 
    }
    return () => clearInterval(interval);
  }, [activeTab, editItem]);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [services, doctors, posts, sliders, gallery, settings, admins, messages] = await Promise.all([
        api.getServices(),
        api.getDoctors(),
        api.getPosts(),
        api.getSliders(),
        api.getGallery(),
        api.getSettings(),
        api.getAdmins(),
        api.getMessages()
      ]);
      setData({ services, doctors, posts, sliders, gallery, settings, admins, messages });
      setTempSettings(settings);
      setEditItem(null);
    } catch (err) {
      console.error("Veri yükleme hatası:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVisibility = async (id: string, currentVisibility: boolean) => {
    const newVisibility = currentVisibility === false ? true : false;
    try {
      if (activeTab === 'services') await api.updateService(id, { isVisible: newVisibility });
      else if (activeTab === 'doctors') await api.updateDoctor(id, { isVisible: newVisibility });
      else if (activeTab === 'posts') await api.updatePost(id, { isVisible: newVisibility });
      else if (activeTab === 'sliders') await api.updateSlider(id, { isVisible: newVisibility });
      else if (activeTab === 'gallery') {
        const item = data.gallery.find(x => x.id === id);
        if (item) await api.addGalleryItem({ ...item, isVisible: newVisibility } as any);
      }
      refreshData();
    } catch (err) {
      console.error("Görünürlük değiştirilemedi", err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadedPath = await api.uploadFile(file);
      
      if (activeTab === 'logo' || activeTab === 'settings') {
        const newSettings = { ...tempSettings, [field]: uploadedPath } as Settings;
        setTempSettings(newSettings);
        await api.updateSettings(newSettings);
        refreshData();
      } else {
        setEditItem((prev: any) => ({ ...prev, [field]: uploadedPath }));
      }
    } catch (err) {
      alert("Yükleme başarısız!");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteItem = async (type: string, id: string) => {
    if (window.confirm('Emin misiniz?')) {
      try {
        if (type === 'services') await api.deleteService(id);
        if (type === 'doctors') await api.deleteDoctor(id);
        if (type === 'posts') await api.deletePost(id);
        if (type === 'sliders') await api.deleteSlider(id);
        if (type === 'gallery') await api.deleteGalleryItem(id);
        if (type === 'messages') await api.deleteMessage(id);
        if (type === 'admins') await api.deleteAdmin(id);
        refreshData();
      } catch (err: any) { alert(err.message); }
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    try {
        await api.reorder(activeTab, id, direction);
        refreshData();
    } catch (err) {
        console.error("Sıralama hatası:", err);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setIsSaving(true);

    try {
      if (activeTab === 'admins') {
        editItem.id ? await api.updateAdmin(editItem.id, editItem) : await api.addAdmin(editItem);
      } else {
        const field = activeTab === 'gallery' ? 'imageUrl' : 'image';
        if (!editItem[field]) editItem[field] = 'https://via.placeholder.com/800x600?text=Resim+Yok';

        if (activeTab === 'services') {
            editItem.id ? await api.updateService(editItem.id, editItem) : await api.addService(editItem);
        } else if (activeTab === 'doctors') {
            editItem.id ? await api.updateDoctor(editItem.id, editItem) : await api.addDoctor(editItem);
        } else if (activeTab === 'posts') {
            const postData = { ...editItem, status: 'published', slug: editItem.title?.toLowerCase().replace(/ /g, '-') };
            editItem.id ? await api.updatePost(editItem.id, postData) : await api.addPost(postData);
        } else if (activeTab === 'sliders') {
            editItem.id ? await api.updateSlider(editItem.id, editItem) : await api.addSlider(editItem);
        } else if (activeTab === 'gallery') {
            await api.addGalleryItem({ imageUrl: editItem.imageUrl, caption: editItem.caption });
        }
      }
      await refreshData();
    } catch (err: any) { 
      alert(err.message); 
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingsUpdate = async (updatedSettings: Partial<Settings>) => {
    if (!tempSettings) return;
    const newSettings = { ...tempSettings, ...updatedSettings };
    setTempSettings(newSettings);
    await api.updateSettings(newSettings);
  };

  const navItems = [
    { id: 'logo', label: 'Logo & Görünüm', icon: '🎨' },
    { id: 'sliders', label: 'Ana Sayfa Slider', icon: '🖼️' },
    { id: 'services', label: 'Tedaviler', icon: '🦷' },
    { id: 'doctors', label: 'Hekimlerimiz', icon: '👨‍⚕️' },
    { id: 'gallery', label: 'Galeri Yönetimi', icon: '📸' },
    { id: 'posts', label: 'Blog Yazıları', icon: '📰' },
    { id: 'footer', label: 'İletişim & Footer', icon: '📞' },
    { id: 'messages', label: 'Gelen Mesajlar', icon: '📩' },
    { id: 'admins', label: 'Yöneticiler', icon: '👤' },
    { id: 'settings', label: 'Genel Ayarlar', icon: '⚙️' }
  ];

  const unreadMessagesCount = data.messages.filter(m => !m.isRead).length;

  const isImageLogo = (str: string) => {
    if (!str) return false;
    return str.startsWith('http') || str.startsWith('data:image') || str.startsWith('/uploads') || str.startsWith('./uploads');
  };

  if (isLoading || !tempSettings) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-gray-900 uppercase tracking-widest text-xs">Admin Paneli Yükleniyor...</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col lg:flex-row relative">
      <div className="lg:hidden bg-white border-b border-gray-100 p-4 sticky top-0 z-[110] flex items-center justify-between">
         <div className="flex items-center space-x-2">
            <span style={{ color: tempSettings.logoColor }} className="font-black tracking-tighter uppercase">{tempSettings.logoText}</span>
         </div>
         <div className="flex items-center gap-3">
            {unreadMessagesCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-full animate-pulse">
                {unreadMessagesCount} YENİ
              </span>
            )}
            <button 
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="bg-gray-900 text-white p-2 rounded-lg text-sm font-bold"
            >
              {isMobileNavOpen ? 'Kapat' : 'Menü'}
            </button>
         </div>
      </div>

      <aside className={`w-72 bg-white border-r shadow-sm fixed lg:sticky top-0 lg:top-0 h-screen z-[105] transition-transform duration-300 ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <nav className="p-8 space-y-2 h-full overflow-y-auto">
          <div className="mb-10 px-4 hidden lg:block">
             <span style={{ color: tempSettings.logoColor }} className="font-black text-xl tracking-tighter leading-none block uppercase">{tempSettings.logoText}</span>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{tempSettings.logoSubText}</p>
          </div>
          {navItems.map(tab => (
            <button 
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setEditItem(null); setIsMobileNavOpen(false); }} 
              className={`w-full text-left px-6 py-4 rounded-2xl flex items-center space-x-4 transition-all relative ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-xl translate-x-1' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="font-bold text-sm">{tab.label}</span>
              {tab.id === 'messages' && unreadMessagesCount > 0 && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-rose-500 text-white text-[9px] font-black px-2 py-1 rounded-full animate-bounce shadow-lg">
                  {unreadMessagesCount}
                </span>
              )}
            </button>
          ))}
          <div className="pt-10">
            <button onClick={onLogout} className="w-full text-left px-6 py-4 rounded-2xl flex items-center space-x-4 text-red-500 hover:bg-red-50 transition-colors">
              <span>🚪</span> <span className="font-bold text-sm">Güvenli Çıkış</span>
            </button>
          </div>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
            <div className="space-y-1">
               <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter capitalize">
                {activeTab === 'footer' ? 'İletişim & Footer' : activeTab === 'admins' ? 'Yönetici' : activeTab === 'messages' ? 'Mesaj Kutusu' : activeTab} Yönetimi
               </h2>
               <p className="text-gray-400 font-medium">Panel üzerinden polikliniğinizi yönetin.</p>
            </div>
            {!editItem && !['settings', 'logo', 'messages', 'footer', 'logo'].includes(activeTab) && (
              <button onClick={() => setEditItem({})} className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:scale-105 transition-transform flex items-center justify-center space-x-2 w-full md:w-auto">
                <span>+</span> <span>{activeTab === 'admins' ? 'Yeni Yönetici' : 'Yeni Ekle'}</span>
              </button>
            )}
          </div>

          {editItem ? (
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <form onSubmit={handleSaveItem} className="space-y-8">
                  {activeTab === 'admins' ? (
                    <div className="grid md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-2">Tam İsim</label>
                          <input type="text" className="w-full bg-gray-50 p-5 rounded-2xl font-bold outline-none focus:border-gray-900 focus:bg-white border-2 border-transparent transition-all" value={editItem.fullName || ''} onChange={e => setEditItem({...editItem, fullName: e.target.value})} required />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-2">Kullanıcı Adı</label>
                          <input type="text" className="w-full bg-gray-50 p-5 rounded-2xl font-bold outline-none focus:border-gray-900 focus:bg-white border-2 border-transparent transition-all" value={editItem.username || ''} onChange={e => setEditItem({...editItem, username: e.target.value})} required />
                       </div>
                       <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-2">Şifre</label>
                          <input type="password" placeholder={editItem.id ? "Şifreyi değiştirmek istemiyorsanız boş bırakın" : "Şifre belirleyin"} className="w-full bg-gray-50 p-5 rounded-2xl font-bold outline-none focus:border-gray-900 focus:bg-white border-2 border-transparent transition-all" value={editItem.password || ''} onChange={e => setEditItem({...editItem, password: e.target.value})} required={!editItem.id} />
                       </div>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-10">
                       <div className="space-y-4">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-2">Görsel Seçimi</label>
                          <div className="aspect-video bg-gray-50 rounded-[2.5rem] overflow-hidden border-4 border-dashed border-gray-200 relative group flex items-center justify-center">
                             {isUploading && (
                               <div className="absolute inset-0 bg-brand/10 backdrop-blur-sm flex items-center justify-center font-black text-brand animate-pulse z-10">Yükleniyor...</div>
                             )}
                             <img 
                                src={editItem.image || editItem.imageUrl || 'https://via.placeholder.com/800x450?text=Gorsel+Secilmedi'} 
                                className="w-full h-full object-cover" 
                                alt="Onizleme"
                             />
                             <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-black uppercase text-xs z-20">
                                Değiştirmek İçin Tıkla
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, activeTab === 'gallery' ? 'imageUrl' : 'image')} />
                             </label>
                          </div>
                       </div>
                       <div className="space-y-6">
                          <div className="space-y-2">
                             <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-2">Başlık / İsim</label>
                             <input 
                                type="text" 
                                className="w-full bg-gray-50 border-2 border-transparent p-5 rounded-2xl font-bold outline-none focus:border-gray-900 focus:bg-white transition-all" 
                                value={editItem.name || editItem.title || editItem.caption || ''} 
                                onChange={e => setEditItem({...editItem, [activeTab === 'services' || activeTab === 'doctors' ? 'name' : activeTab === 'gallery' ? 'caption' : 'title']: e.target.value})} 
                                required 
                             />
                          </div>
                          {activeTab !== 'gallery' && (
                             <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-2">Açıklama / İçerik</label>
                                <textarea 
                                   className="w-full bg-gray-50 border-2 border-transparent p-5 rounded-2xl font-bold outline-none focus:border-gray-900 focus:bg-white transition-all min-h-[150px] resize-none" 
                                   value={editItem.description || editItem.content || editItem.desc || ''} 
                                   onChange={e => setEditItem({...editItem, [activeTab === 'services' || activeTab === 'doctors' ? 'description' : activeTab === 'sliders' ? 'desc' : 'content']: e.target.value})}
                                />
                          </div>
                        )}
                        {activeTab === 'doctors' && (
                          <div className="space-y-2">
                             <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-2">Unvan</label>
                             <input type="text" className="w-full bg-gray-50 p-5 rounded-2xl font-bold outline-none focus:border-gray-900 focus:bg-white border-2 border-transparent transition-all" value={editItem.title || ''} onChange={e => setEditItem({...editItem, title: e.target.value})} />
                          </div>
                        )}
                       </div>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
                     <button type="submit" disabled={isSaving} className="flex-2 bg-gray-900 text-white py-5 px-10 rounded-2xl font-black shadow-xl hover:opacity-90 transition-all disabled:opacity-50">
                        {isSaving ? 'Kaydediliyor...' : 'Kaydet ve Yayınla'}
                     </button>
                     <button type="button" onClick={() => setEditItem(null)} className="flex-1 bg-gray-100 text-gray-600 py-5 rounded-2xl font-black hover:bg-gray-200 transition-all">İptal</button>
                  </div>
               </form>
            </div>
          ) : activeTab === 'logo' ? (
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 shadow-sm border space-y-12 animate-in fade-in duration-500">
               {/* Header Logo Ayarları */}
               <div className="flex flex-col md:flex-row items-start space-y-8 md:space-y-0 md:space-x-12 mb-10 pb-10 border-b border-gray-100">
                  <div className="relative group max-w-full shrink-0">
                     <div 
                      style={{ height: `${tempSettings.logoSize}px`, width: 'auto', minWidth: '80px' }}
                      className="flex items-center justify-center overflow-hidden font-bold transition-all bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-4"
                     >
                        {isImageLogo(tempSettings.logoEmoji) ? (
                           <img src={tempSettings.logoEmoji} className="h-full w-auto object-contain" alt="Header Logo" />
                        ) : (
                           <span style={{ fontSize: `${parseInt(tempSettings.logoSize) * 0.8}px` }}>{tempSettings.logoEmoji}</span>
                        )}
                     </div>
                     <label className="absolute -bottom-3 -right-3 bg-white text-gray-900 w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center cursor-pointer hover:scale-110 transition-transform border-4 border-gray-50 z-10">
                        <span className="text-lg">📸</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logoEmoji')} />
                     </label>
                  </div>
                  
                  <div className="flex-1 w-full space-y-10">
                    <div className="grid md:grid-cols-2 gap-8">
                       {/* Ana Metin Grubu */}
                       <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Header Ana Metin (Logo)</label>
                          <input 
                            type="text" 
                            value={tempSettings.logoText} 
                            onChange={e => setTempSettings({...tempSettings, logoText: e.target.value.toUpperCase()})} 
                            onBlur={(e) => handleSettingsUpdate({ logoText: e.target.value.toUpperCase() })}
                            className="w-full bg-white border-2 border-gray-100 p-4 rounded-xl font-black text-lg outline-none focus:border-gray-900 transition-all uppercase" 
                          />
                          <div className="flex items-center space-x-3 pt-2">
                             <input 
                               type="color" 
                               value={tempSettings.logoColor} 
                               onChange={e => handleSettingsUpdate({ logoColor: e.target.value })}
                               className="w-10 h-10 rounded-lg border-none cursor-pointer overflow-hidden shadow-sm"
                             />
                             <span className="text-xs font-bold text-gray-500">Metin Rengi</span>
                          </div>
                       </div>

                       {/* Alt Metin Grubu */}
                       <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Header Alt Metin (Slogan)</label>
                          <input 
                            type="text" 
                            value={tempSettings.logoSubText} 
                            onChange={e => setTempSettings({...tempSettings, logoSubText: e.target.value})} 
                            onBlur={(e) => handleSettingsUpdate({ logoSubText: e.target.value })}
                            className="w-full bg-white border-2 border-gray-100 p-4 rounded-xl font-bold text-sm outline-none focus:border-gray-900 transition-all" 
                          />
                          <div className="flex items-center space-x-3 pt-2">
                             <input 
                               type="color" 
                               value={tempSettings.logoSubColor || '#e11d48'} 
                               onChange={e => handleSettingsUpdate({ logoSubColor: e.target.value })}
                               className="w-10 h-10 rounded-lg border-none cursor-pointer overflow-hidden shadow-sm"
                             />
                             <span className="text-xs font-bold text-gray-500">Alt Metin Rengi</span>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                           <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Logo / İkon Boyutu</label>
                           <span className="text-xs font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">{tempSettings.logoSize}px</span>
                        </div>
                        <input 
                           type="range" 
                           min="32" 
                           max="400" 
                           value={tempSettings.logoSize} 
                           onChange={e => handleSettingsUpdate({ logoSize: e.target.value })}
                           className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                        />
                    </div>
                  </div>
               </div>

               {/* Footer Logo Ayarları */}
               <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-700">
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-3 uppercase tracking-tighter">
                     <span className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-lg">🦶</span>
                     Footer Logo Yönetimi
                  </h3>
                  <div className="grid md:grid-cols-2 gap-10 items-center">
                     <div className="relative group w-full aspect-video bg-gray-900 rounded-[2.5rem] border-4 border-dashed border-gray-700 flex items-center justify-center overflow-hidden transition-all hover:border-brand/50">
                        {tempSettings.footerLogoUrl ? (
                           <img src={tempSettings.footerLogoUrl} className="h-full w-auto object-contain p-8" alt="Footer Logo Önizleme" />
                        ) : (
                           <div className="flex flex-col items-center text-gray-600 space-y-3">
                              <span className="text-5xl">🖼️</span>
                              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Özel Footer Logosu Yükle</p>
                           </div>
                        )}
                        <label className="absolute inset-0 bg-brand/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white font-black uppercase text-xs">
                           <span className="bg-gray-900 px-6 py-3 rounded-xl shadow-2xl">{tempSettings.footerLogoUrl ? 'Logoyu Değiştir' : 'Görsel Seç'}</span>
                           <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'footerLogoUrl')} />
                        </label>
                        {tempSettings.footerLogoUrl && (
                           <button 
                              onClick={() => handleSettingsUpdate({ footerLogoUrl: '' })} 
                              className="absolute top-6 right-6 bg-red-500 text-white w-10 h-10 rounded-xl hover:scale-110 transition-transform font-bold shadow-2xl flex items-center justify-center"
                              title="Özel Logoyu Kaldır"
                           >
                              ✕
                           </button>
                        )}
                     </div>
                     <div className="space-y-6">
                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-200 space-y-4">
                           <p className="text-gray-500 font-bold text-sm leading-relaxed">
                              Sitenizin en alt kısmında (footer) farklı bir logo kullanmak isteyebilirsiniz. 
                           </p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          ) : activeTab === 'footer' ? (
            <div className="space-y-10">
               {/* Footer Renk Ayarları */}
               <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-sm border space-y-8 animate-in fade-in duration-500">
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-3 uppercase tracking-tighter">
                     <span className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center text-lg">🎨</span>
                     Footer Renk Paleti
                  </h3>
                  <div className="grid md:grid-cols-3 gap-8">
                     <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Footer Başlık Rengi</label>
                        <div className="flex items-center space-x-3">
                           <input type="color" value={tempSettings.footerHeaderColor || '#e11d48'} onChange={e => handleSettingsUpdate({ footerHeaderColor: e.target.value })} className="w-12 h-12 rounded-xl cursor-pointer border-none shadow-sm" />
                           <span className="text-xs font-bold text-gray-600">{tempSettings.footerHeaderColor || '#e11d48'}</span>
                        </div>
                     </div>
                     <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Footer Metin Rengi</label>
                        <div className="flex items-center space-x-3">
                           <input type="color" value={tempSettings.footerTextColor || '#9ca3af'} onChange={e => handleSettingsUpdate({ footerTextColor: e.target.value })} className="w-12 h-12 rounded-xl cursor-pointer border-none shadow-sm" />
                           <span className="text-xs font-bold text-gray-600">{tempSettings.footerTextColor || '#9ca3af'}</span>
                        </div>
                     </div>
                     <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Footer Slogan Rengi</label>
                        <div className="flex items-center space-x-3">
                           <input type="color" value={tempSettings.footerSloganColor || '#9ca3af'} onChange={e => handleSettingsUpdate({ footerSloganColor: e.target.value })} className="w-12 h-12 rounded-xl cursor-pointer border-none shadow-sm" />
                           <span className="text-xs font-bold text-gray-600">{tempSettings.footerSloganColor || '#9ca3af'}</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-sm border space-y-8">
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                     <span className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg">📞</span>
                     İletişim Bilgileri
                  </h3>
                  <div className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-2">Telefon Numarası</label>
                        <input type="text" value={tempSettings.phone} onChange={e => setTempSettings({...tempSettings, phone: e.target.value})} onBlur={(e) => handleSettingsUpdate({ phone: e.target.value })} className="w-full bg-gray-50 p-5 rounded-2xl font-bold focus:bg-white border-2 border-transparent focus:border-gray-900 transition-all outline-none" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-2">E-Posta Adresi</label>
                        <input type="email" value={tempSettings.email} onChange={e => setTempSettings({...tempSettings, email: e.target.value})} onBlur={(e) => handleSettingsUpdate({ email: e.target.value })} className="w-full bg-gray-50 p-5 rounded-2xl font-bold focus:bg-white border-2 border-transparent focus:border-gray-900 transition-all outline-none" />
                     </div>
                     <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-2">Tam Adres</label>
                        <textarea value={tempSettings.address} onChange={e => setTempSettings({...tempSettings, address: e.target.value})} onBlur={(e) => handleSettingsUpdate({ address: e.target.value })} className="w-full bg-gray-50 p-5 rounded-2xl font-bold focus:bg-white border-2 border-transparent focus:border-gray-900 transition-all outline-none min-h-[80px] resize-none" />
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-sm border space-y-8">
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                     <span className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg">🗺️</span>
                     Harita & Navigasyon Ayarları
                  </h3>
                  <div className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-2">Buton Başlığı</label>
                        <input 
                           type="text" 
                           placeholder="Yol Tarifi Al"
                           value={tempSettings.mapsButtonText || ''} 
                           onChange={e => setTempSettings({...tempSettings, mapsButtonText: e.target.value})} 
                           onBlur={(e) => handleSettingsUpdate({ mapsButtonText: e.target.value })} 
                           className="w-full bg-gray-50 p-5 rounded-2xl font-bold focus:bg-white border-2 border-transparent focus:border-gray-900 transition-all outline-none" 
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-2">Özel Harita URL'si (Boşsa adresten hesaplanır)</label>
                        <input 
                           type="text" 
                           placeholder="https://maps.google.com/..."
                           value={tempSettings.mapsUrl || ''} 
                           onChange={e => setTempSettings({...tempSettings, mapsUrl: e.target.value})} 
                           onBlur={(e) => handleSettingsUpdate({ mapsUrl: e.target.value })} 
                           className="w-full bg-gray-50 p-5 rounded-2xl font-bold focus:bg-white border-2 border-transparent focus:border-gray-900 transition-all outline-none" 
                        />
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-sm border space-y-8">
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                     <span className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg">🕒</span>
                     Çalışma Saatleri
                  </h3>
                  <div className="grid md:grid-cols-3 gap-8">
                     <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-2">Hafta içi</label>
                        <input type="text" value={tempSettings.workingHoursWeekday} onChange={e => setTempSettings({...tempSettings, workingHoursWeekday: e.target.value})} onBlur={(e) => handleSettingsUpdate({ workingHoursWeekday: e.target.value })} className="w-full bg-gray-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-gray-900 outline-none" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-2">Cumartesi</label>
                        <input type="text" value={tempSettings.workingHoursSaturday} onChange={e => setTempSettings({...tempSettings, workingHoursSaturday: e.target.value})} onBlur={(e) => handleSettingsUpdate({ workingHoursSaturday: e.target.value })} className="w-full bg-gray-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-gray-900 outline-none" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-2">Pazar</label>
                        <input type="text" value={tempSettings.workingHoursSunday} onChange={e => setTempSettings({...tempSettings, workingHoursSunday: e.target.value})} onBlur={(e) => handleSettingsUpdate({ workingHoursSunday: e.target.value })} className="w-full bg-gray-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-gray-900 outline-none" />
                     </div>
                  </div>
               </div>
               <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-sm border space-y-8">
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                     <span className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg">✍️</span>
                     Footer Tanıtım Metni
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-2">Kısa Poliklinik Sloganı</label>
                       <textarea value={tempSettings.footerSlogan} onChange={e => setTempSettings({...tempSettings, footerSlogan: e.target.value})} onBlur={(e) => handleSettingsUpdate({ footerSlogan: e.target.value })} className="w-full bg-gray-50 p-5 rounded-2xl font-bold min-h-[100px] outline-none focus:border-gray-900 focus:bg-white transition-all resize-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-2">Telif Hakkı Metni (Copyright)</label>
                       <input 
                         type="text"
                         placeholder={`${new Date().getFullYear()} ${tempSettings.clinicName} | TÜM HAKLARI SAKLIDIR`}
                         value={tempSettings.copyrightText || ''} 
                         onChange={e => setTempSettings({...tempSettings, copyrightText: e.target.value})} 
                         onBlur={(e) => handleSettingsUpdate({ copyrightText: e.target.value })} 
                         className="w-full bg-gray-50 p-5 rounded-2xl font-bold outline-none focus:border-gray-900 focus:bg-white transition-all" 
                       />
                    </div>
                  </div>
               </div>
            </div>
          ) : activeTab === 'settings' ? (
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 shadow-sm border space-y-10 animate-in fade-in duration-500">
               <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                     <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-2">Poliklinik Tam Adı</label>
                     <input type="text" value={tempSettings.clinicName} onChange={e => setTempSettings({...tempSettings, clinicName: e.target.value})} onBlur={(e) => handleSettingsUpdate({ clinicName: e.target.value })} className="w-full bg-gray-50 p-5 rounded-2xl font-bold focus:bg-white border-2 border-transparent focus:border-gray-900 transition-all outline-none" />
                  </div>
                  <div className="space-y-3">
                     <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-2">Admin Paneli Yolu (/#...)</label>
                     <div className="flex items-center space-x-4">
                        <div className="bg-gray-100 px-4 py-5 rounded-2xl font-bold text-gray-400">/#</div>
                        <input 
                           type="text" 
                           placeholder="admin"
                           value={tempSettings.adminPath} 
                           onChange={e => setTempSettings({...tempSettings, adminPath: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} 
                           onBlur={(e) => handleSettingsUpdate({ adminPath: e.target.value || 'admin' })} 
                           className="flex-1 bg-gray-50 p-5 rounded-2xl font-bold focus:bg-white border-2 border-transparent focus:border-gray-900 transition-all outline-none" 
                        />
                     </div>
                  </div>
               </div>
            </div>
          ) : activeTab === 'admins' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
               {data.admins.map(admin => (
                 <div key={admin.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-xl transition-all group">
                    <div className="flex items-center space-x-4 mb-6">
                       <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-2xl font-bold">👤</div>
                       <div className="overflow-hidden">
                          <h4 className="text-xl font-black text-gray-900 truncate">{admin.fullName}</h4>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">@{admin.username}</p>
                       </div>
                    </div>
                    <div className="flex space-x-3">
                       <button onClick={() => setEditItem(admin)} className="flex-1 bg-gray-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:opacity-90">Düzenle</button>
                       {data.admins.length > 1 && (
                         <button onClick={() => deleteItem('admins', admin.id)} className="w-14 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all font-bold">✕</button>
                       )}
                    </div>
                 </div>
               ))}
            </div>
          ) : activeTab === 'messages' ? (
             <div className="space-y-6">
                {data.messages.length === 0 ? (
                  <div className="p-20 text-center bg-white rounded-[2rem] md:rounded-[3rem] border-4 border-dashed border-gray-100 font-black text-gray-300">HENÜZ MESAJ GELMEDİ</div>
                ) : data.messages.map(m => (
                   <div key={m.id} className={`bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border-l-[12px] transition-all relative overflow-hidden group ${m.isRead ? 'border-gray-100 opacity-60' : 'border-gray-900'}`}>
                      <div className="flex justify-between items-start mb-6">
                         <div className="flex items-center space-x-4">
                            <div className={`w-14 h-14 bg-white text-gray-900 border border-gray-50 rounded-2xl flex items-center justify-center text-xl shadow-inner font-bold ${m.isRead ? 'opacity-50' : ''}`}>👤</div>
                            <div className="overflow-hidden">
                               <h4 className="font-black text-xl text-gray-900 truncate">{m.fullName}</h4>
                               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{m.email} • {m.date}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            {!m.isRead && (
                               <span className="w-2 h-2 bg-brand rounded-full animate-ping mr-2"></span>
                            )}
                            <button onClick={() => deleteItem('messages', m.id)} className="bg-red-50 text-red-500 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all font-bold">✕</button>
                         </div>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-2xl text-gray-700 font-medium leading-relaxed border border-gray-100 text-sm md:text-base">
                         {m.message}
                      </div>
                      {!m.isRead && (
                         <button onClick={async () => { await api.markMessageRead(m.id); refreshData(); }} className="mt-6 w-full bg-gray-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
                           Okundu Olarak İşaretle
                         </button>
                      )}
                   </div>
                ))}
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {(data[activeTab] as any[]).length === 0 ? (
                <div className="col-span-full p-20 text-center bg-white rounded-[4rem] border-4 border-dashed border-gray-100 font-black text-gray-300 uppercase tracking-widest">İÇERİK BULUNMUYOR</div>
              ) : (data[activeTab] as any[]).map((item: any, index: number) => (
                <div key={item.id} className={`bg-white rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-gray-100 shadow-sm flex flex-col group hover:shadow-2xl transition-all relative ${item.isVisible === false ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                  
                  <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                     <button 
                        onClick={(e) => { e.stopPropagation(); toggleVisibility(item.id, item.isVisible !== false); }} 
                        className={`w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center text-xl transition-all font-black border backdrop-blur-md ${item.isVisible !== false ? 'bg-white text-green-500 border-green-100' : 'bg-gray-900 text-white border-gray-800'}`}
                        title={item.isVisible !== false ? 'Yayında (Gizlemek için tıkla)' : 'Yayında Değil (Gösterim için tıkla)'}
                     >
                        {item.isVisible !== false ? '👁️' : '🕶️'}
                     </button>
                  </div>

                  <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {index > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); handleReorder(item.id, 'up'); }} className="w-10 h-10 bg-white/95 backdrop-blur rounded-xl shadow-xl flex items-center justify-center text-gray-900 hover:bg-gray-900 hover:text-white transition-all font-black border">↑</button>
                    )}
                    {index < (data[activeTab] as any[]).length - 1 && (
                        <button onClick={(e) => { e.stopPropagation(); handleReorder(item.id, 'down'); }} className="w-10 h-10 bg-white/95 backdrop-blur rounded-xl shadow-xl flex items-center justify-center text-gray-900 hover:bg-gray-900 hover:text-white transition-all font-black border">↓</button>
                    )}
                  </div>

                  <div className="aspect-video relative overflow-hidden">
                    <img src={item.image || item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name || item.title} />
                    {item.isVisible === false && <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] flex items-center justify-center font-black text-white uppercase text-[10px] tracking-widest">GÖRÜNÜR DEĞİL</div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <div className="p-6 md:p-8 space-y-6 flex-1 flex flex-col">
                    <div className="space-y-2 flex-1">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-lg inline-block">Sıra: {index + 1}</span>
                       <h4 className="font-black text-lg md:text-xl text-gray-900 leading-tight line-clamp-2">{item.name || item.title || item.caption}</h4>
                       {item.title && <p className="text-xs font-bold text-brand uppercase tracking-widest">{item.title}</p>}
                    </div>
                    <div className="flex space-x-3">
                       <button onClick={() => setEditItem(item)} className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 shadow-lg transition-all">Düzenle</button>
                       <button onClick={() => deleteItem(activeTab, item.id)} className="w-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all font-bold">✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
