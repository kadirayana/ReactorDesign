const fs = require('fs');
const path = require('path');

(async function copyLegacy() {
  try {
    const repoRoot = path.join(__dirname, '..');
    const publicLegacy = path.join(repoRoot, 'public', 'legacy');
    await fs.promises.mkdir(publicLegacy, { recursive: true });

    // list of common legacy files to copy (will skip missing files)
    const filesToCopy = [
      'index.html','reactor.html','reactorss.html','chemical.html','heattransfer.html',
      'heatintegration.html','dynamics.html','vaporizer.html','optimization.html','history.html',
      'form.html','responsive.css','styles.css','responsive.js','translations.js','README.md'
    ];

    for (const f of filesToCopy) {
      const src = path.join(repoRoot, f);
      const dest = path.join(publicLegacy, f);
      try {
        await fs.promises.copyFile(src, dest);
        console.log("copied", f);
      } catch (err) {
        // skip missing files
        // console.warn(`skip ${f}: ${err.message}`);
      }
    }

    // Also copy all .js files at root
    const dirents = await fs.promises.readdir(repoRoot, { withFileTypes: true });
    for (const d of dirents) {
      if (d.isFile() && d.name.endsWith('.js')) {
        const src = path.join(repoRoot, d.name);
        const dest = path.join(publicLegacy, d.name);
        try { await fs.promises.copyFile(src, dest); } catch (e) {}
      }
    }

    console.log('Legacy copy complete. Check public/legacy for files.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
