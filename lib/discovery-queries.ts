// Keep the original claim, but search both entities in a comparison independently.
export function discoveryQueries(claim:string):string[] {
 const value=claim.trim();
 const searchable=value.replace(/^(?:as of|by|on)\s+[^,]{4,40},\s*/i,'');
 const comparison=searchable.match(/^(.{1,80}?)\s+(?:has|have|is|are|was|were)\b.{0,140}?\b(?:than|versus|vs\.?)\s+(.{1,80}?)[.!?]?$/i)
  ||searchable.match(/^(?:is|are|was|were|has|have)\s+(.{1,80}?)\s+(?:more|less|stronger|larger|bigger|smaller|better)\b.{0,100}?\bthan\s+(.{1,80}?)[.!?]?$/i);
 const entities=comparison?[comparison[1].trim(),comparison[2].trim().replace(/\s+(?:as of|by|in)\s+\d.*$/i,'')]:[];
 const football=/\b(?:football|soccer|neymar|ronaldo|cr7|messi)\b/i.test(value)&&/\bgoals\b/i.test(value);
 const queries=entities.map(entity=>{
  if(!football)return entity;
  const name=entity.replace(/\bCR7\b/ig,'Cristiano Ronaldo');
  if(/\binternational\b/i.test(value))return `List of international goals scored by ${name}`;
  return `${name} ${/\bclub\b/i.test(value)?'club':'career'} goals statistics`;
 });
 return [...new Set(comparison?[...queries,value]:[value])].map(query=>query.slice(0,350));
}
