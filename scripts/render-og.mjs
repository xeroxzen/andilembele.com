import {writeFile} from 'node:fs/promises';
import {renderSiteCard} from '../components/og-image.mjs';
// Repaints the shared card's text in place. Rerun after a role change, then bump the ?v= in components/social-meta.mjs.
const png=await renderSiteCard({role:'Software Engineer',focus:'Backend · AI Agents · Data · Infrastructure'});
await writeFile(new URL('../dist/assets/andile-opengraph.png',import.meta.url),png);
console.log(`Rendered shared card (${png.length} bytes).`);
