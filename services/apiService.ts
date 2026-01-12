
import { Service, Doctor, Post, Settings, SliderItem, GalleryItem, AdminUser, ContactMessage } from '../types';
import { db as mockDb } from './mockDatabase';

// Tek sunucu (Same-Origin) mimarisi için base URL boş bırakılır.
const API_BASE_URL = "";

class ApiService {
  public isUsingMock = false;

  private getHeaders() {
    const token = localStorage.getItem('sevgident_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}/api${path.startsWith('/') ? path : '/' + path}`;
    
    try {
      const res = await fetch(url, {
        ...options,
        headers: { ...this.getHeaders(), ...options.headers }
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('sevgident_token');
        if (window.location.hash.includes('admin')) {
          window.location.hash = 'login';
        }
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      this.isUsingMock = false;
      return res.json();
    } catch (err: any) {
      console.warn(`API İsteği başarısız (${path}), mock veritabanına geçiliyor:`, err.message);
      this.isUsingMock = true;
      return this.fallback(path, options);
    }
  }

  private async fallback(path: string, options: RequestInit): Promise<any> {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body as string) : null;
    const segments = path.split('/').filter(Boolean);
    const resource = segments[0];
    const id = segments[1];

    if (resource === 'settings') {
      if (method === 'GET') return mockDb.getSettings();
      if (method === 'PATCH') return mockDb.updateSettings(body);
    }

    if (resource === 'services') {
      if (method === 'GET') return mockDb.getServices();
      if (method === 'POST') return mockDb.addService(body);
      if (id && method === 'PUT') return mockDb.updateService(id, body);
      if (id && method === 'DELETE') return mockDb.deleteService(id);
    }

    if (resource === 'doctors') {
      if (method === 'GET') return mockDb.getDoctors();
      if (method === 'POST') return mockDb.addDoctor(body);
      if (id && method === 'PUT') return mockDb.updateDoctor(id, body);
      if (id && method === 'DELETE') return mockDb.deleteDoctor(id);
    }

    if (resource === 'posts') {
      if (method === 'GET') return mockDb.getPosts();
      if (method === 'POST') return mockDb.addPost(body);
      if (id && method === 'PUT') return mockDb.updatePost(id, body);
      if (id && method === 'DELETE') return mockDb.deletePost(id);
    }

    if (resource === 'sliders') {
      if (method === 'GET') return mockDb.getSliders();
      if (method === 'POST') return mockDb.addSlider(body);
      if (id && method === 'PUT') return mockDb.updateSlider(id, body);
      if (id && method === 'DELETE') return mockDb.deleteSlider(id);
    }

    if (resource === 'gallery') {
      if (method === 'GET') return mockDb.getGallery();
      if (method === 'POST') return mockDb.addGalleryItem(body);
      if (id && method === 'DELETE') return mockDb.deleteGalleryItem(id);
    }

    if (resource === 'messages') {
      if (method === 'GET') return mockDb.getMessages();
      if (method === 'POST') return mockDb.addMessage(body);
      if (id && method === 'DELETE') return mockDb.deleteMessage(id);
    }

    if (resource === 'auth' && segments[1] === 'login') {
      const user = mockDb.validateLogin(body.username, body.password);
      if (!user) throw new Error('Hatalı giriş');
      return { token: 'mock-token', user };
    }

    if (resource === 'admins') {
      if (method === 'GET') return mockDb.getAdmins();
      if (method === 'POST') return mockDb.addAdmin(body);
    }

    return [];
  }

  async login(username: string, password: string) {
    const data = await this.request<any>('/auth/login', { 
      method: 'POST', 
      body: JSON.stringify({ username, password }) 
    });
    localStorage.setItem('sevgident_token', data.token);
    return data;
  }

  async uploadFile(file: File): Promise<string> {
    if (this.isUsingMock) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('sevgident_token');
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) throw new Error("Dosya yüklenemedi.");
      const data = await res.json();
      return data.url;
    } catch (e) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }
  }

  async getSettings(): Promise<Settings> { return this.request('/settings'); }
  async updateSettings(s: Partial<Settings>) { return this.request('/settings', { method: 'PATCH', body: JSON.stringify(s) }); }
  async getServices(): Promise<Service[]> { return this.request('/services'); }
  async addService(s: any) { return this.request('/services', { method: 'POST', body: JSON.stringify(s) }); }
  async updateService(id: string, s: any) { return this.request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(s) }); }
  async deleteService(id: string) { return this.request(`/services/${id}`, { method: 'DELETE' }); }
  async getDoctors(): Promise<Doctor[]> { return this.request('/doctors'); }
  async addDoctor(d: any) { return this.request('/doctors', { method: 'POST', body: JSON.stringify(d) }); }
  async updateDoctor(id: string, d: any) { return this.request(`/doctors/${id}`, { method: 'PUT', body: JSON.stringify(d) }); }
  async deleteDoctor(id: string) { return this.request(`/doctors/${id}`, { method: 'DELETE' }); }
  async getPosts(): Promise<Post[]> { return this.request('/posts'); }
  async addPost(p: any) { return this.request('/posts', { method: 'POST', body: JSON.stringify(p) }); }
  async updatePost(id: string, p: any) { return this.request(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(p) }); }
  async deletePost(id: string) { return this.request(`/posts/${id}`, { method: 'DELETE' }); }
  async getGallery(): Promise<GalleryItem[]> { return this.request('/gallery'); }
  async addGalleryItem(g: any) { return this.request('/gallery', { method: 'POST', body: JSON.stringify(g) }); }
  async deleteGalleryItem(id: string) { return this.request(`/gallery/${id}`, { method: 'DELETE' }); }
  async getSliders(): Promise<SliderItem[]> { return this.request('/sliders'); }
  async addSlider(s: any) { return this.request('/sliders', { method: 'POST', body: JSON.stringify(s) }); }
  async updateSlider(id: string, s: any) { return this.request(`/sliders/${id}`, { method: 'PUT', body: JSON.stringify(s) }); }
  async deleteSlider(id: string) { return this.request(`/sliders/${id}`, { method: 'DELETE' }); }
  async getMessages(): Promise<ContactMessage[]> { return this.request('/messages'); }
  async addMessage(m: any) { return this.request('/messages', { method: 'POST', body: JSON.stringify(m) }); }
  async markMessageRead(id: string) { return this.request(`/messages/${id}/read`, { method: 'POST' }); }
  async deleteMessage(id: string) { return this.request(`/messages/${id}`, { method: 'DELETE' }); }
  async getAdmins(): Promise<AdminUser[]> { return this.request('/admins'); }
  async addAdmin(a: any) { return this.request('/admins', { method: 'POST', body: JSON.stringify(a) }); }
  async updateAdmin(id: string, a: any) { return this.request(`/admins/${id}`, { method: 'PUT', body: JSON.stringify(a) }); }
  async deleteAdmin(id: string) { return this.request(`/admins/${id}`, { method: 'DELETE' }); }
  async reorder(type: string, id: string, direction: 'up' | 'down') {
    if (this.isUsingMock) {
        if (type === 'services') mockDb.reorderService(id, direction);
        if (type === 'doctors') mockDb.reorderDoctor(id, direction);
        if (type === 'posts') mockDb.reorderPost(id, direction);
        if (type === 'sliders') mockDb.reorderSlider(id, direction);
        if (type === 'gallery') mockDb.reorderGallery(id, direction);
        return { success: true };
    }
    return this.request(`/${type}/reorder`, { method: 'POST', body: JSON.stringify({ id, direction }) });
  }
}

export const api = new ApiService();
