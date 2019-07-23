import { abs, Var, showTerm, Ann, app } from './terms';
import { infer, Envs } from './inference';
import { showType, tforall, tfun, TVar, tfunL, tabs, TVarName, tapp } from './types';
import { list, Nil } from './list';
import { TBound, TDef, TEnv, TEntry } from './unification';
import { TVals, veval } from './vtypes';

const v = Var;
const tv = TVar;

const tPair = tabs(['a', 'b'], tforall(['t'], tfun(tfun(tv('a'), tv('b'), tv('t')), tv('t'))));

const tvals: TVals = list(['->', Nil], ['Nat', Nil], ['Pair', Nil]);
const ePair = veval(tvals, tPair);

const envs: Envs = {
  tenv: list<[TVarName, TEntry]>(['->', TBound], ['Nat', TBound], ['Pair', TDef(ePair)]),
  tvals,
  env: list(
    ['inc', veval(tvals, tfun(tv('Nat'), tv('Nat')))],
    ['z', veval(tvals, tv('Nat'))],
    ['Pair', veval(tvals, tforall(['a', 'b'], tfun(tv('a'), tv('b'), tapp(tv('Pair'), tv('a'), tv('b')))))]
  ),
};

const term = app(Ann(abs(['x'], v('x')), tforall(['t'], tfun(tv('t'), tv('t')))), v('z'));
// const term = app(v('Pair'), v('z'), v('z'), v('z'));
console.log(showTerm(term));
const type = infer(term, envs);
console.log(showType(type));
