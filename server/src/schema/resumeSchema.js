import { z } from 'zod';

const socialSchema = z.record(z.string()).optional();

const profileSchema = z
  .object({
    name: z.string(),
    title: z.string(),
    avatar: z.string(),
    bio: z.string(),
    location: z.string(),
    email: z.string(),
    phone: z.string().optional(),
    social: socialSchema
  })
  .passthrough();

const experienceSchema = z
  .object({
    company: z.string(),
    logo: z.string().optional(),
    position: z.string(),
    period: z.string(),
    location: z.string().optional(),
    description: z.array(z.string()),
    tags: z.array(z.string())
  })
  .passthrough();

const projectImageSchema = z
  .object({
    src: z.string(),
    alt: z.string()
  })
  .passthrough();

const projectCommitSchema = z
  .object({
    hash: z.string(),
    message: z.string(),
    date: z.string(),
    language: z.string().optional(),
    snippet: z.string().optional()
  })
  .passthrough();

const projectSchema = z
  .object({
    name: z.string(),
    slug: z.string(),
    description: z.string(),
    detail: z.string().optional(),
    highlights: z.array(z.string()),
    tags: z.array(z.string()),
    link: z.string().optional(),
    image: z.string().optional(),
    images: z.array(projectImageSchema).optional(),
    commits: z.array(projectCommitSchema).optional(),
    period: z.string().optional(),
    role: z.string().optional()
  })
  .passthrough();

const skillItemSchema = z
  .object({
    name: z.string(),
    level: z.number()
  })
  .passthrough();

const skillCategorySchema = z
  .object({
    category: z.string(),
    items: z.array(skillItemSchema)
  })
  .passthrough();

const educationSchema = z
  .object({
    school: z.string(),
    degree: z.string(),
    period: z.string(),
    description: z.string().optional()
  })
  .passthrough();

const siteSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    keywords: z.string().optional(),
    theme: z.enum(['auto', 'light', 'dark']),
    language: z.string(),
    analytics: z.string().optional()
  })
  .passthrough();

export const resumeSchema = z
  .object({
    profile: profileSchema,
    experience: z.array(experienceSchema),
    projects: z.array(projectSchema),
    skills: z.array(skillCategorySchema),
    education: z.array(educationSchema).optional(),
    site: siteSchema
  })
  .passthrough();

export const resumeSchemaWithMeta = z
  .object({
    updatedAt: z.string().optional(),
    publishedAt: z.string().optional(),
    resume: resumeSchema
  })
  .passthrough();
