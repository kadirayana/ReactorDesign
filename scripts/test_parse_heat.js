const path = require('path');
try {
  const calc = require(path.resolve(__dirname, '..', 'src', 'lib', 'heattransfer.js'));
  const r = calc.calculateHeatTransfer ? calc.calculateHeatTransfer({}) : calc({});
  console.log('OK', typeof r.Q === 'number' ? 'Q=' + r.Q.toFixed(2) : 'no Q');
} catch (e) {
  console.error('ERR', e && e.message);
  process.exit(2);
}
