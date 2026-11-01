const $ = (s) => document.querySelector(s);
const form = $("#form");

// Neighbourhoods the model was trained on (unknown ones are ignored by the encoder)
const NEIGHBOURHOODS = "Allerton|Arden Heights|Arrochar|Arverne|Astoria|Bath Beach|Battery Park City|Bay Ridge|Bay Terrace|Bay Terrace, Staten Island|Baychester|Bayside|Bayswater|Bedford-Stuyvesant|Belle Harbor|Bellerose|Belmont|Bensonhurst|Bergen Beach|Boerum Hill|Borough Park|Breezy Point|Briarwood|Brighton Beach|Bronxdale|Brooklyn Heights|Brownsville|Bull's Head|Bushwick|Cambria Heights|Canarsie|Carroll Gardens|Castle Hill|Castleton Corners|Chelsea|Chinatown|City Island|Civic Center|Claremont Village|Clason Point|Clifton|Clinton Hill|Co-op City|Cobble Hill|College Point|Columbia St|Concord|Concourse|Concourse Village|Coney Island|Corona|Crown Heights|Cypress Hills|DUMBO|Ditmars Steinway|Dongan Hills|Douglaston|Downtown Brooklyn|Dyker Heights|East Elmhurst|East Flatbush|East Harlem|East Morrisania|East New York|East Village|Eastchester|Edenwald|Edgemere|Elmhurst|Eltingville|Emerson Hill|Far Rockaway|Fieldston|Financial District|Flatbush|Flatiron District|Flatlands|Flushing|Fordham|Forest Hills|Fort Greene|Fort Hamilton|Fresh Meadows|Glendale|Gowanus|Gramercy|Graniteville|Grant City|Gravesend|Great Kills|Greenpoint|Greenwich Village|Grymes Hill|Harlem|Hell's Kitchen|Highbridge|Hollis|Holliswood|Howard Beach|Howland Hook|Huguenot|Hunts Point|Inwood|Jackson Heights|Jamaica|Jamaica Estates|Jamaica Hills|Kensington|Kew Gardens|Kew Gardens Hills|Kingsbridge|Kips Bay|Laurelton|Little Italy|Little Neck|Long Island City|Longwood|Lower East Side|Manhattan Beach|Marble Hill|Mariners Harbor|Maspeth|Melrose|Middle Village|Midland Beach|Midtown|Midwood|Mill Basin|Morningside Heights|Morris Heights|Morris Park|Morrisania|Mott Haven|Mount Eden|Mount Hope|Murray Hill|Navy Yard|Neponsit|New Brighton|New Dorp|New Dorp Beach|New Springville|NoHo|Nolita|North Riverdale|Norwood|Oakwood|Olinville|Ozone Park|Park Slope|Parkchester|Pelham Bay|Pelham Gardens|Port Morris|Port Richmond|Prince's Bay|Prospect Heights|Prospect-Lefferts Gardens|Queens Village|Randall Manor|Red Hook|Rego Park|Richmond Hill|Ridgewood|Riverdale|Rockaway Beach|Roosevelt Island|Rosebank|Rosedale|Rossville|Schuylerville|Sea Gate|Sheepshead Bay|Shore Acres|Silver Lake|SoHo|Soundview|South Beach|South Ozone Park|South Slope|Springfield Gardens|Spuyten Duyvil|St. Albans|St. George|Stapleton|Stuyvesant Town|Sunnyside|Sunset Park|Theater District|Throgs Neck|Todt Hill|Tompkinsville|Tottenville|Tremont|Tribeca|Two Bridges|Unionport|University Heights|Upper East Side|Upper West Side|Van Nest|Vinegar Hill|Wakefield|Washington Heights|West Brighton|West Farms|West Village|Westchester Square|Westerleigh|Whitestone|Williamsbridge|Williamsburg|Willowbrook|Windsor Terrace|Woodhaven|Woodlawn|Woodside".split("|");
$("#nbList").innerHTML = NEIGHBOURHOODS.map((n) => `<option value="${n}">`).join("");

// Same order as model.classes_
const ROOMS = [
  { name: "Entire home/apt", icon: "🏠", color: "#4fd1c5", blurb: "Guests get the whole place to themselves: kitchen, bathroom and all." },
  { name: "Private room", icon: "🚪", color: "#9a8cff", blurb: "A private bedroom inside a home, with some shared spaces." },
  { name: "Shared room", icon: "🛋️", color: "#ffd68c", blurb: "Guests sleep in a shared space, usually the cheapest option." },
];

const PRESETS = {
  loft: { neighbourhood_group: "Manhattan", neighbourhood: "Chelsea", latitude: 40.7465, longitude: -74.0014, price: 240, minimum_nights: 3, availability_365: 220, host_name: "Unknown", calculated_host_listings_count: 1, number_of_reviews: 48, reviews_per_month: 1.2 },
  room: { neighbourhood_group: "Brooklyn", neighbourhood: "Bushwick", latitude: 40.6944, longitude: -73.9213, price: 55, minimum_nights: 2, availability_365: 300, host_name: "Unknown", calculated_host_listings_count: 2, number_of_reviews: 22, reviews_per_month: 0.8 },
  bunk: { neighbourhood_group: "Queens", neighbourhood: "Jamaica", latitude: 40.7002, longitude: -73.8071, price: 28, minimum_nights: 1, availability_365: 350, host_name: "Unknown", calculated_host_listings_count: 6, number_of_reviews: 3, reviews_per_month: 0.2 },
};

