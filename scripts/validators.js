export const patterns = {
  description: /^\S(?:.*\S)?$/,
  amount: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
  date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  category: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
  duplicateWords: /\b(\w+)\s+\1\b/i
};

export function validateRecord(rec){
  const errs = [];
  if(!patterns.description.test(rec.description)) errs.push('Description invalid');
  if(!patterns.amount.test(String(rec.amount))) errs.push('Amount invalid');
  if(!patterns.date.test(rec.date)) errs.push('Date invalid');
  if(!patterns.category.test(rec.category)) errs.push('Category invalid');
  if(patterns.duplicateWords.test(rec.description)) errs.push('Duplicate word found in description');
  return errs;
}