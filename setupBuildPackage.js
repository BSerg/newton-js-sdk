const fs = require('fs');

(function() {
    const source = fs.readFileSync(__dirname + '/package.json').toString('utf-8');
    const sourceObj = JSON.parse(source);
    delete sourceObj.files;
    delete sourceObj.license;
    sourceObj.scripts = {};
    sourceObj.devDependencies = {};
    if (sourceObj.main.startsWith('dist/')) {
        sourceObj.main = sourceObj.main.slice(5);
    }
    fs.writeFileSync(__dirname + '/dist/package.json', Buffer.from(JSON.stringify(sourceObj, null, 2), 'utf-8') );
})();
