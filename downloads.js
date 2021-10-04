'use strict';

function parseXML (xml) {
  let files = $(xml).find('ListBucketResult').find('Contents');
  let downloads = {};
  let nightlies = { title:'Nightly', downloads:[] };
  let acommities = { title:'Arkime Latest Commit', downloads:[] };
  let mcommities = { title:'Arkime/Moloch Hybrid Latest Commit', downloads:[] };
  const oses = {
    'arch.x86': 'Arch',
    centos6: 'Centos 6',
    centos7: 'Centos 7',
    centos8: 'Centos 8',
    ubuntu16: 'Ubuntu 16.04',
    ubuntu18: 'Ubuntu 18.04',
    ubuntu20: 'Ubuntu 20.04'
  };

  for (let i = 0, len = files.length; i < len; ++i) {
    let file = $(files[i]);
    let key  = file.find('Key').text();

    if (key.startsWith('builds/')) {
      let keyArr = key.split('/');
      let os     = keyArr[1];
      let vers   = keyArr[2];
      let time   = new Date(file.find('LastModified').text());

      time = `${time.getFullYear()}-${('0'+(time.getMonth()+1)).slice(-2)}-${('0'+time.getDate()).slice(-2)}`;

      let uniqueVers = vers.match(/([0-9]+)\.([0-9]+)\.([0-9]+)/g);

      let osTitle = os.replace('-', ' ');
      osTitle = osTitle.charAt(0).toUpperCase() + osTitle.slice(1);

      let download = {
        url  : `https://s3.amazonaws.com/files.molo.ch/${key}`,
        title: osTitle
      };

      if (!uniqueVers && vers.includes('nightly')) {
        if (!nightlies.time) { nightlies.modified = time; }
        nightlies.downloads.push(download);
        continue;
      }

      uniqueVers = uniqueVers[0];

      const arkimeOrMoloch = key.match(/(arkime|moloch)/g);

      // The downloads key has arkime/moloch in the name so we have both entries
      // We uppercase MOLOCH so it sorts before arkime, because we reverse sort and need it to be after
      let downloadKey;
      if (arkimeOrMoloch[0] === 'arkime') {
        downloadKey = `${uniqueVers}-arkime`;
      } else  {
        downloadKey = `${uniqueVers}-MOLOCH`;
      }

      // group by version
      if (!downloads.hasOwnProperty(downloadKey)) {
        // 2.4 & below is Moloch
        // 2.7 and above but named moloch is Hybrid
        // named arkime is Arkime
        let title;
        if (arkimeOrMoloch[0] === 'arkime')
          title = 'Arkime';
        else
          title = (uniqueVers.match(/^([0-1]|2\.[0-4])/) ? 'Moloch' : 'Arkime/Moloch Hybrid');
        downloads[downloadKey] = {
          title     : `${title} ${uniqueVers}`,
          downloads : [download],
          modified  : time
        };
      } else {
        downloads[downloadKey].downloads.push(download);
      }
    } else if (key.startsWith('moloch-master')) {
      const keyArr = key.split(key[13]);
      const os = keyArr[1];
      let time = new Date(file.find('LastModified').text());
      time = `${time.getFullYear()}-${('0'+(time.getMonth()+1)).slice(-2)}-${('0'+time.getDate()).slice(-2)} ${('0'+time.getHours()).slice(-2)}:${('0'+time.getMinutes()).slice(-2)}:${('0'+time.getSeconds()).slice(-2)}`;

      const osTitle = oses[os];

      if (!osTitle) { continue; }

      let download = {
        url  : `https://s3.amazonaws.com/files.molo.ch/${key}`,
        title: osTitle
      };

      mcommities.modified = time;
      mcommities.downloads.push(download);
    } else if (key.startsWith('arkime-main')) {
      const keyArr = key.split(key[11]);
      const os = keyArr[1];
      let time = new Date(file.find('LastModified').text());
      time = `${time.getFullYear()}-${('0'+(time.getMonth()+1)).slice(-2)}-${('0'+time.getDate()).slice(-2)} ${('0'+time.getHours()).slice(-2)}:${('0'+time.getMinutes()).slice(-2)}:${('0'+time.getSeconds()).slice(-2)}`;

      const osTitle = oses[os];

      if (!osTitle) { continue; }

      let download = {
        url  : `https://s3.amazonaws.com/files.molo.ch/${key}`,
        title: osTitle
      };

      acommities.modified = time;
      acommities.downloads.push(download);
    }
  }

  return {
    downloads: downloads,
    nightlies: nightlies,
    acommities: acommities,
    mcommities: mcommities,
    sortedVersions: Object.keys(downloads).sort().reverse()
  };
}
