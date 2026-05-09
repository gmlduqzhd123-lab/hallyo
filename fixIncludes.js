const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('c:/Users/user/Desktop/swimapp/src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/\.includes\(userRole\)/g, ".includes(userRole as string)");
  content = content.replace(/\.includes\(roleData\?\.role\)/g, ".includes(roleData?.role as string)");
  content = content.replace(/\.includes\(profile\?\.role\)/g, ".includes(profile?.role as string)");
  content = content.replace(/\.includes\(userData\?\.role\)/g, ".includes(userData?.role as string)");
  content = content.replace(/\.includes\(userRecord\?\.role\)/g, ".includes(userRecord?.role as string)");

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
