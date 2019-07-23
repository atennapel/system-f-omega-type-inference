import { Type, showType } from './types';
import { impossible } from './util';

export type Term
  = Var
  | Abs
  | App
  | Ann;

export type VarName = string;
export interface Var {
  readonly tag: 'Var';
  readonly name: VarName;
}
export const Var = (name: VarName): Var =>
  ({ tag: 'Var', name });

export interface App {
  readonly tag: 'App';
  readonly left: Term;
  readonly right: Term;
}
export const App = (left: Term, right: Term): App =>
  ({ tag: 'App', left, right });
export const appFrom = (ts: Term[]) => ts.reduce(App);
export const app = (...ts: Term[]) => appFrom(ts);
export const foldApp = (t: Term, ts: Term[]) => ts.reduce(App, t);
export const unfoldApp = (t: Term): [Term, Term[]] => {
  const ts: Term[] = [];
  while (t.tag === 'App') {
    ts.push(t.right);
    t = t.left;
  }
  return [t, ts.reverse()];
};

export interface Abs {
  readonly tag: 'Abs';
  readonly name: VarName;
  readonly body: Term;
}
export const Abs = (name: VarName, body: Term): Abs =>
  ({ tag: 'Abs', name, body });
export const abs = (ns: VarName[], body: Term) =>
  ns.reduceRight((x, y) => Abs(y, x), body);
export const unfoldAbs = (t: Term): [VarName[], Term] => {
  const ns: VarName[] = [];
  while (t.tag === 'Abs') {
    ns.push(t.name);
    t = t.body;
  }
  return [ns, t];
};

export interface Ann {
  readonly tag: 'Ann';
  readonly term: Term;
  readonly type: Type;
}
export const Ann = (term: Term, type: Type): Ann =>
  ({ tag: 'Ann', term, type });

export const showTermParen = (b: boolean, t: Term): string =>
  b ? `(${showTerm(t)})` : showTerm(t);
export const showTerm = (t: Term): string => {
  if (t.tag === 'Var') return t.name;
  if (t.tag === 'Abs') {
    const [xs, b] = unfoldAbs(t);
    return `\\${xs.join(' ')}. ${showTermParen(b.tag === 'Ann', b)}`;
  }
  if (t.tag === 'App') {
    const [f, as] = unfoldApp(t);
    return as.length === 0 ? showTerm(f) :
      `${showTermParen(f.tag !== 'Var', f)} ${as.map(t => showTermParen(t.tag !== 'Var', t)).join(' ')}`;
  }
  if (t.tag === 'Ann')
    return `${showTerm(t.term)} : ${showType(t.type)}`;
  return impossible('showTerm');
};
