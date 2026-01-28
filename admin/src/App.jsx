import { useEffect, useMemo, useState } from 'react';

const TOKEN_KEY = 'resume_admin_token';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || 'http://localhost:4321';
let memoryToken = '';

const DEFAULT_SITE = {
  title: 'My Resume',
  description: '',
  keywords: '',
  theme: 'auto',
  language: 'zh-CN',
  analytics: ''
};

const getLocalStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
};

const tokenStore = {
  get() {
    const storage = getLocalStorage();
    if (!storage) {
      return memoryToken;
    }
    try {
      return storage.getItem(TOKEN_KEY) || '';
    } catch (error) {
      return memoryToken;
    }
  },
  set(value) {
    memoryToken = value || '';
    const storage = getLocalStorage();
    if (!storage) {
      return;
    }
    try {
      if (value) {
        storage.setItem(TOKEN_KEY, value);
      } else {
        storage.removeItem(TOKEN_KEY);
      }
    } catch (error) {
      // Ignore storage write failures (e.g. blocked localStorage).
    }
  },
  available() {
    return Boolean(getLocalStorage());
  }
};

const formatTimestamp = (value) => {
  if (!value) {
    return 'Not published';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const formatVersion = (value) => {
  if (!value) {
    return 'N/A';
  }
  return value.length > 12 ? `${value.slice(0, 12)}…` : value;
};

const toStatus = (type, message) => ({
  type,
  message
});

const ensureArray = (value) => (Array.isArray(value) ? value : []);
const ensureString = (value) => (typeof value === 'string' ? value : '');
const ensureNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toLineText = (value) => ensureArray(value).map((item) => String(item)).join('\n');
const fromLineText = (value) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const createEmptyResume = () => ({
  profile: {
    name: '',
    title: '',
    avatar: '',
    bio: '',
    location: '',
    email: '',
    phone: '',
    social: {}
  },
  experience: [],
  projects: [],
  skills: [],
  education: [],
  site: { ...DEFAULT_SITE }
});

const normalizeProfile = (profile = {}) => ({
  ...profile,
  name: ensureString(profile.name),
  title: ensureString(profile.title),
  avatar: ensureString(profile.avatar),
  bio: ensureString(profile.bio),
  location: ensureString(profile.location),
  email: ensureString(profile.email),
  phone: ensureString(profile.phone || ''),
  social:
    profile && typeof profile.social === 'object' && !Array.isArray(profile.social)
      ? profile.social
      : {}
});

const normalizeExperience = (item = {}) => ({
  ...item,
  company: ensureString(item.company),
  logo: ensureString(item.logo || ''),
  position: ensureString(item.position),
  period: ensureString(item.period),
  location: ensureString(item.location || ''),
  description: ensureArray(item.description).map((entry) => String(entry)),
  tags: ensureArray(item.tags).map((entry) => String(entry))
});

const normalizeProjectImage = (item = {}) => ({
  ...item,
  src: ensureString(item.src),
  alt: ensureString(item.alt)
});

const normalizeProjectCommit = (item = {}) => ({
  ...item,
  hash: ensureString(item.hash),
  message: ensureString(item.message),
  date: ensureString(item.date),
  language: ensureString(item.language || ''),
  snippet: ensureString(item.snippet || '')
});

const normalizeProject = (item = {}) => ({
  ...item,
  name: ensureString(item.name),
  slug: ensureString(item.slug),
  description: ensureString(item.description),
  detail: ensureString(item.detail || ''),
  highlights: ensureArray(item.highlights).map((entry) => String(entry)),
  tags: ensureArray(item.tags).map((entry) => String(entry)),
  link: ensureString(item.link || ''),
  image: ensureString(item.image || ''),
  images: ensureArray(item.images).map(normalizeProjectImage),
  commits: ensureArray(item.commits).map(normalizeProjectCommit),
  period: ensureString(item.period || ''),
  role: ensureString(item.role || '')
});

const normalizeSkillItem = (item = {}) => ({
  ...item,
  name: ensureString(item.name),
  level: clamp(ensureNumber(item.level, 0), 0, 100)
});

const normalizeSkillCategory = (item = {}) => ({
  ...item,
  category: ensureString(item.category),
  items: ensureArray(item.items).map(normalizeSkillItem)
});

const normalizeEducation = (item = {}) => ({
  ...item,
  school: ensureString(item.school),
  degree: ensureString(item.degree),
  period: ensureString(item.period),
  description: ensureString(item.description || '')
});

const normalizeSite = (site = {}) => {
  const theme = ['auto', 'light', 'dark'].includes(site.theme) ? site.theme : DEFAULT_SITE.theme;
  return {
    ...DEFAULT_SITE,
    ...site,
    title: ensureString(site.title || DEFAULT_SITE.title),
    description: ensureString(site.description),
    keywords: ensureString(site.keywords || ''),
    theme,
    language: ensureString(site.language || DEFAULT_SITE.language),
    analytics: ensureString(site.analytics || '')
  };
};

const normalizeResume = (resume) => {
  const safe = resume && typeof resume === 'object' ? resume : createEmptyResume();
  return {
    ...safe,
    profile: normalizeProfile(safe.profile || {}),
    experience: ensureArray(safe.experience).map(normalizeExperience),
    projects: ensureArray(safe.projects).map(normalizeProject),
    skills: ensureArray(safe.skills).map(normalizeSkillCategory),
    education: ensureArray(safe.education).map(normalizeEducation),
    site: normalizeSite(safe.site || {})
  };
};

const formatSummaryValue = (value) => (value ? value : 'N/A');

const summarizeResume = (resume) => ({
  name: resume.profile?.name || '',
  title: resume.profile?.title || '',
  location: resume.profile?.location || '',
  email: resume.profile?.email || '',
  siteTitle: resume.site?.title || '',
  theme: resume.site?.theme || '',
  language: resume.site?.language || '',
  experienceCount: resume.experience?.length || 0,
  projectCount: resume.projects?.length || 0,
  skillCount: resume.skills?.length || 0,
  educationCount: resume.education?.length || 0
});

const buildDiffSummary = (current, history) => {
  const summaryCurrent = summarizeResume(current);
  const summaryHistory = summarizeResume(history);
  const items = [];

  const pushField = (label, currentValue, historyValue) => {
    if (currentValue !== historyValue) {
      items.push(`${label}: "${formatSummaryValue(historyValue)}" -> "${formatSummaryValue(currentValue)}"`);
    }
  };

  const pushCount = (label, currentValue, historyValue) => {
    if (currentValue !== historyValue) {
      items.push(`${label} count: ${historyValue} -> ${currentValue}`);
    }
  };

  pushField('Name', summaryCurrent.name, summaryHistory.name);
  pushField('Title', summaryCurrent.title, summaryHistory.title);
  pushField('Location', summaryCurrent.location, summaryHistory.location);
  pushField('Email', summaryCurrent.email, summaryHistory.email);
  pushField('Site title', summaryCurrent.siteTitle, summaryHistory.siteTitle);
  pushField('Theme', summaryCurrent.theme, summaryHistory.theme);
  pushField('Language', summaryCurrent.language, summaryHistory.language);
  pushCount('Experience', summaryCurrent.experienceCount, summaryHistory.experienceCount);
  pushCount('Projects', summaryCurrent.projectCount, summaryHistory.projectCount);
  pushCount('Skills', summaryCurrent.skillCount, summaryHistory.skillCount);
  pushCount('Education', summaryCurrent.educationCount, summaryHistory.educationCount);

  return items;
};

const createEmptyExperience = () => ({
  company: '',
  logo: '',
  position: '',
  period: '',
  location: '',
  description: [],
  tags: []
});

const createEmptyProject = () => ({
  name: '',
  slug: '',
  description: '',
  detail: '',
  highlights: [],
  tags: [],
  link: '',
  image: '',
  images: [],
  commits: [],
  period: '',
  role: ''
});

const createEmptyProjectImage = () => ({
  src: '',
  alt: ''
});

const createEmptyProjectCommit = () => ({
  hash: '',
  message: '',
  date: '',
  language: '',
  snippet: ''
});

const createEmptySkillCategory = () => ({
  category: '',
  items: []
});

const createEmptySkillItem = () => ({
  name: '',
  level: 70
});

const createEmptyEducation = () => ({
  school: '',
  degree: '',
  period: '',
  description: ''
});

const Section = ({ title, description, action, children }) => (
  <section className="editor-section">
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
    <div className="section-body">{children}</div>
  </section>
);

export default function App() {
  const [token, setToken] = useState(() => tokenStore.get());
  const [storageAvailable] = useState(() => tokenStore.available());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [editMode, setEditMode] = useState('visual');
  const [draft, setDraft] = useState(() => createEmptyResume());
  const [draftText, setDraftText] = useState('');
  const [draftUpdatedAt, setDraftUpdatedAt] = useState('');
  const [publishedAt, setPublishedAt] = useState('');
  const [meta, setMeta] = useState({ appVersion: '', opsVersion: '' });
  const [uploading, setUploading] = useState({});
  const [draftHistory, setDraftHistory] = useState([]);
  const [draftHistoryTotal, setDraftHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [restoringId, setRestoringId] = useState('');
  const [historyDetail, setHistoryDetail] = useState(null);
  const [historyPanelMode, setHistoryPanelMode] = useState('');
  const [historyPanelError, setHistoryPanelError] = useState('');
  const [historyPanelBusy, setHistoryPanelBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const apiBase = useMemo(() => API_BASE_URL.replace(/\/$/, ''), []);
  const publicBase = useMemo(() => PUBLIC_SITE_URL.replace(/\/$/, ''), []);
  const authenticated = Boolean(token);
  const isRegistering = authMode === 'register';
  const isJsonMode = editMode === 'json';
  const socialEntries = useMemo(() => {
    const entries = Object.entries(draft.profile?.social || {});
    return [...entries, ['', '']];
  }, [draft.profile]);

  const setTokenAndStore = (value) => {
    setToken(value);
    tokenStore.set(value);
  };

  const resetSession = () => {
    setTokenAndStore('');
    setDraft(createEmptyResume());
    setDraftText('');
    setDraftUpdatedAt('');
    setPublishedAt('');
    setDraftHistory([]);
    setDraftHistoryTotal(0);
    setHistoryLoading(false);
    setHistoryError('');
    setRestoringId('');
    setHistoryDetail(null);
    setHistoryPanelMode('');
    setHistoryPanelError('');
    setHistoryPanelBusy(false);
  };

  const updateDraft = (updater) => {
    setDraft((prev) => normalizeResume(typeof updater === 'function' ? updater(prev) : updater));
  };

  const fetchJson = async (path, options = {}, withAuth = false) => {
    const headers = {
      ...(options.headers || {})
    };
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }
    if (withAuth && token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      if (withAuth && response.status === 401) {
        resetSession();
      }
      const message =
        withAuth && response.status === 401
          ? 'Session expired. Please sign in again.'
          : payload?.error || 'Request failed';
      throw new Error(message);
    }

    return payload;
  };

  const loadDraft = async () => {
    const data = await fetchJson('/api/resume/draft', {}, true);
    const normalized = normalizeResume(data.resume);
    setDraft(normalized);
    setDraftText(JSON.stringify(normalized, null, 2));
    setDraftUpdatedAt(data.updatedAt || '');
  };

  const loadPublished = async () => {
    const response = await fetch(`${apiBase}/api/resume/published`);
    if (!response.ok) {
      setPublishedAt('');
      return;
    }
    const payload = await response.json().catch(() => null);
    setPublishedAt(payload?.publishedAt || '');
  };

  const loadMeta = async () => {
    try {
      const payload = await fetchJson('/api/meta');
      setMeta({
        appVersion: payload?.appVersion || '',
        opsVersion: payload?.opsVersion || ''
      });
    } catch {
      setMeta({ appVersion: '', opsVersion: '' });
    }
  };

  const loadDraftHistory = async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const payload = await fetchJson('/api/resume/draft/history?limit=50', {}, true);
      setDraftHistory(payload.items || []);
      setDraftHistoryTotal(payload.total || 0);
    } catch (error) {
      setHistoryError(error.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistoryPanel = async (id, mode) => {
    if (!id) {
      return;
    }
    setHistoryPanelMode(mode);
    setHistoryPanelError('');
    setHistoryDetail(null);
    setHistoryPanelBusy(true);
    try {
      const payload = await fetchJson(`/api/resume/draft/history/${id}`, {}, true);
      const normalized = normalizeResume(payload.resume);
      setHistoryDetail({ ...payload, resume: normalized });
    } catch (error) {
      setHistoryDetail(null);
      setHistoryPanelError(error.message);
    } finally {
      setHistoryPanelBusy(false);
    }
  };

  const closeHistoryPanel = () => {
    setHistoryPanelMode('');
    setHistoryPanelError('');
    setHistoryDetail(null);
  };

  useEffect(() => {
    if (!authenticated) {
      return;
    }
    setStatus(null);
    loadDraft()
      .then(loadPublished)
      .catch((error) => {
        setStatus(toStatus('error', error.message));
      });
    loadDraftHistory();
  }, [authenticated]);

  useEffect(() => {
    loadMeta();
  }, [apiBase]);

  useEffect(() => {
    if (!authenticated || isJsonMode) {
      return;
    }
    setDraftText(JSON.stringify(draft, null, 2));
  }, [draft, authenticated, isJsonMode]);

  const historySummary = historyDetail ? summarizeResume(historyDetail.resume) : null;
  const historyJson = useMemo(
    () => (historyDetail ? JSON.stringify(historyDetail.resume, null, 2) : ''),
    [historyDetail]
  );
  const currentJson = useMemo(() => JSON.stringify(draft, null, 2), [draft]);
  const diffSummary =
    historyDetail && historyPanelMode === 'compare'
      ? buildDiffSummary(draft, historyDetail.resume)
      : [];

  const toggleAuthMode = () => {
    setAuthMode(isRegistering ? 'login' : 'register');
    setConfirmPassword('');
    setStatus(null);
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    if (isRegistering) {
      if (password.length < 8) {
        setStatus(toStatus('error', 'Password must be at least 8 characters.'));
        return;
      }
      if (password !== confirmPassword) {
        setStatus(toStatus('error', 'Passwords do not match.'));
        return;
      }
    }

    setBusy(true);
    setStatus(null);
    try {
      const payload = await fetchJson(isRegistering ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setTokenAndStore(payload.token);
      setPassword('');
      setConfirmPassword('');
      setStatus(toStatus('success', isRegistering ? 'Account created.' : 'Signed in.'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Request failed.';
      setStatus(toStatus('error', message));
    } finally {
      setBusy(false);
    }
  };

  const handleModeChange = (nextMode) => {
    if (nextMode === editMode) {
      return;
    }

    if (nextMode === 'json') {
      setDraftText(JSON.stringify(draft, null, 2));
      setEditMode('json');
      setStatus(null);
      return;
    }

    try {
      const parsed = JSON.parse(draftText);
      const normalized = normalizeResume(parsed);
      setDraft(normalized);
      setEditMode('visual');
      setStatus(null);
    } catch (error) {
      setStatus(toStatus('error', 'Fix JSON errors before switching back to visual mode.'));
    }
  };

  const handleSave = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const payloadData = isJsonMode ? JSON.parse(draftText) : draft;
      const normalized = normalizeResume(payloadData);
      const payload = await fetchJson(
        '/api/resume/draft',
        {
          method: 'PUT',
          body: JSON.stringify(normalized)
        },
        true
      );
      const nextResume = normalizeResume(payload.resume);
      setDraft(nextResume);
      setDraftText(JSON.stringify(nextResume, null, 2));
      setDraftUpdatedAt(payload.updatedAt || '');
      setStatus(toStatus('success', 'Draft saved.'));
      loadDraftHistory();
    } catch (error) {
      setStatus(toStatus('error', error.message));
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const payloadData = isJsonMode ? JSON.parse(draftText) : draft;
      const normalized = normalizeResume(payloadData);
      const saved = await fetchJson(
        '/api/resume/draft',
        {
          method: 'PUT',
          body: JSON.stringify(normalized)
        },
        true
      );
      const nextResume = normalizeResume(saved.resume);
      setDraft(nextResume);
      setDraftText(JSON.stringify(nextResume, null, 2));
      setDraftUpdatedAt(saved.updatedAt || '');

      const published = await fetchJson(
        '/api/resume/publish',
        {
          method: 'POST'
        },
        true
      );
      setPublishedAt(published.publishedAt || '');
      setStatus(toStatus('success', 'Published successfully.'));
      loadDraftHistory();
    } catch (error) {
      const message =
        isJsonMode && error instanceof SyntaxError
          ? 'Fix JSON errors before publishing.'
        : error.message;
      setStatus(toStatus('error', message));
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async (id) => {
    if (!id || busy) {
      return;
    }
    if (typeof window !== 'undefined') {
      const ok = window.confirm('Restore this draft? This will replace the current draft.');
      if (!ok) {
        return;
      }
    }
    setBusy(true);
    setRestoringId(id);
    setStatus(null);
    try {
      const payload = await fetchJson(`/api/resume/draft/history/${id}/restore`, { method: 'POST' }, true);
      const normalized = normalizeResume(payload.resume);
      setDraft(normalized);
      setDraftText(JSON.stringify(normalized, null, 2));
      setDraftUpdatedAt(payload.updatedAt || '');
      setStatus(toStatus('success', 'Draft restored.'));
      loadDraftHistory();
    } catch (error) {
      setStatus(toStatus('error', error.message));
    } finally {
      setBusy(false);
      setRestoringId('');
    }
  };

  const uploadMaxBytes = 2 * 1024 * 1024;
  const uploadHint = 'Max 2MB · PNG/JPG/WebP/GIF';

  const setUploadingState = (key, value) => {
    setUploading((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const isUploading = (key) => Boolean(uploading[key]);

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read image.'));
      reader.readAsDataURL(file);
    });

  const handleImageUpload = async (event, key, onUploaded) => {
    const input = event.target;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    if (!token) {
      setStatus(toStatus('error', 'Sign in to upload images.'));
      if (input) {
        input.value = '';
      }
      return;
    }

    if (!file.type.startsWith('image/')) {
      setStatus(toStatus('error', 'Only image files are supported.'));
      if (input) {
        input.value = '';
      }
      return;
    }

    if (file.size > uploadMaxBytes) {
      setStatus(toStatus('error', 'Image exceeds 2MB limit.'));
      if (input) {
        input.value = '';
      }
      return;
    }

    setUploadingState(key, true);
    setStatus(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (typeof dataUrl !== 'string') {
        throw new Error('Failed to read image.');
      }

      const payload = await fetchJson(
        '/api/uploads/image',
        {
          method: 'POST',
          body: JSON.stringify({ dataUrl })
        },
        true
      );
      const path = payload?.path || '';
      if (!path) {
        throw new Error('Upload failed.');
      }
      const url = `${publicBase}${path}`;
      onUploaded(url);
      setStatus(toStatus('success', 'Image uploaded.'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed.';
      setStatus(toStatus('error', message));
    } finally {
      setUploadingState(key, false);
      if (input) {
        input.value = '';
      }
    }
  };

  const handleFormat = () => {
    if (!isJsonMode) {
      return;
    }
    try {
      const parsed = JSON.parse(draftText);
      setDraftText(JSON.stringify(parsed, null, 2));
      setStatus(toStatus('success', 'JSON formatted.'));
    } catch (error) {
      setStatus(toStatus('error', 'Invalid JSON format.'));
    }
  };

  const handleLogout = () => {
    resetSession();
    setAuthMode('login');
    setConfirmPassword('');
    setEditMode('visual');
    setStatus(null);
  };

  const updateProfileField = (field, value) => {
    updateDraft((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value
      }
    }));
  };

  const updateSocialEntry = (index, field, value) => {
    updateDraft((prev) => {
      const entries = Object.entries(prev.profile.social || {});
      while (entries.length <= index) {
        entries.push(['', '']);
      }
      const [currentKey, currentValue] = entries[index];
      const nextKey = field === 'key' ? value : currentKey;
      const nextValue = field === 'value' ? value : currentValue;
      entries[index] = [nextKey, nextValue];
      const nextSocial = {};
      entries.forEach(([key, url]) => {
        const trimmedKey = key.trim();
        if (!trimmedKey) {
          return;
        }
        nextSocial[trimmedKey] = url.trim();
      });
      return {
        ...prev,
        profile: {
          ...prev.profile,
          social: nextSocial
        }
      };
    });
  };

  const removeSocialEntry = (index) => {
    updateDraft((prev) => {
      const entries = Object.entries(prev.profile.social || {});
      entries.splice(index, 1);
      const nextSocial = {};
      entries.forEach(([key, url]) => {
        const trimmedKey = key.trim();
        if (!trimmedKey) {
          return;
        }
        nextSocial[trimmedKey] = url.trim();
      });
      return {
        ...prev,
        profile: {
          ...prev.profile,
          social: nextSocial
        }
      };
    });
  };

  const addExperience = () => {
    updateDraft((prev) => ({
      ...prev,
      experience: [...prev.experience, createEmptyExperience()]
    }));
  };

  const updateExperienceField = (index, field, value) => {
    updateDraft((prev) => {
      const next = [...prev.experience];
      next[index] = {
        ...next[index],
        [field]: value
      };
      return {
        ...prev,
        experience: next
      };
    });
  };

  const removeExperience = (index) => {
    updateDraft((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const addProject = () => {
    updateDraft((prev) => ({
      ...prev,
      projects: [...prev.projects, createEmptyProject()]
    }));
  };

  const updateProjectField = (index, field, value) => {
    updateDraft((prev) => {
      const next = [...prev.projects];
      next[index] = {
        ...next[index],
        [field]: value
      };
      return {
        ...prev,
        projects: next
      };
    });
  };

  const updateProjectList = (index, field, value) => {
    updateProjectField(index, field, fromLineText(value));
  };

  const removeProject = (index) => {
    updateDraft((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const addProjectImage = (projectIndex) => {
    updateDraft((prev) => {
      const next = [...prev.projects];
      const project = { ...next[projectIndex] };
      project.images = [...(project.images || []), createEmptyProjectImage()];
      next[projectIndex] = project;
      return {
        ...prev,
        projects: next
      };
    });
  };

  const updateProjectImage = (projectIndex, imageIndex, field, value) => {
    updateDraft((prev) => {
      const next = [...prev.projects];
      const project = { ...next[projectIndex] };
      const images = [...(project.images || [])];
      images[imageIndex] = {
        ...images[imageIndex],
        [field]: value
      };
      project.images = images;
      next[projectIndex] = project;
      return {
        ...prev,
        projects: next
      };
    });
  };

  const removeProjectImage = (projectIndex, imageIndex) => {
    updateDraft((prev) => {
      const next = [...prev.projects];
      const project = { ...next[projectIndex] };
      project.images = (project.images || []).filter((_, idx) => idx !== imageIndex);
      next[projectIndex] = project;
      return {
        ...prev,
        projects: next
      };
    });
  };

  const addProjectCommit = (projectIndex) => {
    updateDraft((prev) => {
      const next = [...prev.projects];
      const project = { ...next[projectIndex] };
      project.commits = [...(project.commits || []), createEmptyProjectCommit()];
      next[projectIndex] = project;
      return {
        ...prev,
        projects: next
      };
    });
  };

  const updateProjectCommit = (projectIndex, commitIndex, field, value) => {
    updateDraft((prev) => {
      const next = [...prev.projects];
      const project = { ...next[projectIndex] };
      const commits = [...(project.commits || [])];
      commits[commitIndex] = {
        ...commits[commitIndex],
        [field]: value
      };
      project.commits = commits;
      next[projectIndex] = project;
      return {
        ...prev,
        projects: next
      };
    });
  };

  const removeProjectCommit = (projectIndex, commitIndex) => {
    updateDraft((prev) => {
      const next = [...prev.projects];
      const project = { ...next[projectIndex] };
      project.commits = (project.commits || []).filter((_, idx) => idx !== commitIndex);
      next[projectIndex] = project;
      return {
        ...prev,
        projects: next
      };
    });
  };

  const addSkillCategory = () => {
    updateDraft((prev) => ({
      ...prev,
      skills: [...prev.skills, createEmptySkillCategory()]
    }));
  };

  const updateSkillCategory = (index, field, value) => {
    updateDraft((prev) => {
      const skills = [...prev.skills];
      skills[index] = {
        ...skills[index],
        [field]: value
      };
      return {
        ...prev,
        skills
      };
    });
  };

  const addSkillItem = (categoryIndex) => {
    updateDraft((prev) => {
      const skills = [...prev.skills];
      const category = { ...skills[categoryIndex] };
      category.items = [...(category.items || []), createEmptySkillItem()];
      skills[categoryIndex] = category;
      return {
        ...prev,
        skills
      };
    });
  };

  const updateSkillItem = (categoryIndex, itemIndex, field, value) => {
    updateDraft((prev) => {
      const skills = [...prev.skills];
      const category = { ...skills[categoryIndex] };
      const items = [...(category.items || [])];
      items[itemIndex] = {
        ...items[itemIndex],
        [field]: field === 'level' ? clamp(ensureNumber(value, 0), 0, 100) : value
      };
      category.items = items;
      skills[categoryIndex] = category;
      return {
        ...prev,
        skills
      };
    });
  };

  const removeSkillItem = (categoryIndex, itemIndex) => {
    updateDraft((prev) => {
      const skills = [...prev.skills];
      const category = { ...skills[categoryIndex] };
      category.items = (category.items || []).filter((_, idx) => idx !== itemIndex);
      skills[categoryIndex] = category;
      return {
        ...prev,
        skills
      };
    });
  };

  const removeSkillCategory = (index) => {
    updateDraft((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, idx) => idx !== index)
    }));
  };

  const addEducation = () => {
    updateDraft((prev) => ({
      ...prev,
      education: [...prev.education, createEmptyEducation()]
    }));
  };

  const updateEducationField = (index, field, value) => {
    updateDraft((prev) => {
      const education = [...prev.education];
      education[index] = {
        ...education[index],
        [field]: value
      };
      return {
        ...prev,
        education
      };
    });
  };

  const removeEducation = (index) => {
    updateDraft((prev) => ({
      ...prev,
      education: prev.education.filter((_, idx) => idx !== index)
    }));
  };

  const updateSiteField = (field, value) => {
    updateDraft((prev) => ({
      ...prev,
      site: {
        ...prev.site,
        [field]: value
      }
    }));
  };

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Resume Console</p>
          <h1>Draft, publish, and ship your resume.</h1>
          <p className="subhead">
            Manage draft data and push a published version for the public site.
          </p>
        </div>
        <div className="hero-meta">
          <div>
            <span className="meta-label">API</span>
            <span className="meta-value">{apiBase}</span>
          </div>
          <div>
            <span className="meta-label">Published</span>
            <span className="meta-value">{formatTimestamp(publishedAt)}</span>
          </div>
          <div>
            <span className="meta-label">Draft Updated</span>
            <span className="meta-value">{draftUpdatedAt ? formatTimestamp(draftUpdatedAt) : 'N/A'}</span>
          </div>
          <div>
            <span className="meta-label">App Version</span>
            <span className="meta-value" title={meta.appVersion || 'N/A'}>
              {formatVersion(meta.appVersion)}
            </span>
          </div>
          <div>
            <span className="meta-label">Ops Version</span>
            <span className="meta-value" title={meta.opsVersion || 'N/A'}>
              {formatVersion(meta.opsVersion)}
            </span>
          </div>
        </div>
      </header>

      {!authenticated ? (
        <section className="card">
          {!storageAvailable && (
            <div className="status error" role="status">
              Local storage is blocked. Open the admin in a normal browser tab or allow site data.
            </div>
          )}
          <form onSubmit={handleAuth} className="form">
            <div className="form-row">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div className="form-row">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
                required
              />
            </div>
            {isRegistering && (
              <div className="form-row">
                <label htmlFor="confirm-password">Confirm Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="********"
                  required
                />
              </div>
            )}
            {isRegistering && <p className="form-help">Password must be at least 8 characters.</p>}
            <button className="primary" type="submit" disabled={busy}>
              {busy
                ? isRegistering
                  ? 'Creating...'
                  : 'Signing in...'
                : isRegistering
                  ? 'Create account'
                  : 'Sign in'}
            </button>
            <div className="form-footer">
              <span>{isRegistering ? 'Already have an account?' : 'No account yet?'}</span>
              <button className="link-button" type="button" onClick={toggleAuthMode}>
                {isRegistering ? 'Sign in' : 'Create account'}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="card">
          <div className="toolbar">
            <div className="toolbar-left">
              <div className="mode-toggle" role="tablist" aria-label="Editor mode">
                <button
                  className={editMode === 'visual' ? 'active' : ''}
                  type="button"
                  onClick={() => handleModeChange('visual')}
                >
                  Visual
                </button>
                <button
                  className={editMode === 'json' ? 'active' : ''}
                  type="button"
                  onClick={() => handleModeChange('json')}
                >
                  JSON
                </button>
              </div>
              {isJsonMode && (
                <button className="secondary" type="button" onClick={handleFormat}>
                  Format JSON
                </button>
              )}
              <a className="ghost" href={PUBLIC_SITE_URL} target="_blank" rel="noreferrer">
                Open public site
              </a>
            </div>
            <div className="toolbar-right">
              <button className="secondary" type="button" onClick={handleLogout}>
                Log out
              </button>
              <button className="secondary" type="button" onClick={handleSave} disabled={busy}>
                {busy ? 'Saving...' : 'Save draft'}
              </button>
              <button className="primary" type="button" onClick={handlePublish} disabled={busy}>
                {busy ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>

          <div className="draft-history">
            <div className="history-header">
              <div>
                <h2>Draft history</h2>
                <p>Every save is kept. Restore any version.</p>
              </div>
              <div className="history-actions">
                <button
                  className="secondary"
                  type="button"
                  onClick={loadDraftHistory}
                  disabled={historyLoading}
                >
                  {historyLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
            {historyError && (
              <div className="status error" role="status">
                {historyError}
              </div>
            )}
            {draftHistory.length === 0 ? (
              <p className="empty-state">
                {historyLoading ? 'Loading history...' : 'No draft history yet.'}
              </p>
            ) : (
              <div className="history-list">
                {draftHistory.map((item) => (
                  <div className="history-item" key={item.id}>
                    <div className="history-main">
                      <span className="history-name">{item.profile?.name || 'Untitled'}</span>
                      <span className="history-role">{item.profile?.title || 'No title'}</span>
                    </div>
                    <div className="history-meta">
                      <span>{formatTimestamp(item.updatedAt)}</span>
                      <div className="history-buttons">
                        <button
                          className="secondary"
                          type="button"
                          onClick={() => openHistoryPanel(item.id, 'preview')}
                          disabled={historyPanelBusy}
                        >
                          Preview
                        </button>
                        <button
                          className="secondary"
                          type="button"
                          onClick={() => openHistoryPanel(item.id, 'compare')}
                          disabled={historyPanelBusy}
                        >
                          Compare
                        </button>
                        <button
                          className="secondary"
                          type="button"
                          onClick={() => handleRestore(item.id)}
                          disabled={busy || restoringId === item.id}
                        >
                          {restoringId === item.id ? 'Restoring...' : 'Restore'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {draftHistoryTotal > draftHistory.length && (
              <p className="form-help">
                Showing latest {draftHistory.length} of {draftHistoryTotal} drafts.
              </p>
            )}
          </div>

          <div className="editor">
            {isJsonMode ? (
              <textarea
                className="json-editor"
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                placeholder="Resume JSON will appear here after login."
                spellCheck="false"
              />
            ) : (
              <div className="editor-visual">
                <Section
                  title="Profile"
                  description="Core identity and contact info."
                >
                  <div className="field-grid two">
                    <div className="field">
                      <label>Name</label>
                      <input
                        type="text"
                        value={draft.profile.name}
                        onChange={(event) => updateProfileField('name', event.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="field">
                      <label>Title</label>
                      <input
                        type="text"
                        value={draft.profile.title}
                        onChange={(event) => updateProfileField('title', event.target.value)}
                        placeholder="Role or headline"
                      />
                    </div>
                  </div>
                  <div className="field-grid two">
                    <div className="field">
                      <label>Avatar URL</label>
                      <input
                        type="text"
                        value={draft.profile.avatar}
                        onChange={(event) => updateProfileField('avatar', event.target.value)}
                        placeholder="/images/avatar.jpg"
                      />
                      <div className="upload-row">
                        <input
                          className="file-input"
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            handleImageUpload(event, 'profile-avatar', (url) =>
                              updateProfileField('avatar', url)
                            )
                          }
                          disabled={isUploading('profile-avatar')}
                        />
                        <span className="upload-hint">
                          {isUploading('profile-avatar') ? 'Uploading...' : uploadHint}
                        </span>
                      </div>
                      {draft.profile.avatar && (
                        <div className="avatar-preview">
                          <img src={draft.profile.avatar} alt="Avatar preview" />
                        </div>
                      )}
                    </div>
                    <div className="field">
                      <label>Location</label>
                      <input
                        type="text"
                        value={draft.profile.location}
                        onChange={(event) => updateProfileField('location', event.target.value)}
                        placeholder="City, Country"
                      />
                    </div>
                  </div>
                  <div className="field-grid two">
                    <div className="field">
                      <label>Email</label>
                      <input
                        type="email"
                        value={draft.profile.email}
                        onChange={(event) => updateProfileField('email', event.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="field">
                      <label>Phone</label>
                      <input
                        type="text"
                        value={draft.profile.phone}
                        onChange={(event) => updateProfileField('phone', event.target.value)}
                        placeholder="+86 138 0000 0000"
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label>Bio</label>
                    <textarea
                      className="textarea-small"
                      value={draft.profile.bio}
                      onChange={(event) => updateProfileField('bio', event.target.value)}
                      placeholder="Short intro or summary"
                    />
                  </div>
                  <div className="subsection">
                    <div className="subsection-header">
                      <h3>Social Links</h3>
                      <p>Add handles and URLs.</p>
                    </div>
                    <div className="social-list">
                      {socialEntries.map(([key, url], index) => (
                        <div className="social-row" key={`social-${index}`}>
                          <input
                            type="text"
                            value={key}
                            placeholder="Label (github)"
                            onChange={(event) => updateSocialEntry(index, 'key', event.target.value)}
                          />
                          <input
                            type="text"
                            value={url}
                            placeholder="https://..."
                            onChange={(event) => updateSocialEntry(index, 'value', event.target.value)}
                          />
                          {key && (
                            <button
                              className="ghost-danger"
                              type="button"
                              onClick={() => removeSocialEntry(index)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Section>

                <Section
                  title="Experience"
                  description="Work history, responsibilities, and impact."
                  action={
                    <button className="secondary" type="button" onClick={addExperience}>
                      Add experience
                    </button>
                  }
                >
                  {draft.experience.length === 0 ? (
                    <p className="empty-state">No experience entries yet.</p>
                  ) : (
                    <div className="item-stack">
                      {draft.experience.map((item, index) => (
                        <div className="item-card" key={`experience-${index}`}>
                          <div className="item-header">
                            <h3>{item.company || `Experience ${index + 1}`}</h3>
                            <button
                              className="ghost-danger"
                              type="button"
                              onClick={() => removeExperience(index)}
                            >
                              Remove
                            </button>
                          </div>
                          <div className="field-grid two">
                            <div className="field">
                              <label>Company</label>
                              <input
                                type="text"
                                value={item.company}
                                onChange={(event) =>
                                  updateExperienceField(index, 'company', event.target.value)
                                }
                                placeholder="Company name"
                              />
                            </div>
                            <div className="field">
                              <label>Position</label>
                              <input
                                type="text"
                                value={item.position}
                                onChange={(event) =>
                                  updateExperienceField(index, 'position', event.target.value)
                                }
                                placeholder="Role title"
                              />
                            </div>
                          </div>
                          <div className="field-grid three">
                            <div className="field">
                              <label>Period</label>
                              <input
                                type="text"
                                value={item.period}
                                onChange={(event) =>
                                  updateExperienceField(index, 'period', event.target.value)
                                }
                                placeholder="2022.01 - Present"
                              />
                            </div>
                            <div className="field">
                              <label>Location</label>
                              <input
                                type="text"
                                value={item.location}
                                onChange={(event) =>
                                  updateExperienceField(index, 'location', event.target.value)
                                }
                                placeholder="City"
                              />
                            </div>
                            <div className="field">
                              <label>Logo URL</label>
                              <input
                                type="text"
                                value={item.logo}
                                onChange={(event) =>
                                  updateExperienceField(index, 'logo', event.target.value)
                                }
                                placeholder="/images/company.png"
                              />
                              <div className="upload-row">
                                <input
                                  className="file-input"
                                  type="file"
                                  accept="image/*"
                                  onChange={(event) =>
                                    handleImageUpload(event, `experience-${index}-logo`, (url) =>
                                      updateExperienceField(index, 'logo', url)
                                    )
                                  }
                                  disabled={isUploading(`experience-${index}-logo`)}
                                />
                                <span className="upload-hint">
                                  {isUploading(`experience-${index}-logo`) ? 'Uploading...' : uploadHint}
                                </span>
                              </div>
                              {item.logo && (
                                <div className="image-preview image-preview--small image-preview--contain">
                                  <img src={item.logo} alt="Logo preview" />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="field">
                            <label>Description (one per line)</label>
                            <textarea
                              className="textarea-small"
                              value={toLineText(item.description)}
                              onChange={(event) =>
                                updateExperienceField(index, 'description', fromLineText(event.target.value))
                              }
                              placeholder="Achievement or responsibility"
                            />
                          </div>
                          <div className="field">
                            <label>Tags (one per line)</label>
                            <textarea
                              className="textarea-small"
                              value={toLineText(item.tags)}
                              onChange={(event) =>
                                updateExperienceField(index, 'tags', fromLineText(event.target.value))
                              }
                              placeholder="React\nTypeScript\n..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                <Section
                  title="Projects"
                  description="Showcase key projects and achievements."
                  action={
                    <button className="secondary" type="button" onClick={addProject}>
                      Add project
                    </button>
                  }
                >
                  {draft.projects.length === 0 ? (
                    <p className="empty-state">No projects yet.</p>
                  ) : (
                    <div className="item-stack">
                      {draft.projects.map((project, index) => (
                        <div className="item-card" key={`project-${index}`}>
                          <div className="item-header">
                            <h3>{project.name || `Project ${index + 1}`}</h3>
                            <button
                              className="ghost-danger"
                              type="button"
                              onClick={() => removeProject(index)}
                            >
                              Remove
                            </button>
                          </div>
                          <div className="field-grid two">
                            <div className="field">
                              <label>Name</label>
                              <input
                                type="text"
                                value={project.name}
                                onChange={(event) =>
                                  updateProjectField(index, 'name', event.target.value)
                                }
                                placeholder="Project name"
                              />
                            </div>
                            <div className="field">
                              <label>Slug</label>
                              <input
                                type="text"
                                value={project.slug}
                                onChange={(event) =>
                                  updateProjectField(index, 'slug', event.target.value)
                                }
                                placeholder="project-slug"
                              />
                            </div>
                          </div>
                          <div className="field">
                            <label>Short Description</label>
                            <input
                              type="text"
                              value={project.description}
                              onChange={(event) =>
                                updateProjectField(index, 'description', event.target.value)
                              }
                              placeholder="One sentence summary"
                            />
                          </div>
                          <div className="field-grid three">
                            <div className="field">
                              <label>Period</label>
                              <input
                                type="text"
                                value={project.period}
                                onChange={(event) =>
                                  updateProjectField(index, 'period', event.target.value)
                                }
                                placeholder="2023.01 - 2023.06"
                              />
                            </div>
                            <div className="field">
                              <label>Role</label>
                              <input
                                type="text"
                                value={project.role}
                                onChange={(event) =>
                                  updateProjectField(index, 'role', event.target.value)
                                }
                                placeholder="Lead developer"
                              />
                            </div>
                            <div className="field">
                              <label>Link</label>
                              <input
                                type="text"
                                value={project.link}
                                onChange={(event) =>
                                  updateProjectField(index, 'link', event.target.value)
                                }
                                placeholder="https://..."
                              />
                            </div>
                          </div>
                          <div className="field-grid two">
                            <div className="field">
                              <label>Cover Image</label>
                              <input
                                type="text"
                                value={project.image}
                                onChange={(event) =>
                                  updateProjectField(index, 'image', event.target.value)
                                }
                                placeholder="/images/projects/cover.png"
                              />
                              <div className="upload-row">
                                <input
                                  className="file-input"
                                  type="file"
                                  accept="image/*"
                                  onChange={(event) =>
                                    handleImageUpload(event, `project-${index}-cover`, (url) =>
                                      updateProjectField(index, 'image', url)
                                    )
                                  }
                                  disabled={isUploading(`project-${index}-cover`)}
                                />
                                <span className="upload-hint">
                                  {isUploading(`project-${index}-cover`) ? 'Uploading...' : uploadHint}
                                </span>
                              </div>
                              {project.image && (
                                <div className="image-preview image-preview--wide">
                                  <img src={project.image} alt="Cover preview" />
                                </div>
                              )}
                            </div>
                            <div className="field">
                              <label>Highlights (one per line)</label>
                              <textarea
                                className="textarea-small"
                                value={toLineText(project.highlights)}
                                onChange={(event) =>
                                  updateProjectList(index, 'highlights', event.target.value)
                                }
                                placeholder="Outcome or metric"
                              />
                            </div>
                          </div>
                          <div className="field">
                            <label>Tags (one per line)</label>
                            <textarea
                              className="textarea-small"
                              value={toLineText(project.tags)}
                              onChange={(event) => updateProjectList(index, 'tags', event.target.value)}
                              placeholder="React\nNode.js"
                            />
                          </div>
                          <div className="field">
                            <label>Detail (Markdown supported)</label>
                            <textarea
                              className="textarea-large"
                              value={project.detail}
                              onChange={(event) =>
                                updateProjectField(index, 'detail', event.target.value)
                              }
                              placeholder="Long-form description or markdown"
                            />
                          </div>
                          <div className="subsection">
                            <div className="subsection-header">
                              <h3>Project Images</h3>
                              <button
                                className="secondary"
                                type="button"
                                onClick={() => addProjectImage(index)}
                              >
                                Add image
                              </button>
                            </div>
                            {project.images && project.images.length > 0 ? (
                              <div className="item-stack">
                                {project.images.map((image, imageIndex) => (
                                  <div className="mini-card" key={`project-${index}-image-${imageIndex}`}>
                                    <div className="field-grid two">
                                      <div className="field">
                                        <label>Image URL</label>
                                        <input
                                          type="text"
                                          value={image.src}
                                          onChange={(event) =>
                                            updateProjectImage(index, imageIndex, 'src', event.target.value)
                                          }
                                          placeholder="/images/projects/sample.png"
                                        />
                                      </div>
                                      <div className="field">
                                        <label>Alt text</label>
                                        <input
                                          type="text"
                                          value={image.alt}
                                          onChange={(event) =>
                                            updateProjectImage(index, imageIndex, 'alt', event.target.value)
                                          }
                                          placeholder="Screenshot description"
                                        />
                                      </div>
                                    </div>
                                    <div className="upload-row">
                                      <input
                                        className="file-input"
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) =>
                                          handleImageUpload(
                                            event,
                                            `project-${index}-image-${imageIndex}`,
                                            (url) =>
                                              updateProjectImage(index, imageIndex, 'src', url)
                                          )
                                        }
                                        disabled={isUploading(`project-${index}-image-${imageIndex}`)}
                                      />
                                      <span className="upload-hint">
                                        {isUploading(`project-${index}-image-${imageIndex}`)
                                          ? 'Uploading...'
                                          : uploadHint}
                                      </span>
                                    </div>
                                    {image.src && (
                                      <div className="image-preview image-preview--wide">
                                        <img src={image.src} alt={image.alt || 'Project image preview'} />
                                      </div>
                                    )}
                                    <button
                                      className="ghost-danger"
                                      type="button"
                                      onClick={() => removeProjectImage(index, imageIndex)}
                                    >
                                      Remove image
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="empty-state">No images yet.</p>
                            )}
                          </div>
                          <div className="subsection">
                            <div className="subsection-header">
                              <h3>Project Commits</h3>
                              <button
                                className="secondary"
                                type="button"
                                onClick={() => addProjectCommit(index)}
                              >
                                Add commit
                              </button>
                            </div>
                            {project.commits && project.commits.length > 0 ? (
                              <div className="item-stack">
                                {project.commits.map((commit, commitIndex) => (
                                  <div className="mini-card" key={`project-${index}-commit-${commitIndex}`}>
                                    <div className="field-grid three">
                                      <div className="field">
                                        <label>Hash</label>
                                        <input
                                          type="text"
                                          value={commit.hash}
                                          onChange={(event) =>
                                            updateProjectCommit(index, commitIndex, 'hash', event.target.value)
                                          }
                                          placeholder="a1b2c3d"
                                        />
                                      </div>
                                      <div className="field">
                                        <label>Message</label>
                                        <input
                                          type="text"
                                          value={commit.message}
                                          onChange={(event) =>
                                            updateProjectCommit(index, commitIndex, 'message', event.target.value)
                                          }
                                          placeholder="Commit message"
                                        />
                                      </div>
                                      <div className="field">
                                        <label>Date</label>
                                        <input
                                          type="text"
                                          value={commit.date}
                                          onChange={(event) =>
                                            updateProjectCommit(index, commitIndex, 'date', event.target.value)
                                          }
                                          placeholder="2024-01-10"
                                        />
                                      </div>
                                    </div>
                                    <div className="field-grid two">
                                      <div className="field">
                                        <label>Language</label>
                                        <input
                                          type="text"
                                          value={commit.language}
                                          onChange={(event) =>
                                            updateProjectCommit(index, commitIndex, 'language', event.target.value)
                                          }
                                          placeholder="ts, js, diff"
                                        />
                                      </div>
                                    </div>
                                    <div className="field">
                                      <label>Code Snippet</label>
                                      <textarea
                                        className="textarea-small code-textarea"
                                        value={commit.snippet}
                                        onChange={(event) =>
                                          updateProjectCommit(index, commitIndex, 'snippet', event.target.value)
                                        }
                                        placeholder="Paste the key diff or code excerpt here."
                                      />
                                    </div>
                                    <button
                                      className="ghost-danger"
                                      type="button"
                                      onClick={() => removeProjectCommit(index, commitIndex)}
                                    >
                                      Remove commit
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="empty-state">No commits yet.</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                <Section
                  title="Skills"
                  description="Group skills by category and level."
                  action={
                    <button className="secondary" type="button" onClick={addSkillCategory}>
                      Add category
                    </button>
                  }
                >
                  {draft.skills.length === 0 ? (
                    <p className="empty-state">No skill categories yet.</p>
                  ) : (
                    <div className="item-stack">
                      {draft.skills.map((category, index) => (
                        <div className="item-card" key={`skill-${index}`}>
                          <div className="item-header">
                            <h3>{category.category || `Category ${index + 1}`}</h3>
                            <button
                              className="ghost-danger"
                              type="button"
                              onClick={() => removeSkillCategory(index)}
                            >
                              Remove
                            </button>
                          </div>
                          <div className="field">
                            <label>Category</label>
                            <input
                              type="text"
                              value={category.category}
                              onChange={(event) => updateSkillCategory(index, 'category', event.target.value)}
                              placeholder="Frontend Frameworks"
                            />
                          </div>
                          <div className="subsection">
                            <div className="subsection-header">
                              <h3>Items</h3>
                              <button
                                className="secondary"
                                type="button"
                                onClick={() => addSkillItem(index)}
                              >
                                Add skill
                              </button>
                            </div>
                            {category.items && category.items.length > 0 ? (
                              <div className="item-stack">
                                {category.items.map((item, itemIndex) => (
                                  <div className="mini-card" key={`skill-${index}-${itemIndex}`}>
                                    <div className="field-grid two">
                                      <div className="field">
                                        <label>Name</label>
                                        <input
                                          type="text"
                                          value={item.name}
                                          onChange={(event) =>
                                            updateSkillItem(index, itemIndex, 'name', event.target.value)
                                          }
                                          placeholder="React"
                                        />
                                      </div>
                                      <div className="field">
                                        <label>Level (0-100)</label>
                                        <div className="range-field">
                                          <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={item.level}
                                            onChange={(event) =>
                                              updateSkillItem(index, itemIndex, 'level', event.target.value)
                                            }
                                          />
                                          <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={item.level}
                                            onChange={(event) =>
                                              updateSkillItem(index, itemIndex, 'level', event.target.value)
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      className="ghost-danger"
                                      type="button"
                                      onClick={() => removeSkillItem(index, itemIndex)}
                                    >
                                      Remove skill
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="empty-state">No skills in this category.</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                <Section
                  title="Education"
                  description="Degrees, programs, and certifications."
                  action={
                    <button className="secondary" type="button" onClick={addEducation}>
                      Add education
                    </button>
                  }
                >
                  {draft.education.length === 0 ? (
                    <p className="empty-state">No education entries yet.</p>
                  ) : (
                    <div className="item-stack">
                      {draft.education.map((item, index) => (
                        <div className="item-card" key={`education-${index}`}>
                          <div className="item-header">
                            <h3>{item.school || `Education ${index + 1}`}</h3>
                            <button
                              className="ghost-danger"
                              type="button"
                              onClick={() => removeEducation(index)}
                            >
                              Remove
                            </button>
                          </div>
                          <div className="field-grid two">
                            <div className="field">
                              <label>School</label>
                              <input
                                type="text"
                                value={item.school}
                                onChange={(event) =>
                                  updateEducationField(index, 'school', event.target.value)
                                }
                                placeholder="University name"
                              />
                            </div>
                            <div className="field">
                              <label>Degree</label>
                              <input
                                type="text"
                                value={item.degree}
                                onChange={(event) =>
                                  updateEducationField(index, 'degree', event.target.value)
                                }
                                placeholder="B.Sc. in Computer Science"
                              />
                            </div>
                          </div>
                          <div className="field-grid two">
                            <div className="field">
                              <label>Period</label>
                              <input
                                type="text"
                                value={item.period}
                                onChange={(event) =>
                                  updateEducationField(index, 'period', event.target.value)
                                }
                                placeholder="2015 - 2019"
                              />
                            </div>
                            <div className="field">
                              <label>Description</label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(event) =>
                                  updateEducationField(index, 'description', event.target.value)
                                }
                                placeholder="Optional notes"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                <Section title="Site Settings" description="Metadata and presentation settings.">
                  <div className="field-grid two">
                    <div className="field">
                      <label>Site Title</label>
                      <input
                        type="text"
                        value={draft.site.title}
                        onChange={(event) => updateSiteField('title', event.target.value)}
                        placeholder="Your site title"
                      />
                    </div>
                    <div className="field">
                      <label>Description</label>
                      <input
                        type="text"
                        value={draft.site.description}
                        onChange={(event) => updateSiteField('description', event.target.value)}
                        placeholder="Short description"
                      />
                    </div>
                  </div>
                  <div className="field-grid two">
                    <div className="field">
                      <label>Keywords</label>
                      <input
                        type="text"
                        value={draft.site.keywords}
                        onChange={(event) => updateSiteField('keywords', event.target.value)}
                        placeholder="frontend, resume, ..."
                      />
                    </div>
                    <div className="field">
                      <label>Theme</label>
                      <select
                        value={draft.site.theme}
                        onChange={(event) => updateSiteField('theme', event.target.value)}
                      >
                        <option value="auto">Auto</option>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </div>
                  </div>
                  <div className="field-grid two">
                    <div className="field">
                      <label>Language</label>
                      <input
                        type="text"
                        value={draft.site.language}
                        onChange={(event) => updateSiteField('language', event.target.value)}
                        placeholder="zh-CN"
                      />
                    </div>
                    <div className="field">
                      <label>Analytics</label>
                      <input
                        type="text"
                        value={draft.site.analytics}
                        onChange={(event) => updateSiteField('analytics', event.target.value)}
                        placeholder="Optional tracking ID"
                      />
                    </div>
                  </div>
                </Section>
              </div>
            )}
          </div>
        </section>
      )}

      {historyPanelMode && (
        <div className="history-panel">
          <div className="history-panel-card" role="dialog" aria-modal="true">
            <div className="history-panel-header">
              <div>
                <p className="eyebrow">Draft history</p>
                <h2>{historyPanelMode === 'compare' ? 'Compare drafts' : 'Draft preview'}</h2>
              </div>
              <div className="history-panel-actions">
                <div className="mode-toggle" role="tablist" aria-label="History view">
                  <button
                    className={historyPanelMode === 'preview' ? 'active' : ''}
                    type="button"
                    onClick={() => setHistoryPanelMode('preview')}
                    disabled={historyPanelBusy || !historyDetail}
                  >
                    Preview
                  </button>
                  <button
                    className={historyPanelMode === 'compare' ? 'active' : ''}
                    type="button"
                    onClick={() => setHistoryPanelMode('compare')}
                    disabled={historyPanelBusy || !historyDetail}
                  >
                    Compare
                  </button>
                </div>
                <button className="ghost" type="button" onClick={closeHistoryPanel}>
                  Close
                </button>
              </div>
            </div>

            {historyPanelBusy && <p className="empty-state">Loading history...</p>}
            {!historyPanelBusy && historyPanelError && (
              <div className="status error" role="status">
                {historyPanelError}
              </div>
            )}

            {!historyPanelBusy && historyDetail && historyPanelMode === 'preview' && (
              <div className="history-preview">
                <div className="history-summary">
                  <div>
                    <span className="meta-label">Name</span>
                    <span className="meta-value">{formatSummaryValue(historySummary?.name)}</span>
                  </div>
                  <div>
                    <span className="meta-label">Title</span>
                    <span className="meta-value">{formatSummaryValue(historySummary?.title)}</span>
                  </div>
                  <div>
                    <span className="meta-label">Updated</span>
                    <span className="meta-value">{formatTimestamp(historyDetail.updatedAt)}</span>
                  </div>
                  <div>
                    <span className="meta-label">Location</span>
                    <span className="meta-value">{formatSummaryValue(historySummary?.location)}</span>
                  </div>
                  <div>
                    <span className="meta-label">Email</span>
                    <span className="meta-value">{formatSummaryValue(historySummary?.email)}</span>
                  </div>
                  <div>
                    <span className="meta-label">Site title</span>
                    <span className="meta-value">{formatSummaryValue(historySummary?.siteTitle)}</span>
                  </div>
                  <div>
                    <span className="meta-label">Experience</span>
                    <span className="meta-value">{historySummary?.experienceCount ?? 0}</span>
                  </div>
                  <div>
                    <span className="meta-label">Projects</span>
                    <span className="meta-value">{historySummary?.projectCount ?? 0}</span>
                  </div>
                  <div>
                    <span className="meta-label">Skills</span>
                    <span className="meta-value">{historySummary?.skillCount ?? 0}</span>
                  </div>
                  <div>
                    <span className="meta-label">Education</span>
                    <span className="meta-value">{historySummary?.educationCount ?? 0}</span>
                  </div>
                </div>
                <textarea className="json-editor history-json" value={historyJson} readOnly />
              </div>
            )}

            {!historyPanelBusy && historyDetail && historyPanelMode === 'compare' && (
              <div className="history-compare">
                <div className="history-diff">
                  <h3>Summary</h3>
                  {diffSummary.length === 0 ? (
                    <p className="empty-state">No differences detected at summary level.</p>
                  ) : (
                    <ul className="history-diff-list">
                      {diffSummary.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="history-compare-grid">
                  <div className="history-compare-block">
                    <h3>Selected draft</h3>
                    <p className="form-help">Updated: {formatTimestamp(historyDetail.updatedAt)}</p>
                    <textarea className="json-editor history-json" value={historyJson} readOnly />
                  </div>
                  <div className="history-compare-block">
                    <h3>Current draft</h3>
                    <p className="form-help">
                      Updated: {draftUpdatedAt ? formatTimestamp(draftUpdatedAt) : 'N/A'}
                    </p>
                    <textarea className="json-editor history-json" value={currentJson} readOnly />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {status && (
        <div className={`status ${status.type}`} role="status">
          {status.message}
        </div>
      )}
    </div>
  );
}
