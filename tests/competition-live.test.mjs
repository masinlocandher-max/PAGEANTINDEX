import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {join,resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=(path)=>readFile(join(root,path),"utf8");

test("competition-critical routes no longer load the prototype experience bundle",async()=>{
  for(const path of ["vote/index.html","tickets/index.html","judge/index.html","tabulation/index.html","event/index.html"]){
    const html=await read(path);
    assert.doesNotMatch(html,/public\/experience\.js/,`${path} still loads prototype experience.js`);
    assert.doesNotMatch(html,/Front-end .*journey|preview/i,`${path} still advertises a preview state`);
  }
});

test("live competition scripts contain no sample candidates or invented metrics",async()=>{
  const content=(await Promise.all(["public/live-vote.js","public/live-commerce.js","public/live-judge.js","public/live-tabulation.js","public/live-event.js"].map(read))).join("\n");
  assert.doesNotMatch(content,/Candidate 0[1-9]|Delegation 0[1-9]|sample vote|demo vote|fake vote/i);
  assert.match(content,/No public voting event is open yet/);
  assert.match(content,/No .*offers are public yet/);
  assert.match(content,/No active judge assignments/);
});
