import Docker from 'dockerode'
import express from 'express'
import * as fs from 'fs'

const app = express()
const docker = new Docker()
const port = 8080
const portalImage = 'clubnull/portal:production'

let isUpdating = false

function log(m) {
    console.log(m)
}

async function atomic(f) {
    while (isUpdating) ;
    isUpdating = true
    if (f.constructor.name === 'AsyncFunction') await f()
    else f()
    isUpdating = false
}

function createContainer(runner = false, port = 3000) {
    return new Promise(resolve => {
        const auth = {
            username: 'clubnull',
            password: fs.readFileSync('/portal/secret/docker').toString().trim(),
            auth: '',
            email: 'iasa.system@gmail.com',
            serveraddress: 'https://index.docker.io/v1'
        }
        docker.pull(runner ? 'clubnull/portal:nginx' : portalImage, {'authconfig': auth}, async (err, stream) => {
            docker.modem.followProgress(stream, onFinished)

            function onFinished(err, output) {
                log('Pulled image successfully. Creating container...')
                setTimeout(async () => {
                    const container = await docker.createContainer({
                        Image: runner ? 'clubnull/portal:nginx' : portalImage,
                        "HostConfig": {
                            "PortBindings": {
                                "80/tcp": [
                                    {"HostPort": port.toString()}
                                ]
                            }
                        },
                        ExposedPorts: {
                            "80/tcp": {}
                        }
                    })
                    try {
                        container.start()
                    } catch (e) {

                    }
                    resolve(container)
                }, 500)
            }
        })
    })
}

function getContainerList(runner = false) {
    return new Promise(resolve => {
        docker.listContainers({all: true}, async (e, containers) => {
            let portalContainers = []
            for (let container of containers) {
                if (!runner && container.Image === portalImage) {
                    portalContainers.push(container)
                } else if (runner && container.Image === 'clubnull/portal:nginx') {
                    portalContainers.push(container)
                }
            }
            resolve(portalContainers)
        })
    })
}

async function main() {
    if (!isUpdating) {
        const containers = await getContainerList() as any[]
        const nginxContainers = await getContainerList(true) as any[]
        if (containers.length > 1) {
            const overContainers = containers.slice(1)
            for (let container of overContainers) {
                docker.getContainer(container.Id).remove({force: true})
            }
        } else if (containers.length === 0) {
            await atomic(async () => {
                log('Creating new container because no portal container exists...')
                containers.push(await createContainer())
                log('Created new container!')
            })
            return
        }
        if (containers[0].State !== 'running') {
            await atomic(async () => {
                log('Restarting container...')
                try {
                    docker.getContainer(containers[0].Id).start()
                } catch (e) {

                }
                log('Restarted container!')
            })
        }

        if (nginxContainers.length > 1) {
            const overContainers = nginxContainers.slice(1)
            for (let container of overContainers) {
                docker.getContainer(container.Id).remove({force: true})
            }
        } else if (nginxContainers.length === 0) {
            await atomic(async () => {
                log('Creating new container because no runner container exists...')
                nginxContainers.push(await createContainer(true, 80))
                log('Created new container!')
            })
            return
        }
        if (nginxContainers[0].State !== 'running') {
            await atomic(async () => {
                log('Restarting runner container...')
                try {
                    docker.getContainer(nginxContainers[0].Id).start()
                } catch (e) {

                }
                log('Restarted runner container!')
            })
        }
    }
}

async function update() {
    await atomic(async () => {
        log('Updating container...')
        let containers = await getContainerList()
        let newPort = 3000
        if (containers[0].Ports[0].PublicPort === 3000) newPort = 3001
        log(`Creating newer container with port ${newPort}...`)
        await createContainer(false, newPort)
        setTimeout(() => {
            log('Removing legacy container...')
            docker.getContainer(containers[0].Id).remove({force: true})
            console.log('Updated container!')
        }, 3000)
    })
}

app.get('/version', async (req, res) => {
    await atomic(async () => {
        let containers = await getContainerList()
        res.send(containers[0].ImageID)
    })
})

app.get('/update', async (req, res) => {
    if (isUpdating) {
        res.send(false)
        return
    }
    await update()
    res.send(true)
})

app.listen(port, () => {
    console.log(`server is listening at localhost:${port}`)
})

main()
setInterval(main, 10000)
