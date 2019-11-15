import { TVar, TMeta, showType, Type, TFun, TForall, TApp } from './types';
import { List, toString, Nil, foldr, Cons, lookup } from './list';
import { Name, freshName } from './names';
import { impossible } from './util';

export type Head = TVar | TMeta;
export type TClos = (val: TVal) => TVal;
export type TVal
  = { tag: 'VTNe', head: Head, args: List<TVal> }
  | { tag: 'VTFun', left: TVal, right: TVal }
  | { tag: 'VTForall', name: Name, body: TClos };

export type TEnvV = List<[Name, TVal | true]>;
export const showEnvV = (l: TEnvV): string =>
  toString(l, ([x, b]) => b === true ? x : `${x} = ${showType(quote(b, l))}`);

export const VTNe = (head: Head, args: List<TVal> = Nil): TVal =>
  ({ tag: 'VTNe', head, args });
export const VTFun = (left: TVal, right: TVal): TVal =>
  ({ tag: 'VTFun', left, right });
export const VTForall = (name: Name, body: TClos): TVal =>
  ({ tag: 'VTForall', name, body});

export const VVar = (name: Name): TVal => VTNe(TVar(name));
export const force = (v: TVal): TVal => {
  if (v.tag === 'VTNe' && v.head.tag === 'TMeta' && v.head.tval)
    return force(foldr((x, y) => vtapp(y, x), v.head.tval, v.args));
  return v;
};

export const vtapp = (a: TVal, b: TVal): TVal => {
  if (a.tag === 'VTNe') return VTNe(a.head, Cons(b, a.args));
  return impossible('vapp');
};

export const evaluate = (t: Type, vs: TEnvV = Nil): TVal => {
  if (t.tag === 'TVar') {
    const v = lookup(vs, t.name);
    return v === true ? VVar(t.name) : v !== null ? v : impossible(`evaluate ${t.name}`)
  }
  if (t.tag === 'TApp')
    return vtapp(evaluate(t.left, vs), evaluate(t.right, vs));
  if (t.tag === 'TFun')
    return VTFun(evaluate(t.left, vs), evaluate(t.right, vs));
  if (t.tag === 'TForall')
    return VTForall(t.name, v => evaluate(t.body, Cons([t.name, v], vs)));
  if (t.tag === 'TMeta')
    return t.tval || VTNe(t);
  return impossible('evaluate');
};

export const quote = (v_: TVal, vs: TEnvV = Nil): Type => {
  const v = force(v_);
  if (v.tag === 'VTNe')
    return foldr(
      (x, y) => TApp(y, quote(x, vs)),
      v.head as Type,
      v.args,
    );
  if (v.tag === 'VTFun')
    return TFun(quote(v.left, vs), quote(v.right, vs));
  if (v.tag === 'VTForall') {
    const x = freshName(vs, v.name);
    return TForall(x, quote(v.body(VVar(x)), Cons([x, true], vs)));
  }
  return v;
};

type S = [false, TVal] | [true, Type];
const zonkSpine = (vs: TEnvV, tm: Type): S => {
  if (tm.tag === 'TMeta' && tm.tval) return [false, tm.tval];
  if (tm.tag === 'TApp') {
    const spine = zonkSpine(vs, tm.left);
    return spine[0] ?
      [true, TApp(spine[1], zonk(vs, tm.right))] :
      [false, vtapp(spine[1], evaluate(tm.right, vs))];
  }
  return [true, zonk(vs, tm)];
};
export const zonk = (vs: TEnvV, tm: Type): Type => {
  if (tm.tag === 'TMeta') return tm.tval ? quote(tm.tval, vs) : tm;
  if (tm.tag === 'TForall')
    return TForall(tm.name, zonk(Cons([tm.name, true], vs), tm.body));
  if (tm.tag === 'TFun')
    return TFun(zonk(vs, tm.left), zonk(vs, tm.right));
  if (tm.tag === 'TApp') {
    const spine = zonkSpine(vs, tm.left);
    return spine[0] ?
      TApp(spine[1], zonk(vs, tm.right)) :
      quote(vtapp(spine[1], evaluate(tm.right, vs)), vs);
  }
  return tm;
};

// only use this with elaborated terms
export const normalize = (t: Type, vs: TEnvV = Nil): Type =>
  quote(evaluate(t, vs), vs); 
