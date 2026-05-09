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

  // Replace userRole === 'admin'
  content = content.replace(/userRole === 'admin'/g, "['admin', 'developer'].includes(userRole)");
  content = content.replace(/userRole !== 'admin'/g, "!['admin', 'developer'].includes(userRole)");

  // Replace roleData?.role === 'admin'
  content = content.replace(/roleData\?\.role === 'admin'/g, "['admin', 'developer'].includes(roleData?.role)");
  content = content.replace(/roleData\?\.role !== 'admin'/g, "!['admin', 'developer'].includes(roleData?.role)");

  // Replace profile?.role === 'admin'
  content = content.replace(/profile\?\.role === 'admin'/g, "['admin', 'developer'].includes(profile?.role)");
  content = content.replace(/profile\?\.role !== 'admin'/g, "!['admin', 'developer'].includes(profile?.role)");

  // Replace userData?.role === 'admin'
  content = content.replace(/userData\?\.role === 'admin'/g, "['admin', 'developer'].includes(userData?.role)");
  content = content.replace(/userData\?\.role !== 'admin'/g, "!['admin', 'developer'].includes(userData?.role)");

  // Replace userRecord?.role === 'admin'
  content = content.replace(/userRecord\?\.role === 'admin'/g, "['admin', 'developer'].includes(userRecord?.role)");
  content = content.replace(/userRecord\?\.role !== 'admin'/g, "!['admin', 'developer'].includes(userRecord?.role)");

  // Layout handling: restrictedTo: ['admin', 'coach']
  content = content.replace(/restrictedTo:\s*\[\s*'admin',\s*'coach'\s*\]/g, "restrictedTo: ['admin', 'developer', 'coach']");
  content = content.replace(/restrictedTo:\s*\[\s*'admin'\s*\]/g, "restrictedTo: ['admin', 'developer']");

  // Schema roles
  content = content.replace(/z\.enum\(\['admin',\s*'athlete',\s*'coach',\s*'parents',\s*'guest'\]\)/g, "z.enum(['admin', 'developer', 'athlete', 'coach', 'parents', 'guest'])");

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
