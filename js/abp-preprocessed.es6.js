/*
 * Load the abp-filter-parser node module and 
 * pre-process the easylists.
 *
 * This will be browserifyed and turned into abp.js by running 'grunt'
 */
abp = require('abp-filter-parser');
const ONEDAY = 1000*60*60*24

let lists = {
    easylists : {
        privacy: {
            url: 'https://duckduckgo.com/contentblocking.js?l=easyprivacy',
            parsed: {},
        },
        general: {
            url: 'https://duckduckgo.com/contentblocking.js?l=easylist',
            parsed: {},
        }
    },
    whitelists: {
        preWhitelist: {
            url: 'https://raw.githubusercontent.com/duckduckgo/content-blocking-whitelist/master/whitelist.txt',
            parsed: {}
        }
    }
}

easylists = lists.easylists
whitelists = lists.whitelists

/*
 * Get the list data and use abp to parse.
 * The parsed list data will be added to 
 * the easyLists object.
 */
function updateLists () {
    let atb = settings.getSetting('atb')
    let set_atb = settings.getSetting('set_atb')
    let versionParam = getVersionParam()
    
    for (let listType in lists) {
        for (let name in lists[listType]) {
            let url = lists[listType][name].url

            // for now bail if we don't have a url
            if (!url) return 
                
            let etag = settings.getSetting(name + '-etag')

            //if (atb) url += '&atb=' + atb
            //if (set_atb) url += '&set_atb=' + set_atb
            //if (versionParam) url += versionParam

            console.log("Checking for list update: ", name)

            // if we don't have parsed list data skip the etag to make sure we
            // get a fresh copy of the list to process
            if (Object.keys(lists[listType][name].parsed).length === 0) etag = ''
                
            load.loadExtensionFile({url: url, source: 'external', etag: etag}, (listData, response) => {
                let newEtag = response.getResponseHeader('etag')
                console.log("Updating list: ", name)
                // sync new etag to storage
            
                settings.updateSetting(name + '-etag', newEtag)
                
                abp.parse(listData, lists[listType][name].parsed)
                lists[listType][name].loaded = true;
            });
        }
    }

    // Load tracker whitelist
    // trackerWhitelist declared in trackers.js
    load.loadExtensionFile({url: settings.getSetting('trackerWhitelist')}, function(listData, response) {
        console.log('loaded tracker whitelist: ' + listData);
        abp.parse(listData, trackerWhitelist);

    });
}

// Make sure the list updater runs on start up
settings.ready().then(() => updateLists())

function getList () {

}
chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'updateEasyLists') {
        settings.ready().then(() => updateLists())
    }
});

// set an alarm to recheck the lists
// update every 3 hours
chrome.alarms.create('updateEasyLists', {periodInMinutes: 180})

// add version param to url on the first install and
// only once a day after than
function getVersionParam () {
    let version = settings.getSetting('version') || 'v1'
    let lastEasylistUpdate = settings.getSetting('lastEasylistUpdate')
    let now = Date.now()
    let versionParam

    // check delta for last update or if lastEasylistUpdate does
    // not exist then this is the initial install
    if (lastEasylistUpdate) {
        let delta = now - new Date(lastEasylistUpdate)
            
        if (delta > ONEDAY) {
            versionParam = `&v=${version}`
        }
    } else {
        versionParam = `&v=${version}`
    }

    if (versionParam) settings.updateSetting('lastEasylistUpdate', now)

    return versionParam
}
