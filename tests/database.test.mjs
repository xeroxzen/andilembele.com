import {test} from 'node:test';
import assert from 'node:assert/strict';
import {databaseView,tagSlug} from '../components/database.mjs';
import {logMonths} from '../components/pages.mjs';
import {readState,writeState,itemMatches} from '../src/client/database.js';

const item=(title,tags,group)=>({title,href:'/projects/'+tagSlug(title)+'/',icon:'X',cover:'gray',summary:'S',tags,group,cells:{a:'<b>v</b>'},props:''});
const config={id:'test',label:'Test',titleLabel:'Name',noun:['item','items'],columns:[{key:'a',label:'A'}],views:['table','gallery','board'],defaultView:'table',groups:['Active','No status'],emptyGroup:'No status',filters:['Rust','OPA/Rego'],filterLabel:'Filter'};

test('a database renders every view with the same filterable items',()=>{
 const html=databaseView(config,[item('One',['Rust'],'Active'),item('Two',['OPA/Rego'])]);
 assert.equal((html.match(/data-item /g)||[]).length,6,'two items in three views');
 assert.match(html,/data-view="table">/);
 assert.match(html,/data-view="gallery" hidden>/);
 assert.match(html,/data-filter="opa-rego"/);
 assert.match(html,/<h3 class="board-title">No status <span class="board-count">1<\/span>/);
 assert.match(html,/2 items/);
 assert.throws(()=>databaseView({...config,defaultView:'list'},[]));
 assert.throws(()=>databaseView({...config,filters:['A b','A-b']},[]),/share a slug/);
});

test('view and tag state round-trips through the URL and ignores unknown values',()=>{
 assert.deepEqual(readState('?view=board&tag=rust',['table','board'],['rust']),{view:'board',tag:'rust'});
 assert.deepEqual(readState('?view=evil&tag=<x>',['table'],['rust']),{view:null,tag:''});
 assert.equal(writeState('?utm=1',{view:'table',tag:''},'table'),'?utm=1');
 assert.equal(writeState('',{view:'board',tag:'go'},'table'),'?view=board&tag=go');
 assert.equal(itemMatches('rust go','go'),true);
 assert.equal(itemMatches('rust','go'),false);
 assert.equal(itemMatches('rust',''),true);
});

test('a calendar view places each item in its month and marks dated items on their day',()=>{
 const items=[{...item('Day',['Rust']),date:'2026-11-15'},{...item('Month',['Go']),date:'2026-10'}];
 const html=databaseView({...config,id:'log',stateKey:'log-',views:['calendar','table'],defaultView:'calendar',months:['2026-11','2026-10','2026-09'],today:'2026-11-16'},items);
 assert.match(html,/data-state-key="log-"/);
 assert.match(html,/<section class="calendar-month is-current" aria-labelledby="log-2026-11"><h3 class="calendar-title" id="log-2026-11">November <span>2026<\/span>/);
 // November 2026 starts on a Sunday: six blank cells after the weekday row in a Monday-first grid.
 assert.match(html,/<span class="calendar-weekday">S<\/span>(<span><\/span>){6}<span class="calendar-day">1<\/span>/);
 assert.match(html,/<span class="calendar-day has-marks">15<span class="calendar-marks"><i class="calendar-mark cover-gray" data-mark data-tags="rust"><\/i>/);
 assert.match(html,/<span class="calendar-day is-today">16<\/span>/);
 assert.match(html,/<span class="calendar-undated">Month<\/span>/);
 assert.match(html,/aria-labelledby="log-2026-09">[\s\S]*?<ol class="calendar-items"><\/ol><p class="calendar-none">/);
 assert.throws(()=>databaseView({...config,stateKey:'Log'},[]),/stateKey/);
});

test('two databases on one page keep separate URL state',()=>{
 assert.deepEqual(readState('?tag=rust&log-tag=security&log-view=table',['calendar','table'],['security'],'log-'),{view:'table',tag:'security'});
 assert.equal(writeState('?tag=rust',{view:'calendar',tag:'ai'},'calendar','log-'),'?tag=rust&log-tag=ai');
});

test('the shipping log runs from this month back to the oldest entry, at most a year',()=>{
 assert.deepEqual(logMonths('2026-11-16',['2026-09-13','2026-10']),['2026-11','2026-10','2026-09']);
 assert.deepEqual(logMonths('2026-02-01',['2026-02-01']),['2026-02']);
 assert.equal(logMonths('2026-11-16',['2020-01-01']).length,12);
 assert.deepEqual(logMonths('2027-01-05',['2026-12-30']),['2027-01','2026-12']);
});
