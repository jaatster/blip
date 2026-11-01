// Dashboard template: the period changes the numbers; Export and the menu answer with toasts; one welcome toast.
const $ = (s, r = document) => r.querySelector(s);
const toaster = async () => { await customElements.whenDefined("pp-toaster"); return $("pp-toaster"); };
const DATA = {
  day: [["312", "+8% on yesterday", "up"], ["1,180", "+2%", "up"], ["7K", "-1%", "down"], ["1", "-2: good news", "down"]],
  week: [["1,204", "+12% on last week", "up"], ["8,812", "+4%", "up"], ["54K", "-3%", "down"], ["7", "-9: good news", "down"]],
  month: [["4,980", "+31% on last month", "up"], ["36,402", "+18%", "up"], ["231K", "+6%", "up"], ["29", "+3", "up"]],
};
$(".tpl-range")?.addEventListener("pp-change", (e) => {
  const rows = DATA[e.detail.value] ?? DATA.week;
  document.querySelectorAll(".tpl-stats > .pp-stat").forEach((stat, i) => {
    const [value, delta, trend] = rows[i];
    const v = stat.querySelector(".pp-stat-value"), d = stat.querySelector(".pp-stat-delta");
    v.textContent = value;
    d.textContent = delta;
    d.dataset.trend = trend;
    if (i === 3) d.dataset.tone = trend === "down" ? "success" : "danger";
  });
});
$(".tpl-export")?.addEventListener("click", async () => (await toaster())?.add({ title: "Leaderboard exported", body: "leaderboard-this-week.csv, 7 players.", tone: "success" }));
document.addEventListener("click", async (e) => {
  const item = e.target.closest?.("[data-toast]");
  if (item) (await toaster())?.add({ title: item.dataset.toast });
});
$(".tpl-dash-alerts")?.addEventListener("click", async () => (await toaster())?.add({ title: "5 reports waiting", body: "Bo Wren was reported in Crystal Caves.", tone: "warning", action: { label: "Review" } }));
setTimeout(async () => (await toaster())?.add({ title: "Season 3 starts in 2 days", body: "Night Woods opens at 18:00 for everyone.", tone: "info" }), 1200);
