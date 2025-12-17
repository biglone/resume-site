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

export interface Project {
  name: string;
  description: string;
  highlights: string[];
  tags: string[];
  link?: string;
  image?: string;
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
