fetch("https://raw.githubusercontent.com/noeldev/KoziExpandAll/main/KoziExpandAll.js")
    .then(response => response.text())
    .then(script => eval(script))
    .catch(error => console.error("Failed to load script:", error));
