function getLocalizacao() {
  return new Promise((resolve, reject) => {

    if (!navigator.geolocation) {
      reject("Geolocalização não suportada");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos.coords),
      err => reject(err),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  });
}

function distancia(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) *
    Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2)**2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// 🔥 NOVA FUNÇÃO PARA PEGAR O ENDEREÇO REAL
async function obterEndereco(lat, lon) {

  const resposta = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
  );

  if (!resposta.ok) {
    throw new Error("Erro ao buscar endereço");
  }

  const dados = await resposta.json();

  return {
    cidade:
      dados.address.city ||
      dados.address.town ||
      dados.address.village ||
      dados.address.municipality ||
      "Cidade não encontrada",

    bairro:
      dados.address.suburb ||
      dados.address.neighbourhood ||
      dados.address.city_district ||
      "Bairro não encontrado",

    estado: dados.address.state || "",
    rua: dados.address.road || ""
  };
}
