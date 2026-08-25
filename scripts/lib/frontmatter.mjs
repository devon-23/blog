import { readFileSync, writeFileSync } from 'node:fs';
import YAML from 'yaml';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function readFrontmatter(path) {
  const raw = readFileSync(path, 'utf-8');
  const match = raw.match(FRONTMATTER_RE);
  if (!match) throw new Error(`No frontmatter found in ${path}`);
  return { data: YAML.parse(match[1]) ?? {}, body: match[2] ?? '' };
}

export function writeFrontmatter(path, data, body = '') {
  const yamlText = YAML.stringify(data).trimEnd();
  writeFileSync(path, `---\n${yamlText}\n---\n${body}`);
}
