// Keep the original claim, but search both entities in a comparison independently.
export function discoveryQueries(claim:string):string[] {
 const value=claim.trim();
 const comparison=value.match(/^(.{1,80}?)\s+(?:has|have|is|are|was|were)\b.{0,140}?\b(?:than|versus|vs\.?)\s+(.{1,80}?)[.!?]?$/i)
  ||value.match(/^(?:is|are|was|were|has|have)\s+(.{1,80}?)\s+(?:more|less|stronger|larger|bigger|smaller|better)\b.{0,100}?\bthan\s+(.{1,80}?)[.!?]?$/i);
 return [...new Set(comparison?[comparison[1].trim(),comparison[2].trim(),value]:[value])].map(query=>query.slice(0,350));
}
