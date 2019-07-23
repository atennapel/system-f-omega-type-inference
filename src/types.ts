import { impossible } from './util';
import { VType, showVType } from './vtypes';

export type Type
  = TVar
  | TMeta
  | TApp
  | TAbs
  | TForall;

export type TVarName = string;
export interface TVar {
  readonly tag: 'TVar';
  readonly name: TVarName;
}
export const TVar = (name: TVarName): TVar =>
  ({ tag: 'TVar', name });

export type TMetaId = number;
let tmetaId: TMetaId = 0;
export const resetTMetaId = () => { tmetaId = 0 };

export interface TMeta {
  readonly tag: 'TMeta';
  readonly id: TMetaId;
  type: VType | null;
}
export const TMeta = (id: TMetaId): TMeta =>
  ({ tag: 'TMeta', id, type: null });
export const freshTMeta = () => TMeta(tmetaId++);

export interface TApp {
  readonly tag: 'TApp';
  readonly left: Type;
  readonly right: Type;
}
export const TApp = (left: Type, right: Type): TApp =>
  ({ tag: 'TApp', left, right });
export const tappFrom = (ts: Type[]) => ts.reduce(TApp);
export const tapp = (...ts: Type[]) => tappFrom(ts);
export const foldTApp = (t: Type, ts: Type[]) => ts.reduce(TApp, t);
export const unfoldTApp = (t: Type): [Type, Type[]] => {
  const ts: Type[] = [];
  while (t.tag === 'TApp') {
    ts.push(t.right);
    t = t.left;
  }
  return [t, ts.reverse()];
};

export interface TAbs {
  readonly tag: 'TAbs';
  readonly name: TVarName;
  readonly body: Type;
}
export const TAbs = (name: TVarName, body: Type): TAbs =>
  ({ tag: 'TAbs', name, body });
export const tabs = (ns: TVarName[], body: Type) =>
  ns.reduceRight((x, y) => TAbs(y, x), body);
export const unfoldTAbs = (t: Type): [TVarName[], Type] => {
  const ns: TVarName[] = [];
  while (t.tag === 'TAbs') {
    ns.push(t.name);
    t = t.body;
  }
  return [ns, t];
};

export interface TForall {
  readonly tag: 'TForall';
  readonly name: TVarName;
  readonly body: Type;
}
export const TForall = (name: TVarName, body: Type): TForall =>
  ({ tag: 'TForall', name, body });
export const tforall = (ns: TVarName[], body: Type) =>
  ns.reduceRight((x, y) => TForall(y, x), body);
export const unfoldTForall = (t: Type): [TVarName[], Type] => {
  const ns: TVarName[] = [];
  while (t.tag === 'TForall') {
    ns.push(t.name);
    t = t.body;
  }
  return [ns, t];
};

export const TFunC = TVar('->');
export interface TFun {
  readonly tag: 'TApp';
  readonly left: {
    readonly tag: 'TApp';
    readonly left: TVar;
    readonly right: Type;
  }
  readonly right: Type;
}
export const TFun = (left: Type, right: Type): TFun =>
  TApp(TApp(TFunC, left), right) as TFun;
export const isTFun = (t: Type): t is TFun =>
  t.tag === 'TApp' && t.left.tag === 'TApp' && t.left.left.tag === 'TVar' && t.left.left.name === TFunC.name;
export const tfunL = (t: TFun) => t.left.right;
export const tfunR = (t: TFun) => t.right;
export const tfunFrom = (ts: Type[]) =>
  ts.reduceRight((x, y) => TFun(y, x));
export const tfun = (...ts: Type[]) => tfunFrom(ts);
export const unfoldTFun = (t: Type): Type[] => {
  const ts: Type[] = [];
  while (isTFun(t)) {
    ts.push(tfunL(t));
    t = tfunR(t);
  }
  ts.push(t);
  return ts;
};

export const showTypeParen = (b: boolean, t: Type): string =>
  b ? `(${showType(t)})` : showType(t);
export const showType = (t: Type): string => {
  if (t.tag === 'TVar') return t.name === TFunC.name ? `(->)` : t.name;
  if (t.tag === 'TMeta')
    return `?${t.id}${t.type ? `{${showVType(t.type)}}` : ''}`;
  if (t.tag === 'TAbs') {
    const [xs, b] = unfoldTAbs(t);
    return `\\${xs.join(' ')}. ${showType(b)}`;
  }
  if (t.tag === 'TForall') {
    const [xs, b] = unfoldTForall(t);
    return `forall ${xs.join(' ')}. ${showType(b)}`;
  }
  if (isTFun(t)) {
    const ts = unfoldTFun(t);
    return ts.map(t => showTypeParen(isTFun(t) || t.tag === 'TAbs' || t.tag === 'TForall', t)).join(' -> ');
  }
  if (t.tag === 'TApp') {
    const [f, as] = unfoldTApp(t);
    return as.length === 0 ? showType(f) :
      `${showTypeParen(f.tag !== 'TVar' && f.tag !== 'TMeta', f)} ${as.map(t => showTypeParen(t.tag !== 'TVar' && t.tag !== 'TMeta', t)).join(' ')}`;
  }
  return impossible('showType');
};

export const substTVar = (x: TVarName, s: Type, t: Type): Type => {
  if (t.tag === 'TVar') return t.name === x ? s : t;
  if (t.tag === 'TAbs')
    return t.name === x ? t : TAbs(t.name, substTVar(x, s, t.body));
  if (t.tag === 'TForall')
    return t.name === x ? t : TForall(t.name, substTVar(x, s, t.body));
  if (t.tag === 'TApp')
    return TApp(substTVar(x, s, t.left), substTVar(x, s, t.right));
  return t;
};
