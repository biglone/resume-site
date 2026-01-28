import type { ResumeConfig } from '../types/resume';

const getApiBaseUrl = () => {
  const runtimeValue = process.env.API_BASE_URL;
  const baseUrl = runtimeValue || import.meta.env.API_BASE_URL || 'http://localhost:4000';
  return baseUrl.replace(/\/$/, '');
};

export type PublishedResumeResponse = {
  resume: ResumeConfig;
  publishedAt?: string;
};

export type MetaResponse = {
  appVersion?: string;
  opsVersion?: string;
};

export const fetchPublishedResume = async (): Promise<PublishedResumeResponse | null> => {
  const response = await fetch(`${getApiBaseUrl()}/api/resume/published`, {
    headers: {
      accept: 'application/json'
    }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to load published resume (${response.status})`);
  }

  const payload = (await response.json()) as PublishedResumeResponse;
  return payload;
};

export const fetchMeta = async (): Promise<MetaResponse | null> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/meta`, {
      headers: {
        accept: 'application/json'
      }
    });
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as MetaResponse;
    return payload;
  } catch {
    return null;
  }
};
