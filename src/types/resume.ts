// Resume configuration types / 简历配置类型定义

export interface Social {
  github?: string;
  linkedin?: string;
  twitter?: string;
  blog?: string;
  [key: string]: string | undefined;
}

export interface Profile {
  name: string;
  title: string;
  avatar: string;
  bio: string;
  location: string;
  email: string;
  phone?: string;
  social: Social;
}

export interface Experience {
  company: string;
  logo?: string;
  position: string;
  period: string;
  location?: string;
  description: string[];
  tags: string[];
}

export interface ProjectImage {
  src: string;
  alt: string;
}

export interface ProjectCommit {
  hash: string;
  message: string;
  date: string;
}

export interface Project {
  name: string;
  slug: string;  // URL identifier
  description: string;
  detail?: string;  // Markdown content for detail page
  highlights: string[];
  tags: string[];
  link?: string;
  image?: string;  // Cover image (for backward compatibility)
  images?: ProjectImage[];  // Multiple images for gallery
  commits?: ProjectCommit[];  // Git commit examples
  period?: string;  // Project timeline
  role?: string;  // Your role in the project
}

export interface SkillItem {
  name: string;
  level: number; // 0-100
}

export interface SkillCategory {
  category: string;
  items: SkillItem[];
}

export interface Education {
  school: string;
  degree: string;
  period: string;
  description?: string;
}

export interface SiteConfig {
  title: string;
  description: string;
  keywords?: string;
  theme: 'auto' | 'light' | 'dark';
  language: string;
  analytics?: string;
}

export interface ResumeConfig {
  profile: Profile;
  experience: Experience[];
  projects: Project[];
  skills: SkillCategory[];
  education?: Education[];
  site: SiteConfig;
}
