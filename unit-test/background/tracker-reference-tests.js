const tds = require('../../shared/js/background/trackers.es6')
const tdsStorageStub = require('./../helpers/tds.es6')
const settings = require('../../shared/js/background/settings.es6')

const refTrackers = require('./TEMP/tracker_radar_reference.json')
const refTests = require('./TEMP/domain_matching_tests.json')
const refSurrogates = require('./TEMP/surrogates.js')

describe('Tracker reference tests:', () => {
    // let settingsObserver
    // let timer = Date.now()
    // const jump = 1000 * 60 * 31 // slightly more than cache timeout

    // beforeAll(() => {
    //     settingsObserver = spyOn(settings, 'getSetting')
    //     tdsStorageStub.stub()
    //     console.log('ZZZZ', refSurrogates);
    //     const testLists = [{
    //         name: 'tds',
    //         data: refTrackers
    //     }]
    //     // {
    //     //     name: 'surrogates',
    //     //     data: refSurrogates.surrogates
    //     // }]
    //     tds.setLists(testLists)
    //     // Make sure we don't use any list caches for these tests
    //     spyOn(Date, 'now').and.callFake(function () {
    //         // Cache may be updated on each run, so keep jumping the time forward for each call
    //         timer += jump
    //         return timer
    //     })
    //
    //     settings.updateSetting('trackerBlockingEnabled', true)
    //     return settingsObserver.and.returnValue(undefined)
    // })

    beforeAll(() => {
        tdsStorageStub.stub()

        const testLists = [{
            name: 'tds',
            data: refTrackers
        },
        {
            name: 'surrogates',
            data: refSurrogates.surrogates
        }]
        return tds.setLists(testLists)
    })

    const domainTests = refTests.domainTests.tests

    for (const test of domainTests) {
        it(`${test.name}`, () => {
            const rootURL = test.siteURL
            const requestURL = test.requestURL
            const requestType = test.requestType
            const result = tds.getTrackerData(requestURL, rootURL, { type: requestType })
            const action = (result && result.action)
            expect(test.expectAction).toEqual(action)
        })
    }
})
