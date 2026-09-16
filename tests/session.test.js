import test from 'node:test';
import assert from 'node:assert/strict';
import {KEY, fresh, decode, day, begin, active, remaining, pause, resume, stop, bookmark, destination, chooseStorage} from '../docs/session-core.js';
const now = new Date(2026,8,16,12).getTime();
const running = () => begin(fresh(),15,true,now);
test('a session requires adult approval and a bounded integer duration',()=>{
 for (const n of [0,-1,121,1.5,NaN,Infinity]) assert.throws(()=>begin(fresh(),n,true,now));
 assert.throws(()=>begin(fresh(),15,false,now));
 assert.equal(remaining(begin(fresh(),1,true,now),now),60000);
});
test('refresh retains the original deadline rather than restarting the timer',()=>{
 const restored=decode(JSON.stringify(running()));
 assert.equal(remaining(restored,now+300000),600000);
 assert.ok(active(restored,now+300000));
});
test('elapsed time includes inactive tabs and closed-browser time',()=>{
 const s=running();assert.equal(remaining(s,now+900001),0);assert.equal(active(s,now+900001),false);
});
test('an intentional pause freezes time until adult-approved resume',()=>{
 const s=pause(running(),now+300000);
 assert.equal(remaining(s,now+600000),600000);
 assert.equal(active(s,now+600000),false);
 assert.throws(()=>resume(s,false,0,now+600000));
 resume(s,true,0,now+600000);
 assert.equal(remaining(s,now+660000),540000);
});
test('expired sessions need an explicit extension, which adds only the chosen time',()=>{
 const s=pause(running(),now+900001);
 assert.throws(()=>resume(s,true,0,now+900001));
 resume(s,true,5,now+900001);
 assert.equal(remaining(s,now+900001),300000);
});
test('ending a session preserves the reading place but ends approval',()=>{
 const s=bookmark(running(),'story','game');stop(s);
 assert.equal(active(s,now),false);assert.equal(s.progress.story.section,'game');
 assert.throws(()=>resume(s,true,5,now));
});
test('new calendar days require a fresh check-in, even when paused',()=>{
 const s=pause(running(),now+1000);const tomorrow=now+86400000;
 assert.notEqual(day(now),day(tomorrow));assert.equal(remaining(s,tomorrow),0);
 assert.throws(()=>resume(s,true,5,tomorrow));
 assert.equal(active(begin(s,10,true,tomorrow),tomorrow),true);
});
test('bookmarks only accept known content and section identifiers',()=>{
 const s=fresh();bookmark(s,'activity','step-3');bookmark(s,'story','unknown');bookmark(s,'__proto__','polluted');
 assert.deepEqual(s.progress,{activity:{section:'step-3'}});
 assert.equal(destination('activity',s),'/wonderabouts/activities/find-another-route/#step-3');
 assert.equal(destination('https://evil.example',s),destination('activity',s));
});
test('corrupt, old, and structurally invalid stored data do not unlock content',()=>{
 for (const raw of ['bad json','null','[]','{}','{"version":0}','{"version":1,"session":{"status":"active"}}']) assert.deepEqual(decode(raw),fresh());
});
test('stored content cannot inject links and unknown personal fields are discarded',()=>{
 const s=decode(JSON.stringify({...running(),answers:['private'],progress:{story:{section:'https://evil.example'}},last:'__proto__'}));
 assert.equal(s.answers,undefined);assert.deepEqual(s.progress,{});assert.equal(s.last,'story');
});
test('clock rollback does not give more than the session budget',()=>assert.equal(remaining(running(),now-10000),900000));
test('storage fallback supports blocked persistent storage without a crash',()=>{
 const memory=new Map();const storage={setItem:(k,v)=>memory.set(k,v),getItem:k=>memory.get(k),removeItem:k=>memory.delete(k)};
 const host={get localStorage(){throw new Error('Blocked')},sessionStorage:storage};
 const result=chooseStorage(host);assert.equal(result.mode,'tab');assert.equal(result.storage,storage);assert.equal(memory.size,0);
 assert.equal(chooseStorage({get localStorage(){throw 0},get sessionStorage(){throw 0}}).mode,'none');
});
test('a new check-in resets timing but preserves both story and activity places',()=>{
 const s=running();bookmark(s,'story','reflection');bookmark(s,'activity','step-4');stop(s);begin(s,20,true,now+10000);
 assert.equal(s.minutes,20);assert.equal(s.progress.story.section,'reflection');assert.equal(s.progress.activity.section,'step-4');
 assert.equal(remaining(s,now+10000),1200000);assert.equal(s.answers,undefined);
});
test('invalid extension amounts are rejected',()=>{
 for (const amount of [-1,121,0.5,NaN]) assert.throws(()=>resume(pause(running(),now),true,amount,now));
});
