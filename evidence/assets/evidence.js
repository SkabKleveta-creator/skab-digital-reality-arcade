// Skab Evidence Archive v0.2
// Purpose: small progressive enhancement only; pages must remain readable without JS.

(function(){
  const form = document.querySelector("[data-evidence-feedback-form]");
  if (!form) return;

  const pageField = form.querySelector('input[name="evidence_page_url"]');
  const dateField = form.querySelector('input[name="client_submission_date"]');
  if (pageField) pageField.value = window.location.href;
  if (dateField) dateField.value = new Date().toISOString();

  // If the form action is still the placeholder, prevent false submission.
  form.addEventListener("submit", function(evt){
    const action = form.getAttribute("action") || "";
    if (action.includes("YOUR_FORM_ID_HERE")) {
      evt.preventDefault();
      alert("Feedback intake is not connected yet. Ken must replace YOUR_FORM_ID_HERE with the approved form endpoint routing to kenneth.kleveta@gmail.com.");
    }
  });
})();
