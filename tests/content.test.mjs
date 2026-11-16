import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadContent,splitFrontMatter,checkCaseStudy,CASE_STUDY_SECTIONS} from '../lib/content.mjs';

test('content files load and validate',async()=>{
 const {site,projects,timeline,talks,now}=await loadContent();
 assert.equal(site.principles.length,3);
 assert.ok(site.openTo.length>=1);
 assert.equal(projects.filter(p=>p.featured).length,4);
 assert.deepEqual(projects.slice(0,4).map(p=>p.slug),['echofind','vaip-netscout-rs','ferrite','tracegraph']);
 assert.ok(timeline.length>0&&talks.length>0&&now.building.length>0);
});

test('front matter is required and case study sections follow the template order',()=>{
 assert.throws(()=>splitFrontMatter('# No front matter','x.md'),/front matter/);
 assert.deepEqual(splitFrontMatter('---\ntitle: A\n---\nBody','x.md'),{data:{title:'A'},body:'Body'});
 assert.deepEqual(checkCaseStudy('## Problem\ntext\n### Detail\n## Impact\n','x.md'),['Problem','Impact']);
 assert.throws(()=>checkCaseStudy('## Impact\n## Problem\n','x.md'),/out of order/);
 assert.throws(()=>checkCaseStudy('## Background\n','x.md'),/not a case study section/);
 assert.equal(CASE_STUDY_SECTIONS.length,6);
});

test('shipped entries and the bookshelf validate and stay newest-first friendly',async()=>{
 const {shipped,library,projects}=await loadContent();
 assert.ok(shipped.length>0&&library.length>0);
 for(const entry of shipped)if(entry.href.startsWith('/projects/'))assert.ok(projects.some(p=>entry.href===`/projects/${p.slug}/`),entry.href);
 assert.equal(new Set(library.map(b=>b.title)).size,library.length,'duplicate bookshelf title');
});

test('a project year is a single year or a span ending later, or at Present',async()=>{
 const {projects}=await loadContent();
 const year=slug=>projects.find(p=>p.slug===slug).year;
 assert.equal(year('project-atlas'),'2024–2026');
 assert.equal(year('lumina'),'2023–Present');
 assert.equal(year('ferrite'),2026);
});
