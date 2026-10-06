const messages:Record<string,string>={
 UNGROUNDED_QUOTE:'The generated answer failed exact-quotation validation. No verdict was saved. This is an execution failure, not evidence that your claim is false.',
 UNGROUNDED_VERDICT:'The generated answer did not provide the evidence required for its verdict. No verdict was saved.',
 MODEL_OUTPUT_INVALID:'The generated answer did not match the required result format. No verdict was saved.',
 SOURCE_ACCESS_FAILED:'The contract could not read any usable source pages. No verdict was saved.',
};
export const genericExecutionError='GenLayer execution failed before a fact-check verdict was saved.';
export function executionErrorMessage(code?:unknown):string {
 return typeof code==='string'&&Object.hasOwn(messages,code)?messages[code]:genericExecutionError;
}
export function isExecutionErrorMessage(value?:string):boolean {
 return value===genericExecutionError||Object.values(messages).includes(value||'');
}
