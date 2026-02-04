// ===== VARIÁVEIS GLOBAIS =====
let entregas = carregar() || [];

const nomeInput = document.getElementById("nome");
const enderecoInput = document.getElementById("endereco");
const lista = document.getElementById("lista");
const modal = document.getElementById("modal");
const relatorio = document.getElementById("relatorio");

// ===== ADICIONAR ENTREGA =====
async function adicionarEntrega() {
  const nome = nomeInput.value.trim();
  const endereco = enderecoInput.value.trim();

  if (!nome || !endereco) {
    alert("Preencha todos os campos");
    return;
  }

  let geo;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}`
    );
    geo = await res.json();
  } catch (e) {
    alert("Erro ao localizar endereço");
    return;
  }

  if (!geo || geo.length === 0) {
    alert("Endereço não encontrado");
    return;
  }

  entregas.push({
    nome,
    endereco,
    lat: Number(geo[0].lat),
    lon: Number(geo[0].lon),
    entregue: false,
    data: new Date().toISOString()
  });

  salvar(entregas);

  // limpa campos
  nomeInput.value = "";
  enderecoInput.value = "";

  fecharModal();
  atualizar();
}

// ===== ATUALIZAR LISTA E MAPA =====
async function atualizar() {
  if (entregas.length === 0) {
    lista.innerHTML = "<li>Nenhuma entrega cadastrada</li>";
    limparMarkers();
    return;
  }

  const loc = await getLocalizacao();

  entregas.forEach(e => {
    if (e.lat && e.lon) {
      e.dist = distancia(loc.latitude, loc.longitude, e.lat, e.lon);
    } else {
      e.dist = Infinity;
    }
  });

  // ordena por distância
  entregas.sort((a, b) => a.dist - b.dist);
  salvar(entregas);

  lista.innerHTML = "";
  limparMarkers();

  entregas.forEach((e, i) => {
    addMarker(e.lat, e.lon, e.nome);

    lista.innerHTML += `
      <li class="${e.entregue ? "entregue" : ""}">
        <div class="num ${e.entregue ? "red" : "green"}">${i + 1}</div>

        <b>${e.nome}</b><br>
        ${e.endereco}<br>
        📏 ${e.dist !== Infinity ? e.dist.toFixed(2) + " km" : "-"}

        <a class="card-btn"
           target="_blank"
           href="https://www.google.com/maps?q=${e.lat},${e.lon}">
          🧭 IR PARA ENTREGA
        </a>

        <button onclick="marcar(${i})">
          ${e.entregue ? "✔ Entregue" : "Confirmar entrega"}
        </button>
      </li>
    `;
  });
}

// ===== MARCAR ENTREGA =====
function marcar(i) {
  entregas[i].entregue = true;
  salvar(entregas);
  atualizar();
}

// ===== MODAL =====
function abrirModal() {
  modal.style.display = "block";
}

function fecharModal() {
  modal.style.display = "none";
}

// ===== ROTA AUTOMÁTICA =====
function iniciarRota() {
  const pendentes = entregas.filter(e => !e.entregue);

  if (pendentes.length === 0) {
    alert("Nenhuma entrega pendente 🚚");
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {
    let url = `https://www.google.com/maps/dir/${pos.coords.latitude},${pos.coords.longitude}`;

    pendentes.forEach(e => {
      url += `/${e.lat},${e.lon}`;
    });

    window.open(url, "_blank");
  });
}

// ===== RELATÓRIO =====
function abrirRelatorio() {
  const total = entregas.length;
  const entregues = entregas.filter(e => e.entregue).length;
  const pendentes = total - entregues;

  let distanciaTotal = 0;
  entregas.forEach(e => {
    if (e.entregue && e.dist && e.dist !== Infinity) {
      distanciaTotal += e.dist;
    }
  });

  document.getElementById("conteudoRelatorio").innerHTML = `
    <p>📦 Total de entregas: <b>${total}</b></p>
    <p>✅ Entregues: <b>${entregues}</b></p>
    <p>⏳ Pendentes: <b>${pendentes}</b></p>
    <p>🛣️ Distância estimada: <b>${distanciaTotal.toFixed(2)} km</b></p>
  `;

  relatorio.style.display = "block";
}

function fecharRelatorio() {
  relatorio.style.display = "none";
}

function resetarDia() {
  if (!confirm("Deseja apagar todas as entregas do dia?")) return;

  entregas = [];
  salvar(entregas);
  atualizar();
  fecharRelatorio();
}

// ===== INICIALIZAÇÃO =====
window.onload = async () => {
  const loc = await getLocalizacao();
  iniciarMapa(loc.latitude, loc.longitude);
  atualizar();
};
