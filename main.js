// main.js
let pathname;

document.body.onload = () => {
  function checkPath() {
    if (pathname !== location.pathname) {
      pathname = location.pathname;
      onChangePath(pathname);
    }
  }

  function onChangePath(pathname) {
    if (pathname === "/league") {
      showMoney();
    }

    showAverages();
  }

  async function showMoney() {
    const { data } = await fetchData(
      "/league?include=all&fields=*,standings,tournaments,group,settings(description)"
    );
    Array.from(document.getElementsByTagName("balance")).forEach(
      (element, index) => {
        const { balance, teamValue } = data.standings[index];
        const total = ((balance + teamValue) / 1000000).toFixed(1);
        //   e.innerText += ` <strong>(${total})</strong>`;
        const newelement = document.createElement("div");
        newelement.innerHTML = total;
        newelement.style.fontWeight = "bold";
        element.parentElement.appendChild(newelement);
      }
    );
  }

  async function showAverages() {
    Array.from(document.getElementsByTagName("a")).forEach(
      async (element, index) => {
        if (element.firstChild.nodeType === 3) {
          const slug = "/la-liga/players/";
          const indexOf = element.href.indexOf(slug);
          if (indexOf > -1) {
            const player = element.href.slice(indexOf + slug.length);
            // if (player === "ansu-fati") {
            const { data } = await fetchData(
              `/players/la-liga/${player}?lang=es&fields=*%2Cteam%2Cfitness%2Creports(points%2Chome%2Cevents%2Cstatus(status%2CstatusInfo)%2Cmatch(*%2Cround%2Chome%2Caway)%2Cstar)%2Cprices%2Ccompetition%2Cseasons%2Cnews%2Cthreads&callback=jsonp_1457817899`
            );
            // console.log(JSON.stringify(data));
            const { seasons, reports } = data;

            // POINTS
            const points_thisyear = getAveragePointsSeason(seasons[0]);
            const points_lastyear = getAveragePointsSeason(seasons[1]);
            // console.log({ points_thisyear, points_lastyear });
            const points_total =
              points_lastyear !== undefined
                ? (points_thisyear + points_lastyear) / 2
                : points_thisyear;
            const average_points = points_total.toFixed(1);

            // MINUTES
            const minutes = [];
            reports.forEach((report) => {
              if (
                report.status?.status !== "injured" &&
                report.status?.status !== "sanctioned"
              ) {
                const entra = report.events?.find((e) => e.type === 5);
                const sale = report.events?.find((e) => e.type === 4);

                let m = report.hasOwnProperty("points") ? 90 : 0;
                if (entra !== undefined) {
                  m = m - entra.metadata;
                } else if (sale !== undefined) {
                  m = sale.metadata;
                }

                minutes.push(m);
              }
            });
            // console.log(minutes, averageArray(minutes));
            const average_minutes = Math.round(averageArray(minutes));

            const newelement = document.createElement("div");
            newelement.innerHTML = `${average_points} - ${average_minutes}'`;
            newelement.style.fontWeight = "bold";
            element.parentElement.appendChild(newelement);
          }
          // }
        }
      }
    );
  }

  checkPath();
  setInterval(checkPath, 1000);
};

async function fetchData(endpoint, { method = "GET" } = {}) {
  const lastSession = JSON.parse(localStorage.getItem("lastSession"));
  const token = localStorage.getItem("satellizer_token");
  const locale = localStorage.getItem("locale");
  const league = localStorage.getItem("league");

  const response = await fetch(`https://biwenger.as.com/api/v2${endpoint}`, {
    method,
    headers: {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json; charset=utf-8",
      authorization: `Bearer ${token}`,
      "x-lang": locale,
      "x-league": league,
      "x-user": lastSession.leagues[0].user.id,
      "x-version": lastSession.version,
    },
  });

  return response.json();
}

function getAveragePointsSeason(season) {
  if (season !== undefined && season.points !== undefined) {
    const points = Object.values(season.points)
      .filter((p) => p !== null)
      .map(Number);
    return points.length === 0 ? 0 : averageArray(points) / season.games;
  }
}

function averageArray(array) {
  return array.length > 0 ? array.reduce((a, b) => a + b, 0) / array.length : 0;
}