function fill(data) {
  for (const [k, v] of Object.entries(data)) form.elements[k].value = v;
  $("#availOut").textContent = form.elements.availability_365.value;
}

document.querySelectorAll("[data-preset]").forEach((b) =>
  b.addEventListener("click", () => {
    fill(PRESETS[b.dataset.preset]);
    form.requestSubmit();
  })
);

form.elements.availability_365.addEventListener("input", (e) => ($("#availOut").textContent = e.target.value));

function countUp(el, to) {
  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min((t - t0) / 900, 1);
    el.textContent = (to * (1 - Math.pow(1 - p, 3))).toFixed(1) + "%";
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function showError(msg) {
  $("#empty").hidden = true;
  $("#out").hidden = true;
  const e = $("#error");
  e.textContent = msg;
  e.hidden = false;
}

function render(prediction, probs) {
  $("#error").hidden = true;
  $("#empty").hidden = true;
  $("#out").hidden = false;

  const idx = Math.max(0, ROOMS.findIndex((r) => r.name === prediction));
  const room = ROOMS[idx];
  const verdict = $("#verdict");
  verdict.style.setProperty("--c", room.color);
  verdict.classList.remove("pop");
  void verdict.offsetWidth; // restart the animation
  verdict.classList.add("pop");

  $("#icon").textContent = room.icon;
  $("#winner").textContent = room.name;
  $("#blurb").textContent = room.blurb;
  countUp($("#bigPct"), probs[idx] * 100);

  const bars = $("#bars");
  bars.innerHTML = ROOMS.map((r, i) => `
    <li style="--c:${r.color}">
      <div class="top"><span>${r.icon} ${r.name}</span><span>${(probs[i] * 100).toFixed(1)}%</span></div>
      <div class="track"><div class="fill"></div></div>
    </li>`).join("");
  requestAnimationFrame(() => requestAnimationFrame(() =>
    bars.querySelectorAll(".fill").forEach((f, i) => (f.style.width = probs[i] * 100 + "%"))
  ));
}

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const fd = Object.fromEntries(new FormData(form));
  let ok = true;
  [...form.elements].forEach((el) => {
    if (el.name && el.type !== "range") {
      const bad = !el.checkValidity() || (el.required && el.value === "");
      el.classList.toggle("bad", bad);
      if (bad) ok = false;
    }
  });
  if (!ok) return showError("Some fields are empty or out of range. Check the highlighted inputs.");

  const intKeys = ["minimum_nights", "number_of_reviews", "calculated_host_listings_count", "availability_365"];
  const floatKeys = ["latitude", "longitude", "price", "reviews_per_month"];
  intKeys.forEach((k) => (fd[k] = parseInt(fd[k], 10)));
  floatKeys.forEach((k) => (fd[k] = parseFloat(fd[k])));
  fd.host_name = fd.host_name.trim() || "Unknown";

  const btn = $("#go");
  btn.classList.add("loading");
  btn.disabled = true;
  try {
    const base = $("#apiUrl").value.replace(/\/+$/, "");
    const res = await fetch(base + "/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fd),
    });
    const data = await res.json();
    if (!res.ok) {
      const d = Array.isArray(data.detail) ? data.detail.map((x) => `${x.loc.at(-1)}: ${x.msg}`).join("\n") : data.detail;
      throw new Error(d || "The server rejected this request.");
    }
    render(data.Predicted_room_type, data.Probability);
  } catch (err) {
    showError(err instanceof TypeError
      ? "Could not reach the API. Start it with: uvicorn main:app --reload, then check the API address."
      : err.message);
  } finally {
    btn.classList.remove("loading");
    btn.disabled = false;
  }
});

// Night skyline with flickering windows
(function sky() {
  const c = $("#sky"), g = c.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W, H, blds;
  function layout() {
    W = c.width = innerWidth; H = c.height = innerHeight; blds = [];
    for (let x = 0; x < W; ) {
      const w = 40 + Math.random() * 60, h = H * (0.1 + Math.random() * 0.25), wins = [];
      for (let y = H - h + 10; y < H - 8; y += 14)
        for (let wx = x + 6; wx < x + w - 8; wx += 12) if (Math.random() > 0.45) wins.push({ x: wx, y, p: Math.random() * 20 });
      blds.push({ x, w, h, wins });
      x += w + 2;
    }
  }
  function draw(t) {
    g.clearRect(0, 0, W, H);
    for (const b of blds) {
      g.fillStyle = "#0e111c";
      g.fillRect(b.x, H - b.h, b.w, b.h);
      for (const w of b.wins) {
        g.fillStyle = `rgba(255,214,140,${0.1 + 0.3 * (0.5 + 0.5 * Math.sin(t / 1500 + w.p))})`;
        g.fillRect(w.x, w.y, 4, 6);
      }
    }
    if (!still) requestAnimationFrame(draw);
  }
  addEventListener("resize", () => { layout(); if (still) draw(0); });
  layout();
  requestAnimationFrame(draw);
})();
