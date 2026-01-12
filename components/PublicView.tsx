
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/apiService';
import { Post, Service, Doctor, GalleryItem, Settings, SliderItem } from '../types';

interface PublicViewProps {
  onNavigate: (view: any, id?: string) => void;
}

export const PublicView: React.FC<PublicViewProps> = ({ onNavigate }) => {
  const [data, setData] = useState<{
    services: Service[],
    doctors: Doctor[],
    posts: Post[],
    settings: Settings | null,
    sliders: SliderItem[],
    gallery: GalleryItem[]
  }>({
    services: [],
    doctors: [],
    posts: [],
    settings: null,
    sliders: [],
    gallery: []
  });

  const [currentSlide, setCurrentSlide] = useState(0);
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [formData, setFormData] = useState({ fullName: '', email: '', message: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [services, doctors, posts, settings, sliders, gallery] = await Promise.all([
        api.getServices(),
        api.getDoctors(),
        api.getPosts(),
        api.getSettings(),
        api.getSliders(),
        api.getGallery()
      ]);
      setData({
        services: services.filter(s => s.isVisible !== false),
        doctors: doctors.filter(d => d.isVisible !== false),
        posts: posts.filter(p => p.status === 'published' && p.isVisible !== false),
        settings,
        sliders: sliders.filter(s => s.isVisible !== false),
        gallery: gallery.filter(g => g.isVisible !== false)
      });
    } catch (err) {
      console.error("Ana sayfa verileri yüklenemedi", err);
    }
  };

  const nextSlide = useCallback(() => {
    if (data.sliders.length > 0) {
      setCurrentSlide((s) => (s + 1) % data.sliders.length);
    }
  }, [data.sliders.length]);

  const prevSlide = useCallback(() => {
    if (data.sliders.length > 0) {
      setCurrentSlide((s) => (s - 1 + data.sliders.length) % data.sliders.length);
    }
  }, [data.sliders.length]);

  useEffect(() => {
    if (data.sliders.length > 1) {
      const timer = setInterval(nextSlide, 6000);
      return () => clearInterval(timer);
    }
  }, [data.sliders.length, nextSlide]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('sending');
    try {
      await api.addMessage(formData);
      setFormStatus('success');
      setFormData({ fullName: '', email: '', message: '' });
      setTimeout(() => setFormStatus('idle'), 5000);
    } catch (err) {
      alert("Mesaj gönderilemedi, lütfen tekrar deneyin.");
      setFormStatus('idle');
    }
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openDirections = () => {
    if (data.settings) {
      const url = data.settings.mapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(data.settings.address)}`;
      window.open(url, '_blank');
    }
  };

  if (!data.settings) return null;

  return (
    <div className="space-y-20 md:space-y-32 pb-20 md:pb-32">
      {/* Hero Slider */}
      <section className="relative h-[500px] md:h-[700px] lg:h-[850px] overflow-hidden group">
        {data.sliders.length > 0 ? (
          <>
            {data.sliders.map((slide, index) => (
              <div key={slide.id} className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${index === currentSlide ? 'opacity-100 scale-100 z-20' : 'opacity-0 scale-110 z-10'}`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 z-10"></div>
                <img src={slide.image} className="w-full h-full object-cover" alt={slide.title} />
                <div className="absolute inset-0 flex items-center z-20">
                  <div className="container mx-auto px-6 md:px-12 lg:px-24">
                    <div className={`max-w-3xl space-y-6 md:space-y-8 transition-all duration-1000 delay-300 ${index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                      <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-white leading-[1] tracking-tighter">{slide.title}</h1>
                      <p className="text-lg md:text-xl text-gray-200 font-medium max-w-xl leading-relaxed">{slide.desc}</p>
                      <div className="flex flex-wrap gap-4 md:gap-6 pt-4">
                        <button onClick={() => onNavigate('all_services')} className="w-full sm:w-auto bg-brand text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black hover:bg-rose-700 transition-all shadow-xl">Hizmetlerimiz</button>
                        <a href="#contact" onClick={handleContactClick} className="w-full sm:w-auto bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black hover:bg-white/20 transition-all text-center flex items-center justify-center">İletişim</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {data.sliders.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-2 md:px-6 z-30 pointer-events-none">
                <button onClick={prevSlide} className="pointer-events-auto w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white/10 hover:bg-brand backdrop-blur-md border border-white/10 text-white flex items-center justify-center text-xl transition-all shadow-2xl">←</button>
                <button onClick={nextSlide} className="pointer-events-auto w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white/10 hover:bg-brand backdrop-blur-md border border-white/10 text-white flex items-center justify-center text-xl transition-all shadow-2xl">→</button>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 bg-slate-100 flex items-center justify-center font-black text-gray-300 uppercase tracking-widest">Yükleniyor...</div>
        )}
      </section>

      {/* Services - Limited to 6 */}
      <section id="services" className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-4">
            <span className="text-brand font-black text-xs uppercase tracking-widest bg-rose-50 px-4 py-2 rounded-full inline-block">Tedavi Seçenekleri</span>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter">Hizmetlerimiz</h2>
          </div>
          <button onClick={() => onNavigate('all_services')} className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand transition-all">Tüm Tedavileri Gör →</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {data.services.slice(0, 6).map(service => (
            <div key={service.id} className="group bg-white rounded-[3rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer" onClick={() => onNavigate('service_detail', service.id.toString())}>
              <div className="h-56 md:h-72 overflow-hidden relative">
                <img src={service.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={service.name} />
                <div className="absolute bottom-6 right-6 w-14 h-14 bg-white text-brand rounded-2xl flex items-center justify-center text-2xl shadow-xl transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all border border-rose-50 font-bold">🦷</div>
              </div>
              <div className="p-8 md:p-10 space-y-4">
                <h3 className="text-2xl font-black text-gray-900 group-hover:text-brand transition-colors">{service.name}</h3>
                <p className="text-gray-500 font-medium leading-relaxed line-clamp-2">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery - Limited to 4 */}
      <section id="gallery" className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-4">
            <span className="text-brand font-black text-xs uppercase tracking-widest bg-rose-50 px-4 py-2 rounded-full inline-block">Klinikten Kareler</span>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter">Galeri</h2>
          </div>
          <button onClick={() => onNavigate('all_gallery')} className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand transition-all">Tümünü Gör →</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.gallery.slice(0, 4).map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-[2.5rem] shadow-lg cursor-pointer h-80" onClick={() => onNavigate('all_gallery')}>
               <img src={item.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={item.caption || 'Galeri'} />
               <div className="absolute inset-0 bg-brand/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 bg-white text-brand rounded-2xl flex items-center justify-center text-2xl shadow-2xl font-bold">🔍</div>
               </div>
            </div>
          ))}
        </div>
      </section>

      {/* Doctors - Limited to 4 and Centered */}
      <section id="doctors" className="bg-slate-50 py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 text-center md:text-left">
            <div className="space-y-4 w-full md:w-auto">
              <span className="text-brand font-black text-xs uppercase tracking-widest bg-rose-50 px-4 py-2 rounded-full inline-block">Uzman Kadromuz</span>
              <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter">Hekimler</h2>
            </div>
            <button onClick={() => onNavigate('all_doctors')} className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand transition-all mx-auto md:mx-0">Tüm Hekimleri Gör →</button>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {data.doctors.slice(0, 4).map(doctor => (
              <div key={doctor.id} className="group bg-white rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer text-center w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)] max-w-sm" onClick={() => onNavigate('doctor_detail', doctor.id.toString())}>
                <div className="h-80 md:h-[400px] overflow-hidden bg-gray-100">
                  <img src={doctor.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={doctor.name} />
                </div>
                <div className="p-8 relative">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-white text-gray-900 rounded-2xl flex items-center justify-center shadow-xl border border-gray-100 font-bold text-xl">👨‍⚕️</div>
                  <h3 className="text-2xl font-black text-gray-900 mt-4">{doctor.name}</h3>
                  <p className="text-brand font-black text-[10px] uppercase tracking-widest mt-2">{doctor.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section - Limited to 4 */}
      <section id="blog" className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-4">
            <span className="text-brand font-black text-xs uppercase tracking-widest bg-rose-50 px-4 py-2 rounded-full inline-block">Bilgilendirme</span>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter">Blog Yazıları</h2>
          </div>
          <button onClick={() => onNavigate('all_blog')} className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand transition-all">Tüm Blog Yazılarını Gör →</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {data.posts.slice(0, 4).map(post => (
            <div key={post.id} className="group bg-white rounded-[3rem] overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-500 cursor-pointer" onClick={() => onNavigate('blog_detail', post.id.toString())}>
              <div className="h-64 overflow-hidden relative">
                <img src={post.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={post.title} />
                <div className="absolute top-6 left-6 w-12 h-12 bg-white text-brand rounded-xl flex items-center justify-center text-xl shadow-lg font-bold">📰</div>
              </div>
              <div className="p-8 space-y-4">
                <div className="text-[10px] font-black text-brand uppercase tracking-widest">{post.date}</div>
                <h3 className="text-2xl font-black text-gray-900 group-hover:text-brand transition-colors leading-tight line-clamp-2">{post.title}</h3>
                <p className="text-gray-500 font-medium line-clamp-2">{post.content.substring(0, 100)}...</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="container mx-auto px-6">
        <div className="bg-white rounded-[4rem] border-2 border-gray-100 overflow-hidden grid lg:grid-cols-2 shadow-2xl shadow-rose-100">
          <div className="bg-brand p-12 md:p-24 text-white space-y-12">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight">Gülüşünüzü <br/> Beraber <br/> Tasarlayalım</h2>
            <div className="space-y-8">
              <a href={`tel:${data.settings.phone.replace(/\D/g,'')}`} className="flex items-center space-x-6 group">
                <div className="w-16 h-16 bg-white text-brand rounded-2xl flex items-center justify-center text-3xl shadow-xl border border-white/20 group-hover:scale-110 transition-transform font-bold">📞</div>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-widest text-rose-100">Bizi Arayın</span>
                  <span className="text-2xl md:text-3xl font-black">{data.settings.phone}</span>
                </div>
              </a>
              {data.settings.email && (
                <a href={`mailto:${data.settings.email}`} className="flex items-center space-x-6 group">
                  <div className="w-16 h-16 bg-white text-brand rounded-2xl flex items-center justify-center text-3xl shadow-xl border border-white/20 group-hover:scale-110 transition-transform font-bold">✉️</div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-widest text-rose-100">E-Posta Adresimiz</span>
                    <span className="text-lg md:text-xl font-black">{data.settings.email}</span>
                  </div>
                </a>
              )}
              <div className="flex items-start space-x-6 group">
                <div className="w-16 h-16 bg-white text-brand rounded-2xl flex items-center justify-center text-3xl shadow-xl border border-white/20 font-bold shrink-0">📍</div>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-widest text-rose-100">Klinik Adresi</span>
                  <span className="text-lg font-bold leading-relaxed">{data.settings.address}</span>
                </div>
              </div>
              <div className="pt-4 flex flex-wrap gap-4">
                <button onClick={openDirections} className="bg-white text-brand px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all flex items-center space-x-3">
                  <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center text-xl font-bold">🗺️</div> 
                  <span>{data.settings.mapsButtonText || 'Yol Tarifi Al'}</span>
                </button>
              </div>
              
              <div className="mt-8 pt-8 border-t border-white/10 space-y-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-rose-200">Çalışma Saatlerimizde</h4>
                <div className="grid grid-cols-1 gap-3 text-sm font-bold">
                   <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                      <span className="text-rose-100">Hafta içi</span> 
                      <span className="bg-white/10 px-3 py-1 rounded-lg">{data.settings.workingHoursWeekday}</span>
                   </div>
                   <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                      <span className="text-rose-100">Cumartesi</span> 
                      <span className="bg-white/10 px-3 py-1 rounded-lg">{data.settings.workingHoursSaturday}</span>
                   </div>
                   <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                      <span className="text-rose-100">Pazar</span> 
                      <span className="bg-white/10 px-3 py-1 rounded-lg text-rose-200 uppercase tracking-widest text-[10px]">{data.settings.workingHoursSunday}</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-12 md:p-20 bg-white">
            {formStatus === 'success' ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                 <div className="w-24 h-24 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center text-5xl animate-bounce font-bold">✓</div>
                 <h3 className="text-3xl font-black text-gray-900">Mesajınız İletildi!</h3>
                 <p className="text-gray-500 font-medium">En kısa sürede size dönüş yapacağız.</p>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleFormSubmit}>
                <div className="space-y-2">
                  <h4 className="text-gray-900 text-3xl font-black tracking-tight flex items-center gap-3">
                    <span className="w-10 h-10 bg-rose-50 text-brand rounded-xl flex items-center justify-center text-xl font-bold">✉️</span>
                    Bize Yazın
                  </h4>
                  <p className="text-gray-400 font-medium ml-13">Tüm sorularınız ve bilgi talepleriniz için bu formu kullanabilirsiniz.</p>
                </div>
                <div className="grid gap-4">
                  <input type="text" placeholder="Adınız Soyadınız" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-gray-50 p-5 rounded-2xl text-gray-900 font-bold outline-none border-2 border-transparent focus:border-brand transition-all" />
                  <input type="email" placeholder="E-Posta Adresiniz" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 p-5 rounded-2xl text-gray-900 font-bold outline-none border-2 border-transparent focus:border-brand transition-all" />
                  <textarea placeholder="Mesajınız..." rows={4} required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full bg-gray-50 p-5 rounded-2xl text-gray-900 font-bold outline-none border-2 border-transparent focus:border-brand transition-all resize-none"></textarea>
                </div>
                <button disabled={formStatus === 'sending'} className="w-full bg-gray-900 text-white py-6 rounded-2xl font-black shadow-xl hover:bg-brand transition-all disabled:opacity-50 flex items-center justify-center space-x-3 group">
                  <span>{formStatus === 'sending' ? 'Gönderiliyor...' : 'Mesajı Gönder'}</span>
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white group-hover:text-brand transition-all font-bold">🚀</div>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
