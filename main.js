// main.js
let pathname

document.body.onload = () => {
    function checkPath() {
        if (pathname !== location.pathname) {
            pathname = location.pathname
            onChangePath(pathname)
        }
    }

    function onChangePath(pathname) {
        if (pathname === '/league') {
            showMoney()
        }

        // showAverages();
    }

    async function showMoney() {
        const { data } = await fetchData(
            '/league?include=all&fields=*,standings,tournaments,group,settings(description)'
        )
        Array.from(document.getElementsByTagName('balance')).forEach(
            (element, index) => {
                const { balance, teamValue } = data.standings[index]
                const total = ((balance + teamValue) / 1000000).toFixed(1)
                //   e.innerText += ` <strong>(${total})</strong>`;
                const newelement = document.createElement('div')
                newelement.innerHTML = total
                newelement.style.fontWeight = 'bold'
                element.parentElement.appendChild(newelement)
            }
        )
    }

    async function showAverages() {
        const elements = Array.from(document.getElementsByTagName('a'))
        for (let index = 0; index < elements.length; ++index) {
            const element = elements[index]
            if (element?.firstChild?.nodeType === 3) {
                const slug = '/la-liga/players/'
                const indexOf = element.href.indexOf(slug)

                if (indexOf > -1) {
                    const player = element.href.slice(indexOf + slug.length)
                    // if (player === "balenziaga") {
                    const { data } = await fetchData(
                        `/players/la-liga/${player}?lang=es&fields=*%2Cteam%2Cfitness%2Creports(points%2Chome%2Cevents%2Cstatus(status%2CstatusInfo)%2Cmatch(*%2Cround%2Chome%2Caway)%2Cstar)%2Cprices%2Ccompetition%2Cseasons%2Cnews%2Cthreads&callback=jsonp_1457817899`
                    )
                    const { seasons, reports } = data
                    const season_thisyear = seasons[0]
                    const season_lastyear = seasons[1]

                    // POINTS
                    const points_thisyear =
                        getAveragePointsSeason(season_thisyear)
                    const points_lastyear =
                        getAveragePointsSeason(season_lastyear)

                    // MINUTES
                    const minutes = []
                    reports.forEach((report) => {
                        if (
                            report.status?.status !== 'injured' &&
                            report.status?.status !== 'sanctioned'
                        ) {
                            const entra = report.events?.find(
                                (e) => e.type === 5
                            )
                            const sale = report.events?.find(
                                (e) => e.type === 4
                            )

                            let m = report.hasOwnProperty('points') ? 90 : 0
                            if (entra !== undefined) {
                                m = m - entra.metadata
                            } else if (sale !== undefined) {
                                m = sale.metadata
                            }

                            minutes.push(m)
                        }
                    })
                    const average_minutes = Math.round(averageArray(minutes))

                    addDiv(
                        element.parentElement,
                        `${season_thisyear.id}: ${(
                            points_thisyear || 0
                        ).toFixed(1)} - ${average_minutes}'`
                    )
                    if (season_lastyear !== undefined) {
                        addDiv(
                            element.parentElement,
                            `${season_lastyear.id}: ${(
                                points_lastyear || 0
                            ).toFixed(1)}`
                        )
                    }

                    // BIDS
                    if (pathname === '/market') {
                        const bids = await fetchData(`/market/bids`, {
                            method: 'POST',
                            body: { player: data.id },
                        })
                        addDiv(element.parentElement, `bids: ${bids.data}`)
                        await waitFor(100)
                    }

                    // }
                }
            }
        }
    }

    checkPath()
    setInterval(checkPath, 1000)

    // Loading layout
    const div = document.createElement('div')
    div.style.position = 'fixed'
    div.style.zIndex = '999999'
    div.style.bottom = '0'
    document.body.appendChild(div)

    const button1 = document.createElement('button')
    button1.innerHTML = `SHOW`
    button1.onclick = showAverages
    button1.style =
        'position: fixed;z-index: 999999;bottom: 0px;/* font-size: 17px; */font-weight: bold;background: #62cb31;padding: 7px;'
    div.appendChild(button1)
}

async function fetchData(endpoint, { method = 'GET', body = {} } = {}) {
    const lastSession = JSON.parse(localStorage.getItem('lastSession'))
    const token = localStorage.getItem('satellizer_token')
    const locale = localStorage.getItem('locale')
    const league = localStorage.getItem('league')

    const options = {
        method,
        headers: {
            accept: 'application/json, text/plain, */*',
            'content-type': 'application/json; charset=utf-8',
            authorization: `Bearer ${token}`,
            'x-lang': locale,
            'x-league': league,
            'x-user': lastSession.leagues[0].user.id,
            'x-version': lastSession.version,
        },
    }
    if (method === 'POST') {
        options.body = JSON.stringify(body)
    }

    const response = await fetch(
        `https://biwenger.as.com/api/v2${endpoint}`,
        options
    )

    return response.json()
}

function getAveragePointsSeason(season) {
    if (season !== undefined && season.points !== undefined) {
        const points = Object.values(season.points)
            .filter((p) => p !== null)
            .map(Number)
        return points.length === 0 ? 0 : averageArray(points) / season.games
    }
}

function averageArray(array) {
    return array.length > 0
        ? array.reduce((a, b) => a + b, 0) / array.length
        : 0
}

function waitFor(timeout) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout)
    })
}

function addDiv(parentElement, text) {
    const element = document.createElement('div')
    element.innerHTML = text
    element.style = 'font-size: 85%'
    parentElement.appendChild(element)
}
