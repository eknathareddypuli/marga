  // ------------------------------------------------------------ round 52: data platform, multi-cloud, platform tooling
  await test('three new modules (data platform, multi-cloud, platform tooling) and the data platform path: content, paths and pages', async () => {
    const { ctx, page, issues } = await open(); await go(page, '/');
    const NEW = ['data-platform', 'multi-cloud', 'platform-tools'];
    const where = { 'data-platform': ['devops', 'sre', 'data-platform'], 'multi-cloud': ['cloud', 'sre', 'devsecops', 'platform'], 'platform-tools': ['platform'] };
    const mods = Object.fromEntries(data.modules.map((m) => [m.id, m]));
    for (const id of NEW) {
      ok(mods[id], id + ' is registered');
      eq(Object.keys(data.lessons).filter((k) => k.startsWith(id + '/')).length, 6, id + ' has six lessons');
      ok(data.games.filter((g) => g.module === id).length >= 1, id + ' has a game');
      ok(data.widgets.filter((w) => w.module === id).length >= 4, id + ' has four widgets');
      for (const pid of where[id]) {
        const mm = data.paths.live.find((x) => x.id === pid).modules;
        ok(mm.includes(id), id + ' is on ' + pid);
        for (const r of mods[id].requires) ok(mm.indexOf(r) >= 0 && mm.indexOf(r) < mm.indexOf(id), id + ' needs ' + r + ' first on ' + pid);
      }
    }
    const pl = data.paths.live.find((p) => p.id === 'platform');
    eq(pl.modules[pl.modules.length - 1], 'platform', 'platform stays last');
    ok(data.paths.live.some((p) => p.id === 'data-platform'), 'data platform path is live');
    await nav(page, '/module/multi-cloud'); await page.waitForSelector('.jobs li');
    eq(await page.locator('.jobs li').count(), 6, 'module page lists six lessons');
    await nav(page, '/lesson/platform-tools/backstage-software-catalog-and-templates'); await page.waitForSelector('h1');
    ok((await page.locator('body').innerText()).includes('Backstage'), 'lesson opens');
    eq(issues.length, 0, issues.slice(0, 3).join(' | '));
    await ctx.close();
  });

  // ------------------------------------------------------------ round 53: six more modules and merge import
  await test('six more modules (FinOps, secrets and PKI, Linux internals, troubleshooting, reliability, infrastructure design): content, paths and pages', async () => {
    const { ctx, page, issues } = await open(); await go(page, '/');
    const NEW = ['finops', 'secrets-pki', 'linux-internals', 'troubleshooting-scenarios', 'reliability-practice', 'infra-design'];
    const mods = Object.fromEntries(data.modules.map((m) => [m.id, m]));
    for (const id of NEW) {
      ok(mods[id], id + ' is registered');
      eq(Object.keys(data.lessons).filter((k) => k.startsWith(id + '/')).length, 6, id + ' has six lessons');
      ok(data.games.filter((g) => g.module === id).length >= 1, id + ' has a game');
      ok(data.widgets.filter((w) => w.module === id).length >= 4, id + ' has four widgets');
      const onPaths = data.paths.live.filter((p) => p.modules.includes(id));
      ok(onPaths.length >= 1, id + ' is on at least one path');
      for (const p of onPaths) for (const r of mods[id].requires) ok(p.modules.indexOf(r) >= 0 && p.modules.indexOf(r) < p.modules.indexOf(id), id + ' needs ' + r + ' first on ' + p.id);
    }
    const pl = data.paths.live.find((p) => p.id === 'platform');
    eq(pl.modules[pl.modules.length - 1], 'platform', 'platform stays last');
    await nav(page, '/module/troubleshooting-scenarios'); await page.waitForSelector('.jobs li');
    eq(await page.locator('.jobs li').count(), 6, 'module page lists six lessons');
    await nav(page, '/lesson/finops/the-finops-cycle-inform-optimize-operate'); await page.waitForSelector('h1');
    ok((await page.locator('body').innerText()).includes('FinOps'), 'lesson opens');
    eq(issues.length, 0, issues.slice(0, 3).join(' | '));
    await ctx.close();
  });

  await test('importing progress merges with local progress and rejects oversized or wrong files', async () => {
    const { ctx, page, issues } = await open(); await go(page, '/');
    const ids = Object.keys(data.lessons).slice(0, 3);
    const mk = (lessons, days) => JSON.stringify({ v: 1, lessons, cards: {}, days, path: 'devops', iv: {} });
    await page.evaluate((s) => localStorage.setItem('ea.progress.v1', s), mk({ [ids[0]]: { done: true, best: 80, at: 1, attempts: 1 } }, ['2026-01-01']));
    await nav(page, '/progress'); await page.reload(); await page.waitForSelector('#import-file');
    const fsm = require('fs'), osm = require('os'), pm = require('path');
    const f1 = pm.join(osm.tmpdir(), `merge-${Date.now()}.json`);
    fsm.writeFileSync(f1, mk({ [ids[0]]: { done: true, best: 95, at: 2, attempts: 3 }, [ids[1]]: { done: true, best: 70, at: 3, attempts: 1 } }, ['2026-01-02']));
    await page.setInputFiles('#import-file', f1);
    await page.waitForFunction(() => /merged: 1 lesson added/.test(document.getElementById('toast').textContent));
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem('ea.progress.v1')));
    eq(Object.keys(st.lessons).length, 2, 'both lessons present');
    eq(st.lessons[ids[0]].best, 95, 'the better score is kept');
    ok(st.days.includes('2026-01-01') && st.days.includes('2026-01-02'), 'days are combined');
    const big = pm.join(osm.tmpdir(), `big-${Date.now()}.json`);
    fsm.writeFileSync(big, JSON.stringify({ v: 1, lessons: {}, days: [], pad: 'x'.repeat(2.2 * 1024 * 1024) }));
    await page.setInputFiles('#import-file', big);
    await page.waitForFunction(() => /too large/.test(document.getElementById('toast').textContent));
    eq(Object.keys((await page.evaluate(() => JSON.parse(localStorage.getItem('ea.progress.v1')))).lessons).length, 2, 'oversized file leaves data intact');
    eq(issues.length, 0, issues.slice(0, 3).join(' | '));
    await ctx.close();
  });
