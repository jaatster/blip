// Landing template: the plan buttons and the letter answer honestly, as a template should.
const $ = (s, r = document) => r.querySelector(s);
const toaster = async () => { await customElements.whenDefined("pp-toaster"); return $("pp-toaster"); };
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
