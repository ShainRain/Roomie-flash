// 交叉校验：WXML {{ }} 中引用的顶层标识符 是否存在于页面 JS 的 data 或 wx:for 别名
const fs = require('fs');
const path = require('path');

const PAGES = path.join(__dirname, '..', 'miniprogram', 'pages');
const BUILTINS = new Set(['item', 'index', 'true', 'false', 'null', 'undefined', 'Math']);

let issues = 0;

for (const page of fs.readdirSync(PAGES)) {
  const dir = path.join(PAGES, page);
  const wxmlFile = path.join(dir, `${page}.wxml`);
  const jsFile = path.join(dir, `${page}.js`);
  if (!fs.existsSync(wxmlFile) || !fs.existsSync(jsFile)) continue;

  const wxml = fs.readFileSync(wxmlFile, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const js = fs.readFileSync(jsFile, 'utf8');

  // 收集 data 顶层字段（粗糙但够用：data: { ... } 第一段）
  const dataMatch = js.match(/data:\s*\{([\s\S]*?)\n\s*\},/);
  const dataKeys = new Set();
  if (dataMatch) {
    for (const m of dataMatch[1].matchAll(/^\s*([A-Za-z_$][\w$]*)\s*:/gm)) dataKeys.add(m[1]);
  }

  // 收集 wx:for 别名
  const forAliases = new Set();
  for (const m of wxml.matchAll(/wx:for(?:-item)?="?\{\{[^}]*\}\}"?(?:\s*wx:for-item="(\w+)")?/g)) {
    if (m[1]) forAliases.add(m[1]);
  }
  for (const m of wxml.matchAll(/wx:for-item="(\w+)"/g)) forAliases.add(m[1]);
  for (const m of wxml.matchAll(/wx:for-index="(\w+)"/g)) forAliases.add(m[1]);
  // 有 wx:for 的页面，默认别名 item/index 可用
  if (/wx:for=/.test(wxml)) { forAliases.add('item'); forAliases.add('index'); }

  // 提取 {{ }} 中标识符顶层段（先剥掉字符串字面量，再忽略 .属性访问）
  const used = new Set();
  const calls = [];
  for (const m of wxml.matchAll(/\{\{([^}]*)\}\}/g)) {
    // 先剥掉字符串字面量，避免把文案里的括号误判成函数调用
    const noStr = m[1]
      .replace(/'[^']*'/g, "''")
      .replace(/"[^"]*"/g, '""');
    // WXML 的 {{ }} 不支持函数调用（如 arr.indexOf(x)），这类表达式恒为 undefined，
    // 会让选中态/条件渲染静默失效——在此拦下，避免再次出现同类问题。
    for (const c of noStr.matchAll(/[A-Za-z_$][\w$]*\s*\(/g)) {
      calls.push(c[0].replace(/\s*\($/, ''));
    }
    const expr = noStr.replace(/\.[A-Za-z_$][\w$]*/g, '.');
    for (const id of expr.matchAll(/[A-Za-z_$][\w$]*/g)) {
      const name = id[0];
      if (!BUILTINS.has(name)) used.add(name);
    }
  }

  const missing = [...used].filter((u) => !dataKeys.has(u) && !forAliases.has(u));
  if (missing.length) {
    issues++;
    console.log(`${page}: 未在 data 中找到 -> ${missing.join(', ')}`);
  } else {
    console.log(`${page}: OK (${used.size} 个绑定)`);
  }
  if (calls.length) {
    issues++;
    console.log(`${page}: {{ }} 内出现函数调用，WXML 不支持 -> ${[...new Set(calls)].join(', ')}`);
  }
}

console.log(issues ? `\n${issues} 个页面存在疑似未定义绑定` : '\n全部页面绑定校验通过');
