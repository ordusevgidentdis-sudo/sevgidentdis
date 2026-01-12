
import { Service, Doctor, Post, Settings, SliderItem, GalleryItem, AdminUser, ContactMessage } from '../types';

// STORAGE_KEY bir veritabanı şeması (v1) gibi davranır.
const STORAGE_KEY = "sevgident_db_production_v1";

// İlk kurulum için gerekli yönetici hesabı (Yalnızca API erişilemezse kullanılır)
const INITIAL_ADMINS: AdminUser[] = [
  { id: '1', username: 'admin', password: '123', fullName: 'Yönetici' }
];

// Temel ayarlar
const INITIAL_SETTINGS: Settings = {
  clinicName: 'Yeni Poliklinik',
  address: 'Lütfen adres giriniz',
  phone: '0000 000 00 00',
  email: 'iletisim@siteadi.com',
  logoText: 'KLİNİK ADI',
  logoSubText: 'DİŞ POLİKLİNİĞİ',
  logoEmoji: '🦷',
  footerLogoUrl: '',
  logoColor: '#e11d48',
  logoSize: '64',
  faviconUrl: '',
  mapsIframe: '',
  footerSlogan: 'Klinik sloganınızı admin panelinden düzenleyebilirsiniz.',
  workingHoursWeekday: '09:00-18:00',
  workingHoursSaturday: '09:00-14:00',
  workingHoursSunday: 'Kapalı',
  adminPath: 'admin'
};

class DB {
  private data: any = {};

  constructor() {
    this.load();
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  private load() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.data = JSON.parse(stored);
      } catch (e) {
        this.resetToDefaults();
      }
    } else {
      this.resetToDefaults();
    }
  }

  resetToDefaults() {
    this.data = {
      admins: [...INITIAL_ADMINS],
      services: [],
      doctors: [],
      posts: [],
      sliders: [],
      gallery: [],
      messages: [],
      settings: { ...INITIAL_SETTINGS }
    };
    this.save();
  }

  // --- SQL-LIKE OPERASYONLAR ---
  
  getSettings() { return this.data.settings; }
  updateSettings(s: Partial<Settings>) { this.data.settings = { ...this.data.settings, ...s }; this.save(); }

  getServices() { return this.data.services; }
  addService(s: any) { this.data.services.push({ ...s, id: Date.now().toString(), isVisible: true }); this.save(); }
  updateService(id: string, s: any) { this.data.services = this.data.services.map((x: any) => x.id === id ? { ...x, ...s } : x); this.save(); }
  deleteService(id: string) { this.data.services = this.data.services.filter((x: any) => x.id !== id); this.save(); }
  reorderService(id: string, direction: 'up' | 'down') { this.reorder('services', id, direction); }

  getDoctors() { return this.data.doctors; }
  addDoctor(d: any) { this.data.doctors.push({ ...d, id: Date.now().toString(), isVisible: true }); this.save(); }
  updateDoctor(id: string, d: any) { this.data.doctors = this.data.doctors.map((x: any) => x.id === id ? { ...x, ...d } : x); this.save(); }
  deleteDoctor(id: string) { this.data.doctors = this.data.doctors.filter((x: any) => x.id !== id); this.save(); }
  reorderDoctor(id: string, direction: 'up' | 'down') { this.reorder('doctors', id, direction); }

  getPosts() { return this.data.posts; }
  addPost(p: any) { this.data.posts.push({ ...p, id: Date.now().toString(), date: new Date().toLocaleDateString('tr-TR'), isVisible: true }); this.save(); }
  updatePost(id: string, p: any) { this.data.posts = this.data.posts.map((x: any) => x.id === id ? { ...x, ...p } : x); this.save(); }
  deletePost(id: string) { this.data.posts = this.data.posts.filter((x: any) => x.id !== id); this.save(); }
  reorderPost(id: string, direction: 'up' | 'down') { this.reorder('posts', id, direction); }

  getGallery() { return this.data.gallery; }
  addGalleryItem(g: any) { 
    const existingIndex = this.data.gallery.findIndex((x:any) => x.id === g.id);
    if (existingIndex > -1) {
      this.data.gallery[existingIndex] = { ...this.data.gallery[existingIndex], ...g };
    } else {
      this.data.gallery.push({ ...g, id: Date.now().toString(), isVisible: true }); 
    }
    this.save(); 
  }
  deleteGalleryItem(id: string) { this.data.gallery = this.data.gallery.filter((x: any) => x.id !== id); this.save(); }
  reorderGallery(id: string, direction: 'up' | 'down') { this.reorder('gallery', id, direction); }

  getSliders() { return this.data.sliders; }
  addSlider(s: any) { this.data.sliders.push({ ...s, id: Date.now().toString(), isVisible: true }); this.save(); }
  updateSlider(id: string, s: any) { this.data.sliders = this.data.sliders.map((x: any) => x.id === id ? { ...x, ...s } : x); this.save(); }
  deleteSlider(id: string) { this.data.sliders = this.data.sliders.filter((x: any) => x.id !== id); this.save(); }
  reorderSlider(id: string, direction: 'up' | 'down') { this.reorder('sliders', id, direction); }

  getMessages() { return [...this.data.messages].reverse(); }
  addMessage(m: any) { 
    this.data.messages.push({ ...m, id: Date.now().toString(), date: new Date().toLocaleString('tr-TR'), isRead: false }); 
    this.save();
  }
  markMessageRead(id: string) { this.data.messages = this.data.messages.map((m: any) => m.id === id ? { ...m, isRead: true } : m); this.save(); }
  deleteMessage(id: string) { this.data.messages = this.data.messages.filter((m: any) => m.id !== id); this.save(); }

  getAdmins() { return this.data.admins; }
  addAdmin(a: any) { this.data.admins.push({ ...a, id: Date.now().toString() }); this.save(); }
  updateAdmin(id: string, a: any) { this.data.admins = this.data.admins.map((x: any) => x.id === id ? { ...x, ...a } : x); this.save(); }
  deleteAdmin(id: string) { if(this.data.admins.length > 1) { this.data.admins = this.data.admins.filter((x: any) => x.id !== id); this.save(); } }
  validateLogin(u: string, p: string) { return this.data.admins.find((x: any) => x.username === u && x.password === p); }

  private reorder(collection: string, id: string, direction: 'up' | 'down') {
    const list = this.data[collection];
    const index = list.findIndex((x: any) => x.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    [list[index], list[targetIndex]] = [list[targetIndex], list[index]];
    this.save();
  }
}

export const db = new DB();
