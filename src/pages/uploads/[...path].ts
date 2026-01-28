import type { APIRoute } from 'astro';

const getApiBaseUrl = () => {
  const runtimeValue = process.env.API_BASE_URL;
  const baseUrl = runtimeValue || import.meta.env.API_BASE_URL || 'http://localhost:4000';
  return baseUrl.replace(/\/$/, '');
};

const sanitizePath = (value: string | undefined) => {
  if (!value) {
    return '';
  }
  if (value.includes('..')) {
    return '';
  }
  return value;
};

export const GET: APIRoute = async ({ params, request }) => {
  const pathParam = Array.isArray(params.path) ? params.path.join('/') : params.path;
  const safePath = sanitizePath(pathParam);
  if (!safePath) {
    return new Response('Not found', { status: 404 });
  }

  const targetUrl = new URL(`/uploads/${safePath}`, getApiBaseUrl());
  const response = await fetch(targetUrl, {
    method: 'GET',
    headers: {
      accept: request.headers.get('accept') || '*/*'
    }
  });

  if (!response.ok) {
    return new Response(response.statusText, { status: response.status });
  }

  const headers = new Headers(response.headers);
  headers.delete('transfer-encoding');
  return new Response(response.body, {
    status: response.status,
    headers
  });
};
