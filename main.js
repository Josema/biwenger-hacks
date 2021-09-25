// main.js
let pathname;
document.body.onload = () => {
  async function onChangePath(pathname) {
    if (pathname === "/league") {
      showBalance();
    }
  }

  function showBalance() {
    const { data } = await fetchData(
      "https://biwenger.as.com/api/v2/league?include=all&fields=*,standings,tournaments,group,settings(description)"
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

  function checkPath() {
    if (pathname !== location.pathname) {
      pathname = location.pathname;
      onChangePath(pathname);
    }
  }

  checkPath();
  setInterval(checkPath, 1000);
};

async function fetchData(url) {
  const lastSession = JSON.parse(localStorage.getItem("lastSession"));
  const token = localStorage.getItem("satellizer_token");
  const locale = localStorage.getItem("locale");
  const league = localStorage.getItem("league");

  const response = await fetch(url, {
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
