const { switchVersion, loadModule, createDocs, whichPMRuns } = require('./utils');
const { resolve, join } = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const loadJsonFile = require('load-json-file');
const writeJsonFile = require('write-json-file');
const mainPath = resolve(process.cwd(), '../');

let resourseArr = [];
mainPath.replace(/(.*?node_modules)/g, (match, p1, offset) => {
  resourseArr.push(`${mainPath.substring(0, offset)}${p1}`);
});

let resourseArrLen = 0;
let to = ``;
console.log('mainPath', mainPath);
if (mainPath.includes('node_modules')) {
  for (let item of resourseArr) {
    // console.log('item', item);
    const Vue = loadModule(`${item}\\vue`);
    if (Vue && typeof Vue.version === 'string') {
      if (Vue.version.startsWith('2.')) {
        switchVersion(2);

        to = `${item}\\@vue\\composition-api`;
        // console.log('to', to);
        const pkgPath = resolve(item, '../package.json');
        // console.log('pkgPath', pkgPath);
        let pkg = loadJsonFile.sync(pkgPath);
        if (!pkg.dependencies['@vue/composition-api']) {
          fs.mkdtemp(join(os.tmpdir(), 'vue-demi-auto-'), (err, directory) => {
            if (err) throw err;
            // console.log('directory', directory);
            process.chdir(directory);
            const { name } = whichPMRuns();
            // console.log(name);
            const init = `${name} init -y`;
            const install = name === 'npm' ? `npm install` : `${name} add`;
            const packageManager = `${init} && ${install}`;
            // console.log('packageManager', packageManager);
            execSync(`${packageManager} @vue/composition-api`, { encoding: 'utf8', stdio: [0, 1, 2] });
            // process.chdir(process.cwd())

            let compositionApiVersion = '';
            let pkgTemp = loadJsonFile.sync(directory + '\\package.json');
            compositionApiVersion = pkgTemp.dependencies['@vue/composition-api'];
            // console.log('compositionApiVersion', compositionApiVersion);

            pkg.dependencies['@vue/composition-api'] = compositionApiVersion;
            writeJsonFile.sync(pkgPath, pkg);

            const compositionApi = loadModule(to);
            // console.log('compositionApi', compositionApi);
            if (!compositionApi) {
              console.log('writePath', directory + '\\node_modules\\@vue\\composition-api');
              createDocs(directory + '\\node_modules\\@vue\\composition-api', to, () => {
                console.log('[vue-demi] @vue/composition-api installation successful.')
              });
            }
          });
        }
      } else if (Vue.version.startsWith('3.')) {
        switchVersion(3);
      } else {
        console.warn(`[vue-demi] Vue version v${Vue.version} is not suppported.`);
      }
      break;
    } else {
      resourseArrLen++;
    }
  }
  let len = resourseArr.length;
  // console.log('resourseArr.length', resourseArr.length);
  if (resourseArrLen === len) {
    console.warn('[vue-demi] Vue is not found. Please run "npm install vue" to install.');
  }
}
