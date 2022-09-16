// main.js
let pathname
let rounds
let titulares = []
const red = '#e74c3c'
const green = '#5cb85c'

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
                addDiv(element.parentElement, total + 'M', 'font-weight:bold;')
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
                    // if (player === 'ter-stegen') {
                    const { data } = await fetchData(
                        `/players/la-liga/${player}?lang=es&fields=*%2Cteam%2Cfitness%2Creports(points%2Chome%2Cevents%2Cstatus(status%2CstatusInfo)%2Cmatch(*%2Cround%2Chome%2Caway)%2Cstar)%2Cprices%2Ccompetition%2Cseasons%2Cnews%2Cthreads&callback=jsonp_1457817899`
                    )

                    const { seasons, reports } = data
                    const season_this = seasons[0]
                    const season_last = seasons[1]

                    const data_lastseason =
                        season_last !== undefined
                            ? await fetchData(
                                  `/players/la-liga/${player}?lang=es&season=${season_last.id}&fields=*%2Cteam%2Cfitness%2Creports(points%2Chome%2Cevents%2Cstatus(status%2CstatusInfo)%2Cmatch(*%2Cround%2Chome%2Caway)%2Cstar)%2Cprices%2Ccompetition%2Cseasons%2Cnews%2Cthreads&callback=jsonp_1457817899`
                              )
                            : undefined

                    // FETCH TITULARES
                    if (titulares.length === 0 && reports.length > 0) {
                        const last_game =
                            reports[reports.length - 1].match.round

                        rounds = await fetchData(
                            `/rounds/la-liga/${last_game.id + 1}`
                        )
                        rounds.data.games.forEach((game) => {
                            game.home.reports.forEach((p) => {
                                titulares.push(p.player.slug)
                            })
                            game.away.reports.forEach((p) => {
                                titulares.push(p.player.slug)
                            })
                        })
                    }

                    // ADD TITULAR ICON
                    if (titulares.length > 0) {
                        addDiv(
                            element.parentElement,
                            rounds.data.short,
                            `
                                width: 16px;
                                height: 15px;
                                border-radius: 2px;
                                float: left;
                                margin-right: 2px;
                                text-align:center;
                                color:white;
                                background: ${
                                    titulares.includes(player)
                                        ? '#73ce49'
                                        : '#e7604f'
                                };
                                `
                        )
                    }

                    // POINTS
                    const points_thisseason =
                        getAveragePointsSeason(season_this)

                    // BIDS
                    if (pathname === '/market') {
                        const bids = await fetchData(`/market/bids`, {
                            method: 'POST',
                            body: { player: data.id },
                        })

                        addTable(element.parentElement, [
                            createSpan(
                                `${bids.data} pujas`,
                                `font-weight:bold;color:${
                                    bids.data === 0 ? green : 'black'
                                }`
                            ),
                        ])

                        // await waitFor(200)
                    }

                    //UNDERVALUE
                    const { price } = data
                    const price_max = Math.max.apply(
                        Math,
                        data.prices.map((p) => p[1])
                    )
                    const undervalued = Math.round(
                        100 - (price * 100) / price_max
                    )

                    addTable(element.parentElement, [
                        `${(price_max / 1000000).toFixed(2)}M`,
                        createSpan(
                            `-${undervalued}%`,
                            `color:${undervalued > 50 ? green : red}`
                        ),
                    ])

                    // MINUTES and POINTS
                    const average_minutes_thisseason =
                        getAverageMinutesSeason(reports)

                    createAndAddTableData(
                        element.parentElement,
                        season_this,
                        points_thisseason,
                        average_minutes_thisseason
                    )

                    if (season_last !== undefined) {
                        const points_lastseason =
                            getAveragePointsSeason(season_last)
                        const average_minutes_lastseason =
                            getAverageMinutesSeason(
                                data_lastseason.data.reports
                            )

                        createAndAddTableData(
                            element.parentElement,
                            season_last,
                            points_lastseason,
                            average_minutes_lastseason
                        )
                    }
                    // }

                    await waitFor(100)
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
    button1.style = `
        background: #73ce49;
        box-shadow: 0px 3px #55b528;
        position: fixed;
        z-index: 999999;
        bottom: 7px;
        font-weight: bold;
        border: 0px;
        border-radius: 25px;
        padding: 9px 20px;
        left: 5px;
    `
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

function createAndAddTableData(element, season, points, average) {
    addTable(element, [
        season.id,
        createSpan(
            (points || 0).toFixed(1),
            `color:${points > 4 ? green : red}`
        ),
        createSpan(
            `${average.mins}'`,
            `color:${average.mins > 45 ? green : red}`
        ),
        createSpan(
            `${average.starting}/${average.matches_available}`,
            `color:${
                average.starting > average.matches_available / 2 ? green : red
            }`
        ),
    ])
}

function getAverageMinutesSeason(matches) {
    const minutes = []
    let starting = 0
    let matches_available = matches.length
    matches.forEach((match) => {
        if (
            match.status?.status !== 'injured' &&
            match.status?.status !== 'sanctioned'
        ) {
            const entra = match.events?.find((e) => e.type === 5)
            const sale = match.events?.find((e) => e.type === 4)

            if (match.hasOwnProperty('points')) {
                m = 90
                starting += 1
            } else {
                m = 0
            }
            if (entra !== undefined) {
                m = m - entra.metadata
                starting -= 1
            } else if (sale !== undefined) {
                m = sale.metadata
            }

            minutes.push(m)
        } else {
            matches_available -= 1
        }
    })
    return {
        mins: Math.round(averageArray(minutes)),
        starting,
        matches_available,
    }
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

function addDiv(parentElement, text, styles) {
    const element = document.createElement('div')
    element.style = 'font-size: 85%;' + styles
    if (typeof text === 'string') {
        element.innerHTML = text
    } else {
        element.appendChild(text)
    }
    parentElement.appendChild(element)
}

function addTable(parentElement, rows, styles) {
    const element = document.createElement('table')
    element.style = 'font-size: 85%;' + styles
    rows.forEach((row) => {
        const td = document.createElement('td')
        td.style = `width:${
            100 / rows.length
        }%; padding:2px; border:1px solid #ececec;`
        if (typeof row === 'string') {
            td.innerHTML = row
        } else {
            td.appendChild(row)
        }
        element.appendChild(td)
    })
    parentElement.appendChild(element)
}

function createSpan(text, styles) {
    const element = document.createElement('span')
    element.style = styles
    element.innerHTML = text
    return element
}

//JORNADAPERFECTA
// fetch(
//     `https://api.allorigins.win/get?url=${encodeURIComponent(
//         'https://www.jornadaperfecta.com/equipo/elche/'
//     )}`
// )
//     .then((response) => {
//         if (response.ok) return response.json()
//         throw new Error('Network response was not ok.')
//     })
//     .then((data) => console.log(data.contents))
