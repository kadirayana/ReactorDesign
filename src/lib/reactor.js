// Minimal migration of reactor calculation logic extracted from legacy HTML.
// Export functions that compute reactor sizing and simple profiles.

export function calculateBasicReactor(inputs) {
  const {
    reactorType,
    reactionOrder,
    flowRate,
    initialConc,
    rateConstant,
    targetConversion,
    catDensity = 1000,
    effectiveRateConstant = 0.1,
    effectivenessFactor = 0.8
  } = inputs

  let reactorVolume = 0
  let spaceTime = 0
  let spaceVelocity = 0

  switch (reactorType) {
    case 'pfr':
      if (reactionOrder === 1) {
        reactorVolume = (flowRate / initialConc) * Math.log(1 / (1 - targetConversion)) / rateConstant
      } else if (reactionOrder === 2) {
        reactorVolume = (flowRate / initialConc) * (1 / (1 - targetConversion) - 1) / (rateConstant * initialConc)
      } else {
        reactorVolume = (flowRate * targetConversion) / (rateConstant * initialConc)
      }
      break
    case 'cstr':
      if (reactionOrder === 1) {
        reactorVolume = (flowRate * targetConversion) / (rateConstant * initialConc * (1 - targetConversion))
      } else if (reactionOrder === 2) {
        reactorVolume = (flowRate * targetConversion) / (rateConstant * Math.pow(initialConc * (1 - targetConversion), 2))
      } else {
        reactorVolume = (flowRate * targetConversion) / rateConstant
      }
      break
    case 'pbr':
      if (reactionOrder === 1) {
        reactorVolume = (flowRate / initialConc) * Math.log(1 / (1 - targetConversion)) /
          (effectiveRateConstant * effectivenessFactor * catDensity)
      } else if (reactionOrder === 2) {
        reactorVolume = (flowRate / initialConc) * (1 / (1 - targetConversion) - 1) /
          (effectiveRateConstant * effectivenessFactor * catDensity * initialConc)
      } else {
        reactorVolume = (flowRate * targetConversion) /
          (effectiveRateConstant * effectivenessFactor * catDensity)
      }
      break
    case 'batch':
      if (reactionOrder === 1) {
        reactorVolume = Math.log(1 / (1 - targetConversion)) / rateConstant
      } else if (reactionOrder === 2) {
        reactorVolume = (1 / (1 - targetConversion) - 1) / (rateConstant * initialConc)
      } else {
        reactorVolume = targetConversion / (rateConstant * initialConc)
      }
      break
    default:
      reactorVolume = 0
  }

  if (reactorType === 'batch') {
    spaceTime = reactorVolume
    spaceVelocity = reactorVolume === 0 ? 0 : 1 / spaceTime
  } else {
    spaceTime = reactorVolume * initialConc / flowRate || 0
    spaceVelocity = spaceTime === 0 ? 0 : 1 / spaceTime
  }

  const selectivity = 0.95
  const yieldVal = targetConversion * selectivity

  // Create simple profiles for charts (conversion and concentration)
  const points = 100
  const conversionProfile = []
  const concentrationA = []
  for (let i = 0; i <= points; i++) {
    const z = i / points
    let conversion = 0
    if (reactorType === 'pfr' || reactorType === 'pbr') {
      if (reactionOrder === 1) conversion = 1 - Math.exp(-rateConstant * z * 5)
      else if (reactionOrder === 2) conversion = (rateConstant * initialConc * z * 5) / (1 + rateConstant * initialConc * z * 5)
      else conversion = Math.min(1, rateConstant * z * 5 / initialConc)
    } else if (reactorType === 'cstr') {
      const numCSTR = 10
      if (reactionOrder === 1) {
        const tauTotal = 5
        const tau = tauTotal / numCSTR
        conversion = 1 - 1 / Math.pow(1 + rateConstant * tau, Math.floor(z * numCSTR))
      } else {
        const tauTotal = 5
        const tau = tauTotal / numCSTR
        conversion = (Math.floor(z * numCSTR) * rateConstant * initialConc * tau) / (1 + Math.floor(z * numCSTR) * rateConstant * initialConc * tau)
      }
    } else if (reactorType === 'batch') {
      const t = z * 5
      if (reactionOrder === 1) conversion = 1 - Math.exp(-rateConstant * t)
      else if (reactionOrder === 2) conversion = (rateConstant * initialConc * t) / (1 + rateConstant * initialConc * t)
      else conversion = Math.min(1, rateConstant * t / initialConc)
    }
    conversionProfile.push({ x: (reactorType === 'batch' ? (z * 5) : (reactorType === 'cstr' ? Math.floor(z * 10) : z * 5)), y: conversion })
    concentrationA.push({ x: conversionProfile[i].x, y: initialConc * (1 - conversion) })
  }

  return {
    reactorVolume,
    spaceTime,
    spaceVelocity,
    selectivity,
    yield: yieldVal,
    conversionProfile,
    concentrationProfile: concentrationA
  }
}
