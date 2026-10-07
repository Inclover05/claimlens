import test from 'node:test';
import assert from 'node:assert/strict';
import {claimGuidance,validateClaim} from '../lib/domain.ts';
test('ambiguous comparisons require a measure before a paid check',()=>{
 for(const claim of ['is russia more powerful than usa','France is larger than Japan.','Is one team stronger than the other?'])assert.ok(claimGuidance(claim));
 assert.throws(()=>validateClaim('is russia more powerful than usa',''),/Define the comparison/);
});
test('measured comparisons, factual claims and opinion classification remain possible',()=>{
 for(const claim of ['Russia had a larger GDP than the USA in 2023.','France has a larger land area than Japan.','Neymar has scored more career goals than CR7 as of 2026-10-07.','Chocolate tastes better than vanilla.','The Moon produces its own visible light.'])assert.equal(claimGuidance(claim),null,claim);
});
