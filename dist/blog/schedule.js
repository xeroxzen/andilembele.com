export const PUBLISH_AT=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
export const isDue=(post,now)=>post.status==='scheduled'&&PUBLISH_AT.test(post.publishAt)&&Date.parse(post.publishAt)<=now;
const pad=n=>String(n).padStart(2,'0');
const localDay=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
export function toLocalInput(iso){if(!PUBLISH_AT.test(iso||''))return '';const d=new Date(iso);return `${localDay(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;}
export function fromLocalInput(value){const d=new Date(value);return value&&!isNaN(d)?d.toISOString():'';}
export const localDate=iso=>localDay(new Date(iso));
