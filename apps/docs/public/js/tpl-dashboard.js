// Dashboard template: each nav item opens a view, chosen by the URL's # so Back and Forward work. The period changes
// the numbers; Players filters; Reports can be handled; Studio starts drafts; Community posts and likes; toasts answer.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const toaster = async () => { await customElements.whenDefined("blip-toaster"); return $("blip-toaster"); };
const toast = async (opts) => (await toaster())?.add(opts);

// ---------------------------------------------------------------- views

const GROUP = { overview: "live", players: "live", worlds: "live", activity: "live", reports: "live", studio: "studio", community: "community" };
const views = new Map($$(".tpl-view").map((v) => [v.id, v]));
let current = "overview";

function show(id, focus) {
  current = id;
  const view = views.get(id), title = view.querySelector("h1").textContent;
  for (const [key, v] of views) v.toggleAttribute("data-current", key === id);
  for (const a of $$(".tpl-dash-side a[href^='#'], .tpl-dash-bottom a[href^='#']")) {
    if (a.getAttribute("href") === `#${id}`) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
  for (const a of $$(".tpl-dash-bar [data-group]")) {
    if (a.dataset.group === GROUP[id]) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
  // Live ops > Players; Studio and Community stand alone.
  const group = $(".tpl-crumb-group"), here = $(".tpl-crumb-here");
  group.hidden = GROUP[id] !== "live";
  here.textContent = title;
  here.setAttribute("href", `#${id}`);
  document.title = `${title} · Questboard · Blip`;
  if (focus) {
    scrollTo({ top: 0 });
    view.querySelector("h1").focus({ preventScroll: true });
  }
}

// A view's own #, or an anchor inside one (it opens that view); other anchors (the skip link) leave it be.
function route(focus) {
  const id = decodeURIComponent(location.hash.slice(1));
  if (views.has(id)) return show(id, focus);
  const inside = id && document.getElementById(id)?.closest(".tpl-view");
  if (inside) show(inside.id, false);
  else if (!id) show("overview", focus);
}
addEventListener("hashchange", () => route(true));
route(false);

// ---------------------------------------------------------------- overview

const DATA = {
  day: [["312", "+8% on yesterday", "up"], ["1,180", "+2%", "up"], ["7K", "-1%", "down"], ["1", "-2: good news", "down"]],
  week: [["1,204", "+12% on last week", "up"], ["8,812", "+4%", "up"], ["54K", "-3%", "down"], ["7", "-9: good news", "down"]],
  month: [["4,980", "+31% on last month", "up"], ["36,402", "+18%", "up"], ["231K", "+6%", "up"], ["29", "+3", "up"]],
};
$(".tpl-range")?.addEventListener("blip-change", (e) => {
  const rows = DATA[e.detail.value] ?? DATA.week;
  $$(".tpl-stats > .blip-stat").forEach((stat, i) => {
    const [value, delta, trend] = rows[i];
    const v = stat.querySelector(".blip-stat-value"), d = stat.querySelector(".blip-stat-delta");
    v.textContent = value;
    d.textContent = delta;
    d.dataset.trend = trend;
    if (i === 3) d.dataset.tone = trend === "down" ? "success" : "danger";
  });
});
$(".tpl-export")?.addEventListener("click", () => toast({ title: "Leaderboard exported", body: "leaderboard-this-week.csv, 7 players.", tone: "success" }));
document.addEventListener("click", (e) => {
  const item = e.target.closest?.("[data-toast]");
  if (item) toast({ title: item.dataset.toast });
});

// ---------------------------------------------------------------- players

const search = $(".tpl-player-search input"), filter = $(".tpl-player-filter");
function filterPlayers() {
  const q = search.value.trim().toLowerCase(), status = filter.value || "all";
  let shown = 0;
  for (const row of $$("#players tbody tr")) {
    const on = row.dataset.name.includes(q) && (status === "all" || row.dataset.status === status);
    row.hidden = !on;
    shown += on;
  }
  $("#roster-cap").textContent = `128 players, ${shown} shown`;
  $("#players .tpl-none").textContent = shown ? "" : "No player matches. Try fewer letters, or All.";
}
search?.addEventListener("input", filterPlayers);
filter?.addEventListener("blip-change", filterPlayers);

// ---------------------------------------------------------------- activity

const OLDER = [
  ["Rory Fen", "orange", "cleared Lava Zone 4-1", "1 star in 7:58", "1 h ago"],
  ["Cy Hale", "slate", "joined co-op", "With Rory Fen, Lava Zone", "3 h ago"],
  ["Hal Moon", "blue", "started playing", "Welcome to the meadow", "2 days ago"],
];
$(".tpl-older")?.addEventListener("click", (e) => {
  const list = $(".tpl-feed"), sample = list.lastElementChild;
  for (const [who, tone, what, detail, when] of OLDER) {
    const li = sample.cloneNode(true);
    const avatar = li.querySelector(".blip-avatar");
    avatar.textContent = who[0];
    avatar.dataset.tone = tone;
    li.querySelector(".blip-list-title").textContent = `${who} ${what}`;
    li.querySelector(".blip-list-description").textContent = detail;
    li.querySelector(".blip-list-end span").textContent = when;
    list.append(li);
  }
  e.currentTarget.remove();
  toast({ title: "That's everything", body: "Activity goes back a week." });
});

// ---------------------------------------------------------------- reports

const badges = () => $$("a[href='#reports'] :is(.blip-sidebar-badge, .blip-bottom-bar-badge)");
$(".tpl-reports")?.addEventListener("click", (e) => {
  const button = e.target.closest("button[value]");
  if (!button) return;
  const row = button.closest("li"), who = row.dataset.who;
  const next = row.nextElementSibling ?? row.previousElementSibling;
  row.remove();
  const left = $$(".tpl-reports > li").length;
  $(".tpl-report-count").textContent = left;
  for (const b of badges()) {
    if (left) b.firstChild.nodeValue = left;
    else b.remove();
  }
  if (button.value === "warn") toast({ title: `${who} was warned`, body: "They'll see it when they next play.", tone: "warning" });
  else toast({ title: `Report on ${who} dismissed` });
  if (left) {
    next?.querySelector("button").focus();
  } else {
    $(".tpl-reports").hidden = true;
    $(".tpl-reports-alert").hidden = true;
    $(".tpl-reports-empty").hidden = false;
    $("#reports-title").focus();
  }
});

// ---------------------------------------------------------------- studio

const form = $(".tpl-new-level");
form?.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = form.elements.name, error = $("#level-name-error");
  if (name.value.trim().length < 3) {
    error.textContent = "Give it a name of 3 letters or more.";
    name.setAttribute("aria-invalid", "true");
    name.focus();
    return;
  }
  error.textContent = "";
  name.removeAttribute("aria-invalid");
  const list = $(".tpl-drafts"), li = list.lastElementChild.cloneNode(true);
  li.querySelector(".blip-list-title").textContent = name.value.trim();
  li.querySelector(".blip-list-description").textContent = form.elements.world.value;
  const tag = li.querySelector(".blip-tag");
  tag.textContent = "Draft";
  tag.dataset.tone = "neutral";
  list.prepend(li);
  toast({ title: "Draft started", body: `${name.value.trim()}, in ${form.elements.world.value}.`, tone: "success" });
  form.reset();
});

