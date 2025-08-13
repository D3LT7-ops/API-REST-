let socket = new WebSocket("ws://localhost:3000");

// Conecta WebSocket
socket.onopen = () => console.log("Conectado ao servidor WebSocket Node.js");
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const container = document.getElementById("quotes");
    if(container) {
        container.innerHTML = `
            <p>Ticker: ${data.symbol}</p>
            <p>Preço: ${data.price}</p>
            <p>Volume: ${data.volume}</p>
            <hr>
        `;
    }
};

// Favoritos usando LocalStorage
function addFavorite(ticker) {
    let favs = JSON.parse(localStorage.getItem("favorites")) || [];
    if(!favs.includes(ticker)) {
        favs.push(ticker);
        localStorage.setItem("favorites", JSON.stringify(favs));
        alert("Favorito adicionado!");
    }
}

function removeFavorite(ticker) {
    let favs = JSON.parse(localStorage.getItem("favorites")) || [];
    favs = favs.filter(f => f !== ticker);
    localStorage.setItem("favorites", JSON.stringify(favs));
    renderFavorites();
}

function renderFavorites() {
    const container = document.getElementById("favorites-container");
    const favs = JSON.parse(localStorage.getItem("favorites")) || [];
    if(container) {
        container.innerHTML = "";
        favs.forEach(t => {
            const div = document.createElement("div");
            div.innerHTML = `
                <p>${t}</p>
                <button onclick="removeFavorite('${t}')">Remover</button>
            `;
            container.appendChild(div);
        });
    }
}

// Função para enviar ticker ao backend
function subscribeTicker() {
    const ticker = document.getElementById("ticker").value.toUpperCase();
    if(ticker) socket.send(JSON.stringify({ market: "NASDAQ", stock: ticker }));
}
