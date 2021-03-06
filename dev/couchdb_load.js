const axios = require('axios');
const fs = require('fs');
const { datastore, retry, databases, fileDir } = require('./utils');

async function run() {
  await retry('Waiting for datastore', () => axios.get(datastore));

  for (let db of databases) {
    const url = `${datastore}/${db}`;
    const fname = `${fileDir}/${db}.datastore.json`;
    const docs = JSON.parse(fs.readFileSync(fname));

    await axios.delete(url).catch(() => { });
    await axios.put(url);
    await axios.post(`${url}/_bulk_docs`, { docs });
    console.log('Database loaded', fname);
  }
};

run()
  .then(() => console.log('Script done!', __filename))
  .catch(e => console.log(e));
