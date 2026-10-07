import test from 'node:test';
import assert from 'node:assert/strict';
import {discoveryQueries} from '../lib/discovery-queries.ts';
import {discover} from '../lib/discovery.ts';
import {runWithRuntime,type RuntimeEnv} from '../lib/runtime.ts';

test('comparisons search both entities as well as the complete claim',()=>{
 assert.deepEqual(discoveryQueries('neymar has scored more goals than CR7'),['neymar career goals statistics','Cristiano Ronaldo career goals statistics','neymar has scored more goals than CR7']);
 assert.deepEqual(discoveryQueries('France is larger than Japan.'),['France','Japan','France is larger than Japan.']);
});

test('football comparisons seek matching records without changing the submitted statement',()=>{
 const claim='As of 7 October 2026, Cristiano Ronaldo has scored more senior international goals than Neymar.';
 assert.deepEqual(discoveryQueries(claim),['List of international goals scored by Cristiano Ronaldo','List of international goals scored by Neymar',claim]);
 const club='Neymar has scored more club goals than CR7 as of 2026-10-07.';
 assert.deepEqual(discoveryQueries(club),['Neymar club goals statistics','Cristiano Ronaldo club goals statistics',club]);
});

test('ordinary claims and their assertions remain intact during discovery',()=>{
 const claim="The Moon is Earth's only natural satellite.";
 assert.deepEqual(discoveryQueries(claim),[claim]);
 assert.deepEqual(discoveryQueries('Argentina won the 2022 FIFA World Cup.'),['Argentina won the 2022 FIFA World Cup.']);
});

test('both search providers reserve evidence for each comparison entity and keep the supplied source',async()=>{
 const original=globalThis.fetch;
 try{
  for(const key of [undefined,'fixture-key']){
   const queries:string[]=[];
   globalThis.fetch=async input=>{
    const url=new URL(String(input));
    const query=url.searchParams.get(key?'q':'srsearch')!;queries.push(query);
    const name=query==='France'?'France':query==='Japan'?'Japan':'Comparison';
    return Response.json(key?{web:{results:[{url:`https://en.wikipedia.org/wiki/${name}`},{url:'https://127.0.0.1'},{url:'https://en.wikipedia.org/wiki/Duplicate'}]}}:{query:{search:[{title:name},{title:'Duplicate'}]}});
   };
   const result=await runWithRuntime({BRAVE_SEARCH_API_KEY:key} as RuntimeEnv,()=>discover('France is larger than Japan.','https://www.nasa.gov/'));
   assert.deepEqual(queries,['France','Japan','France is larger than Japan.']);
   assert.deepEqual(result.urls,['https://www.nasa.gov/','https://en.wikipedia.org/wiki/France','https://en.wikipedia.org/wiki/Japan','https://en.wikipedia.org/wiki/Comparison']);
  }
 }finally{globalThis.fetch=original;}
});

test('search outage and malformed search output fall back without losing the user source',async()=>{
 const original=globalThis.fetch;
 try{
  for(const failure of ['http','json','unsafe']){
   globalThis.fetch=async input=>{
    if(String(input).includes('brave.com'))return failure==='http'?new Response('',{status:503}):failure==='json'?new Response('not json'):Response.json({web:{results:[{url:'http://127.0.0.1'}]}});
    return Response.json({query:{search:[{title:'Moon'},{title:'Moon'}]}});
   };
   const result=await runWithRuntime({BRAVE_SEARCH_API_KEY:'fixture-key'} as RuntimeEnv,()=>discover('The Moon is a satellite.','https://www.nasa.gov/'));
   assert.deepEqual(result,{urls:['https://www.nasa.gov/','https://en.wikipedia.org/wiki/Moon'],limited:true});
  }
  globalThis.fetch=async()=>{throw new Error('offline');};
  assert.deepEqual(await runWithRuntime({} as RuntimeEnv,()=>discover('The Moon is a satellite.','https://www.nasa.gov/')),{urls:['https://www.nasa.gov/'],limited:true});
 }finally{globalThis.fetch=original;}
});
