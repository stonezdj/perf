// test the performance for pulling artifacts from proxy cache project
import { Rate } from 'k6/metrics'
import { Harbor, ContentStore } from 'k6/x/harbor'

import { Settings } from '../config.js'
import { getProjectNames, randomItem } from '../helpers.js'
import { generateSummary } from '../report.js'

const settings = Settings()

const store = new ContentStore('data')

export let successRate = new Rate('success')

export let options = {
    setupTimeout: '6h',
    duration: '24h',
    teardownTimeout: '6h',
    vus: 500,
    iterations: 1000,
    thresholds: {
        'iteration_duration{scenario:default}': [
            `max>=0`,
        ],
        'iteration_duration{group:::setup}': [`max>=0`],
        'iteration_duration{group:::teardown}': [`max>=0`],
    }
};

const harbor = new Harbor(settings.Harbor)

export function setup() {
    const projectName = `jfrog-proxycache`
    return {
        projectName
    }
}

export default function ({ projectName }) {
    // jfrog-proxycache should setup first
    // upstream registry should be contain these images
    let artifacts = [
        "bora-24776025/packages/vks-standard-packages@sha256:17e83405c756fb80ddf3c11161bf1e9e4f9d235facdfefedd588956460dd2572",
        "bora-24776025/packages/vks-standard-packages@sha256:41362e933c7ab65ec8ae7f10e54ebd24d9bba55bd8a109c08f3572218f9528f8",
        "bora-24776025/packages/vks-standard-packages@sha256:419de583d3814af5a82d7e16206c80b32d9912362c304e70368a47d50c5db442",
        "bora-24776025/packages/vks-standard-packages@sha256:47bf866ba27b183c4f0478898395e9bee7f708e2b95e8c2c612afc753d92c041",
        "bora-24776025/packages/vks-standard-packages@sha256:4fcd011413379ff09e86f4309c9b81cf055665381586f61433aa0dbf7d47da7c",
        "bora-24776025/packages/vks-standard-packages@sha256:51070d14811bf6fc4abc87e88caed9147e0029b07e28a9efdac7f05db88b195b",
        "bora-24776025/packages/vks-standard-packages@sha256:6610df884380ca36a925e6ef70ae2549a6ea95d6654d39cc687294873fbea134",
        "bora-24776025/packages/vks-standard-packages@sha256:bd670d49d14bcd88195e0b3ada2735e7a6e93a8ec31aae1c04828c218d4539d1",
        "bora-24776025/packages/vks-standard-packages@sha256:bebef0028eb39e695228930d6526535a86269a9ea60fb89c118352eed6f2eebf",
        "bora-24776025/packages/vks-standard-packages@sha256:fe2185dd849b4c1d6740f83fe4da06a8b61600786ef79d409ec3bc41d1e0d0f4"
    ]
    let item = randomItem(artifacts)
    const [repository, ref] = item.split('@')
    try {
        harbor.pull(`${projectName}/${repository}@${ref}`, { discard: true })
        successRate.add(true)
    } catch (e) {
        successRate.add(false)
        console.log(e)
    }
    console.log(`Pulling artifact from ${projectName}/${repository}@${ref}`)
}

export function teardown({ projectName }) {
    harbor.free()
}

export function handleSummary(data) {
    return generateSummary('pull-artifacts-from-proxycache')(data)
}

