import { VType, force, matchVTVar, showVType, TVals, vquote, veval, freshTVar, VTVar, vtapp2, eqVTHead } from './vtypes';
import { TVarName, TMeta, Type, tabs, showType, TVar, foldTApp, freshTMeta } from './types';
import { terr, impossible } from './util';
import { Nil, extend, List } from './list';
import { showQType } from './inference';

const checkSpine = (sp: VType[]): TVarName[] =>
  sp.map(x => {
    const f = force(x);
    const m = matchVTVar(f);
    if (m) return m.name;
    return terr(`non-variable in meta spine: ${showVType(f)}`);
  });

const checkSolution = (m: TMeta, sp: TVarName[], b: Type): void => {
  if (b.tag === 'TVar') {
    if (sp.indexOf(b.name) < 0)
      return terr(`scope error (${b.name}): (${showType(m)} ${sp.join(' ')}) ~ ${showType(b)}`);
    return;
  }
  if (b.tag === 'TMeta') {
    if (m === b)
      return terr(`occurs check failed: ${showType(m)}`);
    return;
  }
  if (b.tag === 'TApp') {
    checkSolution(m, sp, b.left);
    checkSolution(m, sp, b.right);
    return;
  }
  if (b.tag === 'TAbs')
    return checkSolution(m, sp.concat([b.name]), b.body);
  if (b.tag === 'TForall')
    return checkSolution(m, sp.concat([b.name]), b.body);
  return impossible('checkSolution');
};

const solve = (e: TVals, m: TMeta, sp_: VType[], b: VType): void => {
  const sp = checkSpine(sp_);
  const qb = vquote(e, b);
  checkSolution(m, sp, qb);
  const sol = veval(Nil, tabs(sp, qb));
  m.type = sol;
};

export const unify = (e: TVals, a_: VType, b_: VType): void => {
  const a = force(a_);
  const b = force(b_);
  console.log(`unify ${showType(vquote(e, a))} ~ ${showType(vquote(e, b))}`);
  if (a.tag === 'VTAbs' && b.tag === 'VTAbs') {
    const x = freshTVar(e, a.name);
    const vx = VTVar(x);
    return unify(extend(x, Nil, e), a.body(vx), b.body(vx));
  }
  if (a.tag === 'VTAbs') {
    const x = freshTVar(e, a.name);
    const vx = VTVar(x);
    return unify(extend(x, Nil, e), a.body(vx), vtapp2(b, vx));
  }
  if (b.tag === 'VTAbs') {
    const x = freshTVar(e, b.name);
    const vx = VTVar(x);
    return unify(extend(x, Nil, e), vtapp2(a, vx), b.body(vx));
  }
  if (a.tag === 'VTForall' && b.tag === 'VTForall') {
    const x = freshTVar(e, a.name);
    const vx = VTVar(x);
    return unify(extend(x, Nil, e), a.body(vx), b.body(vx));
  }
  if (a.tag === 'VTNeutral' && b.tag === 'VTNeutral' && eqVTHead(a.head, b.head)) {
    const l = Math.min(a.args.length, b.args.length);
    for (let i = 0; i < l; i++) unify(e, a.args[i], b.args[i]);
    return;
  }
  if (a.tag === 'VTNeutral' && a.head.tag === 'TMeta')
    return solve(e, a.head, a.args, b);
  if (b.tag === 'VTNeutral' && b.head.tag === 'TMeta')
    return solve(e, b.head, b.args, a);
  return terr(`cannot unify ${showType(vquote(e, a))} ~ ${showType(vquote(e, b))}`);
};

export type TEntry = TBound | TDef;
export type TEnv = List<[TVarName, TEntry]>;

export interface TBound {
  readonly tag: 'TBound';
}
export const TBound: TBound = { tag: 'TBound' };

export interface TDef {
  readonly tag: 'TDef';
  readonly type: VType;
}
export const TDef = (type: VType): TDef => ({ tag: 'TDef', type });

export const newTMeta = (e: TEnv): Type => {
  const a: TVar[] = [];
  while (e.tag === 'Cons') {
    if (e.head[1].tag === 'TBound') a.push(TVar(e.head[0]));
    e = e.tail;
  }
  return foldTApp(freshTMeta(), a);
};

export const subsume = (te: TEnv, e: TVals, a: VType, b: VType): void => {
  console.log(`subsume ${showType(vquote(e, a))} <: ${showType(vquote(e, b))}`);
  if (b.tag === 'VTForall') {
    const x = freshTVar(e, b.name);
    const vx = VTVar(x);
    return subsume(extend(x, TBound, te), extend(x, vx, e), a, b.body(vx));
  }
  if (a.tag === 'VTForall') {
    const m = newTMeta(te);
    const em = veval(e, m);
    const x = freshTVar(e, a.name);
    return subsume(extend(x, TDef(em), te), extend(x, em, e), a.body(em), b);
  }
  unify(e, a, b);
};
