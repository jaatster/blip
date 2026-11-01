// Landing template: the plan buttons and the letter answer honestly, as a template should, and the morning list's
// Add puts the new task on the list (the features' attract demo presses it).
const $ = (s, r = document) => r.querySelector(s);
const toaster = async () => { await customElements.whenDefined("blip-toaster"); return $("blip-toaster"); };
document.addEventListener("click", async (e) => {
  const b = e.target.closest?.(".tpl-plan-button");
  if (b) (await toaster())?.add({ title: `${b.dataset.plan}: nothing to buy here`, body: "Daybreak is made up for this template.", tone: "info" });
});
$(".tpl-signup")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.elements.email.value;
  (await toaster())?.add({ title: "Nothing was sent", body: `${email} stays with you: this letter is part of a template.`, tone: "success" });
  e.target.reset();
});
document.addEventListener("click", (e) => {
  if (!e.target.closest?.("#tpl-task-add")) return;
  const field = $("#tpl-task-field"), row = $("#tpl-task-new").closest("label");
  row.lastElementChild.textContent = field.value;
  row.hidden = false;
  field.value = "";
});
