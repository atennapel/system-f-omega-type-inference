import { VarName, Term, showTerm } from './terms';
import { VType, TVals, vquote, veval, freshTVar, VTVar, matchVTFun, prune, vnormalform } from './vtypes';
import { List, Nil, lookup, extend } from './list';
import { TEnv, subsume, TBound, newTMeta, unify } from './unification';
import { Type, resetTMetaId, showType, TFun } from './types';
import { terr } from './util';

export type Env = List<[VarName, VType]>;
export interface Envs {
  readonly env: Env;
  readonly tenv: TEnv;
  readonly tvals: TVals;
}
export const emptyEnvs: Envs = { env: Nil, tenv: Nil, tvals: Nil };

export const showQType = (e: Envs, t: VType): string =>
  showType(vquote(e.tvals, t));

export const check = (es: Envs, t: Term, ty: VType): void => {
  console.log(`check ${showTerm(t)} : ${showQType(es, ty)}`);
  if (ty.tag === 'VTForall') {
    const x = freshTVar(es.tvals, ty.name);
    const vx = VTVar(x);
    return check({
      env: es.env,
      tenv: extend(x, TBound, es.tenv),
      tvals: extend(x, vx, es.tvals),
    }, t, ty.body(vx));
  }
  const m = matchVTFun(ty);
  if (m && t.tag === 'Abs') {
    return check({
      env: extend(t.name, m[0], es.env),
      tenv: es.tenv,
      tvals: es.tvals,
    }, t.body, m[1]);
  }
  if (t.tag === 'Abs' && ty.tag === 'VTNeutral' && ty.head.tag === 'TMeta') {
    const m1 = newTMeta(es.tenv);
    const m2 = newTMeta(es.tenv);
    const ty2 = veval(es.tvals, TFun(m1, m2));
    unify(es.tvals, ty, ty2);
    return;
  }
  const ty2 = synth(es, t);
  subsume(es.tenv, es.tvals, ty2, ty);
};

export const synth = (es: Envs, t: Term): VType => {
  console.log(`synth ${showTerm(t)}`);
  if (t.tag === 'Var') {
    const ty = lookup(es.env, t.name);
    if (!ty) return terr(`undefined var ${t.name}`);
    return ty;
  }
  if (t.tag === 'Abs') {
    const m1 = newTMeta(es.tenv);
    const m2 = newTMeta(es.tenv);
    const tf = veval(es.tvals, TFun(m1, m2));
    check(es, t, tf);
    return tf;
  }
  if (t.tag === 'App') {
    const tf = synth(es, t.left);
    return synthapp(es, tf, t.right);
  }
  if (t.tag === 'Ann') {
    const vt = veval(es.tvals, t.type);
    check(es, t.term, vt);
    return vt;
  }
  return terr(`cannot synth ${showTerm(t)}`);
};

export const synthapp = (es: Envs, ty: VType, t: Term): VType => {
  console.log(`check ${showQType(es, ty)} @ ${showTerm(t)}`);
  if (ty.tag === 'VTForall') {
    const m = newTMeta(es.tenv);
    const em = veval(es.tvals, m);
    const x = freshTVar(es.tvals, ty.name);
    return synthapp({
      env: es.env,
      tenv: extend(x, TBound, es.tenv),
      tvals: extend(x, em, es.tvals),
    }, ty.body(em), t);
  }
  const m = matchVTFun(ty);
  if (m) {
    check(es, t, m[0]);
    return m[1];
  }
  if (ty.tag === 'VTNeutral' && ty.head.tag === 'TMeta') {
    const m1 = newTMeta(es.tenv);
    const m2 = newTMeta(es.tenv);
    const ty2 = veval(es.tvals, TFun(m1, m2));
    unify(es.tvals, ty, ty2);
    check(es, t, veval(es.tvals, m1));
    return veval(es.tvals, m2);
  }
  return terr(`cannot synthapp ${showQType(es, ty)} @ ${showTerm(t)}`);
};

const initialEnvs: Envs = {
  env: Nil,
  tenv: extend('->', TBound, Nil),
  tvals: extend('->', Nil, Nil),
};

export const infer = (t: Term, es: Envs = initialEnvs): Type => {
  resetTMetaId();
  const vt = synth(es, t);
  const qt = vquote(es.tvals, vt);
  const pt = prune(es.tvals, qt);
  return vnormalform(es.tvals, pt);
};