// ---------------------------------------------------------------- community

$(".tpl-posts")?.addEventListener("click", (e) => {
  const like = e.target.closest(".tpl-like");
  if (!like) return;
  const on = like.getAttribute("aria-pressed") !== "true", count = like.querySelector(".tpl-likes");
  like.setAttribute("aria-pressed", String(on));
  count.textContent = Number(count.textContent) + (on ? 1 : -1);
});
const compose = $(".tpl-compose");
compose?.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = compose.elements.text.value.trim();
  if (!text) return compose.elements.text.focus();
  const posts = $(".tpl-posts"), li = posts.firstElementChild.cloneNode(true);
  li.querySelector(".blip-card-subtitle").textContent = "Live ops · now";
  li.querySelector(".blip-card-body p").textContent = text;
  li.querySelector(".blip-tag").textContent = "News";
  const like = li.querySelector(".tpl-like");
  like.setAttribute("aria-pressed", "false");
  like.querySelector(".tpl-likes").textContent = "0";
  const avatar = li.querySelector(".blip-avatar");
  avatar.textContent = "M";
  avatar.dataset.tone = "accent";
  li.querySelector(".blip-card-title").textContent = "Mika";
  posts.prepend(li);
  compose.reset();
  toast({ title: "Posted", body: "Every player sees it on the title screen.", tone: "success" });
});

// ---------------------------------------------------------------- toasts

$(".tpl-dash-alerts")?.addEventListener("click", () => {
  const left = $$(".tpl-reports > li");
  if (!left.length) return toast({ title: "No reports waiting", tone: "success" });
  const first = left[0].querySelector(".blip-list-title").textContent;
  toast({ title: `${left.length} reports waiting`, body: `First up, ${first}.`, tone: "warning", action: { label: "Review", onClick: () => { location.hash = "#reports"; } } });
});
setTimeout(() => toast({ title: "Season 3 starts in 2 days", body: "Night Woods opens at 18:00 for everyone.", tone: "info" }), 1200);
