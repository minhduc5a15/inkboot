const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, 'client/app'),
  path.join(__dirname, 'client/components')
];

const replacements = [
  { search: /\[#161616\]/g, replace: 'zinc-950' },
  { search: /\[#1a1a1a\]/g, replace: 'zinc-900' },
  { search: /\[#262626\]/g, replace: 'zinc-800' },
  { search: /\[#333\]/g, replace: 'zinc-700' },
  { search: /\[#444\]/g, replace: 'zinc-600' },
  { search: /\[#666\]/g, replace: 'zinc-500' },
  { search: /\[#888\]/g, replace: 'zinc-400' },
  { search: /\[#ffffff05\]/g, replace: 'zinc-900/50' },
  { search: /\[#ffffff0a\]/g, replace: 'zinc-800/50' },
  { search: /\[#ffffff10\]/g, replace: 'zinc-700/50' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { search, replace } of replacements) {
        content = content.replace(search, replace);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

targetDirs.forEach(dir => processDirectory(dir));
console.log('Color replacement complete!');
