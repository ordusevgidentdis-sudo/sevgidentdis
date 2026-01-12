
export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  message: string;
  date: string;
  isRead: boolean;
}

export interface AdminUser {
  id: string;
  username: string;
  password: string;
  fullName: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  image: string;
  slug: string;
  isVisible?: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  description: string;
  image: string;
  isVisible?: boolean;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  image: string;
  slug: string;
  status: 'draft' | 'published';
  date: string;
  isVisible?: boolean;
}

export interface SliderItem {
  id: string;
  title: string;
  desc: string;
  image: string;
  isVisible?: boolean;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  caption?: string;
  isVisible?: boolean;
}

export interface Settings {
  clinicName: string;
  address: string;
  phone: string;
  email: string;
  logoText: string;
  logoSubText: string;
  logoEmoji: string;
  footerLogoUrl: string;
  logoColor: string; 
  logoSubColor?: string; 
  logoSize: string;
  faviconUrl: string;
  mapsIframe: string;
  mapsUrl?: string; 
  mapsButtonText?: string; 
  footerSlogan: string;
  copyrightText?: string; 
  workingHoursWeekday: string;
  workingHoursSaturday: string;
  workingHoursSunday: string;
  adminPath: string;
  // Yeni Renk Ayarları
  footerHeaderColor?: string;
  footerTextColor?: string;
  footerSloganColor?: string;
}

export type View = 'public' | 'admin' | 'login' | 'service_detail' | 'blog_detail' | 'all_doctors' | 'all_services' | 'all_blog' | 'doctor_detail' | 'all_gallery';
