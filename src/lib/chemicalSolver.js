// Pure solver utilities for testing and reuse

export function equilibriumSolve(inputs) {
  const { coefA=0, coefB=0, coefC=0, coefD=0, concA=0, concB=0, concC=0, concD=0, equilibriumConstant: K } = inputs;
  // concentrations at extent
  function concentrationsAt(x) {
    const A = Math.max(concA - coefA * x, 0);
    const B = Math.max(concB - coefB * x, 0);
    const C = Math.max(concC + coefC * x, 0);
    const D = Math.max(concD + coefD * x, 0);
    return { A, B, C, D };
  }
  function f(x) {
    const { A, B, C, D } = concentrationsAt(x);
    let num = 1, den = 1;
    if (coefC > 0) num *= Math.pow(Math.max(C, 1e-12), coefC);
    if (coefD > 0) num *= Math.pow(Math.max(D, 1e-12), coefD);
    if (coefA > 0) den *= Math.pow(Math.max(A, 1e-12), coefA);
    if (coefB > 0) den *= Math.pow(Math.max(B, 1e-12), coefB);
    return num / den - K;
  }
  const extents = [];
  if (coefA > 0) extents.push(concA / coefA);
  if (coefB > 0) extents.push(concB / coefB);
  const maxExtent = extents.length ? Math.max(0, Math.min(...extents)) : 10;
  const tol = 1e-10;
  const f0 = f(0);
  if (Math.abs(f0) < 1e-12) {
    const { A, B, C, D } = concentrationsAt(0);
    const Kcalc = ((coefC>0?Math.pow(Math.max(C,1e-12),coefC):1)*(coefD>0?Math.pow(Math.max(D,1e-12),coefD):1))/((coefA>0?Math.pow(Math.max(A,1e-12),coefA):1)*(coefB>0?Math.pow(Math.max(B,1e-12),coefB):1));
    return { eqA: A, eqB: B, eqC: C, eqD: D, x: 0, Kcalc, maxExtent };
  }
  // bracketing
  let bracketFound = false;
  let xLow = 0, xHigh = maxExtent; const steps = 80;
  let prevX = 0, prevF = f0;
  for (let i=1;i<=steps;i++){
    const xi = (i/steps)*maxExtent;
    const fi = f(xi);
    if (!isFinite(fi)) { prevX = xi; prevF = fi; continue; }
    if (!isFinite(prevF)) { prevX = xi; prevF = fi; continue; }
    if (prevF * fi <= 0) { xLow = prevX; xHigh = xi; bracketFound = true; break; }
    prevX = xi; prevF = fi;
  }
  function numericDeriv(fun, xx) { const h = Math.max(1e-8, Math.abs(xx)*1e-6); const fp = fun(xx+h); const fm = fun(xx-h); return (fp-fm)/(2*h); }
  let x = 0;
  if (!bracketFound) {
    let bestX=0, bestVal=Math.abs(f0);
    for (let i=1;i<=steps;i++){ const xi=(i/steps)*maxExtent; const val=Math.abs(f(xi)); if (val<bestVal){ bestVal=val; bestX=xi; } }
    x = bestX;
  } else {
    let fLow=f(xLow), fHigh=f(xHigh); x = 0.5*(xLow+xHigh); let fx=f(x);
    const maxIter=200; let iter=0;
    while (iter++<maxIter){ if (!isFinite(fx)) break; if (Math.abs(fx)<tol) break; let dfdx = numericDeriv(f,x); let xNew=x; if (isFinite(dfdx) && Math.abs(dfdx)>1e-14){ xNew = x - fx/dfdx; } else { xNew = 0.5*(xLow+xHigh); } if (xNew<=xLow || xNew>=xHigh || !isFinite(xNew)) xNew = 0.5*(xLow+xHigh); const fNew = f(xNew); if (isFinite(fLow) && isFinite(fNew) && fLow*fNew<=0){ xHigh=xNew; fHigh=fNew; } else if (isFinite(fHigh) && isFinite(fNew) && fNew*fHigh<=0){ xLow=xNew; fLow=fNew; } else { if (Math.abs(fNew) < Math.abs(fx)) { x = xNew; fx = fNew; continue; } else { const xm = 0.5*(xLow+xHigh); const fm=f(xm); x=xm; fx=fm; if (Math.abs(fx)<tol) break; } } x = xNew; fx = fNew; }
    if (!(Math.abs(fx)<tol)) { let iter2=0, maxIter2=200; let fL=f(xLow), fH=f(xHigh); while (iter2++<maxIter2){ const xm=0.5*(xLow+xHigh); const fm=f(xm); if (!isFinite(fm)) break; if (Math.abs(fm)<tol){ x=xm; break; } if (fL*fm<=0){ xHigh=xm; fH=fm; } else { xLow=xm; fL=fm; } x=xm; } }
  }
  const { A: eqA, B: eqB, C: eqC, D: eqD } = concentrationsAt(x);
  const Kcalc = ((coefC>0?Math.pow(Math.max(eqC,1e-12),coefC):1)*(coefD>0?Math.pow(Math.max(eqD,1e-12),coefD):1))/((coefA>0?Math.pow(Math.max(eqA,1e-12),coefA):1)*(coefB>0?Math.pow(Math.max(eqB,1e-12),coefB):1));
  return { eqA, eqB, eqC, eqD, x, Kcalc, maxExtent };
}

export function solveTemperature(inputs){
  const R = 8.314462618;
  const { deltaH0, deltaS0, equilibriumConstant: K } = inputs;
  const dH = Number(deltaH0)*1000; const dS = Number(deltaS0);
  if (!K || K<=0) throw new Error('Invalid K');
  const lnK = Math.log(Number(K));
  function g(T){ return -dH/(R*T) + dS/R - lnK; }
  function gprime(T){ return dH/(R*T*T); }
  let T = Number(inputs.temperature) || 298;
  let iter=0, maxIter=200;
  while (iter++<maxIter){ const val=g(T); if (!isFinite(val)) break; if (Math.abs(val)<1e-12) break; const gp=gprime(T); if (!isFinite(gp) || Math.abs(gp)<1e-20) break; const dT=-val/gp; T+=dT; if (T<=0) T=Math.abs(T)+1; if (Math.abs(dT)<1e-8) break; }
  if (!isFinite(T) || T<=0) throw new Error('Temperature solve failed');
  return T;
}
