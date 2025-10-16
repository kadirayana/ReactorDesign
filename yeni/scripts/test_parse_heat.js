const path = require('path');
try {
  const calc = require(path.resolve(__dirname, '..', 'src', 'lib', 'heattransfer.js'));
  const fn = calc.calculateHeatTransfer || calc.default || calc;
  const r = fn({});
  console.log('OK', typeof r.Q === 'number' ? 'Q=' + r.Q.toFixed(2) : 'no Q');
} catch (e) {
  console.error('ERR', e && e.message);
  process.exit(2);
}
