import { Name } from './names';
import { Type, showType } from './types';
import { Kind, showKind } from './kinds';

export type Term
  = { tag: 'Var', name: Name }
  | { tag: 'Abs', name: Name, type: Type | null, body: Term }
  | { tag: 'App', left: Term, right: Term }
  | { tag: 'AbsT', name: Name, kind: Kind, body: Term }
  | { tag: 'AppT', left: Term, right: Type } 
  | { tag: 'Let', name: Name, val: Term, body: Term }
  | { tag: 'Ann', term: Term, type: Type };

export const Var = (name: Name): Term =>
  ({ tag: 'Var', name });
export const Abs = (name: Name, type: Type | null, body: Term): Term =>
  ({ tag: 'Abs', name, type, body });
export const App = (left: Term, right: Term): Term =>
  ({ tag: 'App', left, right });
export const AbsT = (name: Name, kind: Kind, body: Term): Term =>
  ({ tag: 'AbsT', name, kind, body });
export const AppT = (left: Term, right: Type): Term =>
  ({ tag: 'AppT', left, right });
export const Let = (name: Name, val: Term, body: Term): Term =>
  ({ tag: 'Let', name, val, body });
export const Ann = (term: Term, type: Type): Term =>
  ({ tag: 'Ann', term, type });

export const showTerm = (t: Term): string => {
  if (t.tag === 'Var') return t.name;
  if (t.tag === 'Abs')
    return t.type ? `(\\(${t.name} : ${showType(t.type)}). ${showTerm(t.body)})` :
      `(\\${t.name}. ${showTerm(t.body)})`;
  if (t.tag === 'App') return `(${showTerm(t.left)} ${showTerm(t.right)})`;
  if (t.tag === 'AbsT') return `(\\(${t.name} : ${showKind(t.kind)}). ${showTerm(t.body)})`;
  if (t.tag === 'AppT') return `(${showTerm(t.left)} -> ${showType(t.right)})`;
  if (t.tag === 'Let')
    return `(let ${t.name} = ${showTerm(t.val)} in ${showTerm(t.body)})`;
  if (t.tag === 'Ann')
    return `(${showTerm(t.term)} : ${showType(t.type)})`;
  return t;
};
