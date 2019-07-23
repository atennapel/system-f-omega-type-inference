import { TVarName, TMeta, TVar, showType, Type, TAbs, TForall, foldTApp, TFunC, TApp } from './types';
import { List, lookup, Nil, extend } from './list';
import { impossible } from './util';

export type VType
  = VTNeutral
  | VTAbs
  | VTForall;

export type VTHead = TVar | TMeta;
export const eqVTHead = (a: VTHead, b: VTHead): boolean =>
  a === b || (a.tag === 'TVar' && b.tag === 'TVar' && a.name === b.name);

export interface VTNeutral {
  readonly tag: 'VTNeutral';
  readonly head: VTHead;
  readonly args: VType[];
}
export const VTNeutral = (head: VTHead, args: VType[] = []): VTNeutral =>
  ({ tag: 'VTNeutral', head, args });
export const VTVar = (x: TVarName) => VTNeutral(TVar(x), []);
export const matchVTVar = (t: VType): TVar | null =>
  t.tag === 'VTNeutral' && t.head.tag === 'TVar' && t.args.length === 0 ? t.head : null;
export const matchVTMeta = (t: VType): TMeta | null =>
  t.tag === 'VTNeutral' && t.head.tag === 'TMeta' && t.args.length === 0 ? t.head : null;

export const matchVTFun = (t: VType): [VType, VType] | null => {
  if (t.tag === 'VTNeutral' && t.head.tag === 'TVar' && t.head.name === TFunC.name && t.args.length === 2)
    return t.args as [VType, VType];
  return null;
};

export interface VTAbs {
  readonly tag: 'VTAbs';
  readonly name: TVarName;
  readonly body: (s: VType) => VType;
}
export const VTAbs = (name: TVarName, body: (s: VType) => VType): VTAbs =>
  ({ tag: 'VTAbs', name, body });

export interface VTForall {
  readonly tag: 'VTForall';
  readonly name: TVarName;
  readonly body: (s: VType) => VType;
}
export const VTForall = (name: TVarName, body: (s: VType) => VType): VTForall =>
  ({ tag: 'VTForall', name, body });

export const showVType = (t: VType): string => {
  if (t.tag === 'VTNeutral')
    return `(${showType(t.head)} ${t.args.map(showVType).join(' ')})`;
  if (t.tag === 'VTAbs') return `(\\${t.name}. [...])`;
  if (t.tag === 'VTForall') return `(forall ${t.name}. [...])`;
  return impossible('showVType');
};

export type TVals = List<[TVarName, VType | Nil]>;

export const freshTVar = (e: TVals, x: TVarName): TVarName => {
  while (lookup(e, x)) x = `${x}'`;
  return x;
};

export const vtapp2 = (a: VType, b: VType): VType => {
  if (a.tag === 'VTAbs') return a.body(b);
  if (a.tag === 'VTNeutral') return VTNeutral(a.head, a.args.concat([b]));
  return impossible('vtapp2');
};
export const vtapp = (f: VType, as: VType[]): VType => as.reduce(vtapp2, f);

export const force = (t: VType): VType => {
  if (t.tag === 'VTNeutral' && t.head.tag === 'TMeta' && t.head.type)
    return force(vtapp(t.head.type, t.args));
  return t;
};

export const veval = (e: TVals, t: Type): VType => {
  if (t.tag === 'TVar') {
    const v = lookup(e, t.name);
    if (!v) return impossible(`veval: lookup ${t.name}`);
    if (v.tag === 'Nil') return VTNeutral(t);
    return v;
  }
  if (t.tag === 'TMeta') return t.type || VTNeutral(t);
  if (t.tag === 'TApp')
    return vtapp2(veval(e, t.left), veval(e, t.right));
  if (t.tag === 'TAbs')
    return VTAbs(t.name, u => veval(extend(t.name, u, e), t.body));
  if (t.tag === 'TForall')
    return VTForall(t.name, u => veval(extend(t.name, u, e), t.body));
  return impossible('veval');
};

export const vquote = (e: TVals, t: VType): Type => {
  if (t.tag === 'VTNeutral')
    return foldTApp(t.head, t.args.map(t => vquote(e, t)));
  if (t.tag === 'VTAbs') {
    const x = freshTVar(e, t.name);
    return TAbs(x, vquote(extend(x, Nil, e), t.body(VTVar(x))));
  }
  if (t.tag === 'VTForall') {
    const x = freshTVar(e, t.name);
    return TForall(x, vquote(extend(x, Nil, e), t.body(VTVar(x))));
  }
  return impossible('vquote');
};

export const vnormalform = (e: TVals, t: Type): Type =>
  vquote(e, veval(e, t));

export const prune = (e: TVals, t: Type): Type => {
  if (t.tag === 'TMeta') {
    if (!t.type) return t;
    return prune(e, vquote(e, t.type));
  }
  if (t.tag === 'TApp')
    return TApp(prune(e, t.left), prune(e, t.right));
  if (t.tag === 'TAbs')
    return TAbs(t.name, prune(extend(t.name, Nil, e), t.body));
  if (t.tag === 'TForall')
    return TForall(t.name, prune(extend(t.name, Nil, e), t.body));
  return t;
};
