import type { ResumeConfig } from '../types/resume';

const prefixPath = (baseUrl: string, path: string) => {
  if (!path || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${normalizedBase}${normalizedPath}`;
};

export const normalizeResume = (resume: ResumeConfig, baseUrl: string): ResumeConfig => {
  const profile = {
    ...resume.profile,
    avatar: prefixPath(baseUrl, resume.profile.avatar)
  };

  const experience = resume.experience.map((item) => ({
    ...item,
    logo: item.logo ? prefixPath(baseUrl, item.logo) : undefined
  }));

  const projects = resume.projects.map((project) => ({
    ...project,
    image: project.image ? prefixPath(baseUrl, project.image) : undefined,
    images: project.images?.map((image) => ({
      ...image,
      src: prefixPath(baseUrl, image.src)
    }))
  }));

  return {
    ...resume,
    profile,
    experience,
    projects
  };
};
