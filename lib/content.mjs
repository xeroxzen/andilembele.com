import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { parse as parseYAML } from 'yaml';
import { z } from 'zod';

// Everything the pages say lives in content/. Each file is checked here, so a typo fails the build instead of the page.
const CONTENT = new URL('../content/', import.meta.url);
const MAX_PROJECTS = 100;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MONTH = /^\d{4}(-(0[1-9]|1[0-2]))?$/;
const DAY_OR_MONTH = /^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/;

// Sections a case study may use, in the order they must appear. Any subset is allowed while a write-up is in progress.
export const CASE_STUDY_SECTIONS = ['Problem', 'Constraints', 'Architecture', 'Decisions & trade-offs', 'Impact', 'What I’d do differently'];
export const COVERS = ['gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red'];
export const STATUSES = ['Active', 'Live', 'Shipped', 'Archived'];
export const DOMAINS = ['AI', 'Data', 'Security', 'Infrastructure', 'Fintech', 'PropTech', 'Health', 'Operations', 'Hardware'];
export const SHIP_KINDS = ['Release', 'Product', 'Open source', 'Internal'];
export const LIBRARY_KINDS = ['Book', 'Paper'];

const url = z.string().refine((value) => /^https:\/\//.test(value) || /^\/[\w./-]*$/.test(value), 'must be https:// or a site path');
const text = z.string().trim().min(1);

const siteSchema = z.strictObject({
  name: text,
  role: text,
  status: text,
  positioning: text,
  highlight: z.array(text).max(1).default([]),
  summary: text,
  about: z.array(text).min(1),
  email: z.email(),
  availability: text,
  openTo: z.array(z.strictObject({ title: text, focus: text, evidence: text })).min(1).max(8),
  resumePdf: url,
  proof: z.array(z.strictObject({ value: text, label: text })).min(1).max(4),
  principles: z.array(z.strictObject({ title: text, body: text, source: text.optional() })).length(3),
  awards: z.array(z.strictObject({ year: z.string().regex(/^\d{4}$/), title: text })),
  skills: z.array(z.strictObject({ group: text, items: z.array(text).min(1) })).min(1),
});

const roleSchema = z.strictObject({
  org: text,
  url: url.optional(),
  role: text,
  location: text.optional(),
  kind: z.enum(['Work', 'Venture', 'Community']),
  start: z.string().regex(MONTH).optional(),
  end: z.string().regex(MONTH).optional(),
  summary: text,
});

const talkSchema = z.strictObject({
  title: text,
  event: text,
  year: z.string().regex(/^\d{4}$/),
  url,
  image: z.string().regex(/^\/assets\/talks\/[\w-]+$/),
  alt: text,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const nowItem = z.strictObject({ title: text, url: url.optional(), note: text.optional() });
const nowSchema = z.strictObject({
  updated: z.iso.date(),
  building: z.array(nowItem),
  reading: z.array(nowItem),
  learning: z.array(nowItem),
});

const shippedSchema = z.strictObject({
  date: z.string().regex(DAY_OR_MONTH, 'date is YYYY-MM-DD, or YYYY-MM when the day is unknown'),
  title: text,
  kind: z.enum(SHIP_KINDS),
  domain: z.enum(DOMAINS),
  href: url.optional(),
  summary: text,
});

const librarySchema = z.strictObject({
  title: text,
  author: text,
  year: z.number().int().min(1900).max(2100),
  kind: z.enum(LIBRARY_KINDS),
  topic: text,
});

const projectSchema = z.strictObject({
  title: text,
  icon: z.string().regex(/^[A-Z0-9]{1,2}$/, 'icon is one or two capital letters or digits'),
  cover: z.enum(COVERS),
  summary: text,
  status: z.enum(STATUSES).optional(),
  domain: z.enum(DOMAINS),
  stack: z.array(text),
  role: text.optional(),
  year: z.union([
    z.number().int().min(2000).max(2100),
    z.string().regex(/^\d{4}–(\d{4}|Present)$/, 'a span is "2022–2025" or "2023–Present", with an en dash')
      .refine((span) => span.endsWith('Present') || span.slice(0, 4) < span.slice(5), 'a span must end after it starts'),
  ]).optional(),
  featured: z.number().int().min(1).max(4).optional(),
  links: z.strictObject({ live: url, repo: url, writeup: url, caseStudy: url }).partial().default({}),
});

function check(schema, value, source) {
  const result = schema.safeParse(value);
  if (!result.success) throw Error(`${source}: ${z.prettifyError(result.error)}`);
  return result.data;
}

async function readJSON(name, schema) {
  return check(schema, JSON.parse(await readFile(new URL(name, CONTENT), 'utf8')), 'content/' + name);
}

/**
 * Split a Markdown file into its YAML front matter and body.
 */
export function splitFrontMatter(source, name) {
  const match = source.replace(/\r/g, '').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw Error(`${name}: must start with front matter between --- lines`);
  return { data: parseYAML(match[1]) ?? {}, body: match[2].trim() };
}

/**
 * The level-two headings of a case study must be template sections, in template order.
 */
export function checkCaseStudy(body, name) {
  const headings = [...body.matchAll(/^## (.+?)\s*$/gm)].map((m) => m[1]);
  let last = -1;
  for (const heading of headings) {
    const index = CASE_STUDY_SECTIONS.indexOf(heading);
    if (index === -1) throw Error(`${name}: "## ${heading}" is not a case study section (${CASE_STUDY_SECTIONS.join(', ')})`);
    if (index <= last) throw Error(`${name}: "## ${heading}" is out of order or repeated`);
    last = index;
  }
  return headings;
}

async function loadProjects() {
  const directory = new URL('projects/', CONTENT);
  const files = (await readdir(directory)).filter((file) => file.endsWith('.md')).sort();
  assert.ok(files.length <= MAX_PROJECTS, `content/projects holds more than ${MAX_PROJECTS} projects`);
  const projects = [];
  for (const file of files) {
    const name = 'content/projects/' + file;
    const slug = file.slice(0, -3);
    if (!SLUG.test(slug)) throw Error(`${name}: file name must be a lowercase slug`);
    const { data, body } = splitFrontMatter(await readFile(new URL(file, directory), 'utf8'), name);
    const project = check(projectSchema, data, name);
    checkCaseStudy(body, name);
    projects.push({ ...project, slug, body });
  }
  const featured = projects.filter((p) => p.featured).map((p) => p.featured);
  if (new Set(featured).size !== featured.length) throw Error('content/projects: two projects share a featured position');
  return projects.sort((a, b) => (a.featured ?? 99) - (b.featured ?? 99) || a.title.localeCompare(b.title));
}

/**
 * Load and validate every content file. The build calls this once and passes the result to the page renderers.
 */
export async function loadContent() {
  const [site, timeline, talks, now, shipped, library, projects] = await Promise.all([
    readJSON('site.json', siteSchema),
    readJSON('timeline.json', z.array(roleSchema).min(1)),
    readJSON('talks.json', z.array(talkSchema)),
    readJSON('now.json', nowSchema),
    readJSON('shipped.json', z.array(shippedSchema).max(200)),
    readJSON('library.json', z.array(librarySchema).max(200)),
    loadProjects(),
  ]);
  return { site, timeline, talks, now, shipped, library, projects };
}
