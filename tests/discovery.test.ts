import test from 'node:test';
import assert from 'node:assert/strict';
import {discoveryQueries} from '../lib/discovery-queries.ts';

test('comparisons search both entities as well as the complete claim',()=>{
 assert.deepEqual(discoveryQueries('neymar has scored more goals than CR7'),['neymar','CR7','neymar has scored more goals than CR7']);
 assert.deepEqual(discoveryQueries('France is larger than Japan.'),['France','Japan','France is larger than Japan.']);
});

test('ordinary claims and their assertions remain intact during discovery',()=>{
 const claim="The Moon is Earth's only natural satellite.";
 assert.deepEqual(discoveryQueries(claim),[claim]);
 assert.deepEqual(discoveryQueries('Argentina won the 2022 FIFA World Cup.'),['Argentina won the 2022 FIFA World Cup.']);
});
