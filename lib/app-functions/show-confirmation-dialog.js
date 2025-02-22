export function showConfirmationDialog(message) {
  return new Promise(resolve => {
    const dialog = document.createElement("dialog");
    dialog.innerHTML = `
      <div class="outerfaces-confirmation-dialog-container">
        <p class="outerfaces-confirmation-dialog-message">${message}</p>
        <div class="mt-1 flex space-around">
          <button id="outerfaces-confirm-yes">Yes</button>
          <button id="outerfaces-confirm-no">Cancel</button>
        </div>

      </div>
    `;
    
    document.body.appendChild(dialog);
    dialog.showModal();

    dialog.querySelector("#outerfaces-confirm-yes").addEventListener("click", () => {
      resolve(true);
      dialog.close();
      document.body.removeChild(dialog);
    });

    dialog.querySelector("#outerfaces-confirm-no").addEventListener("click", () => {
      resolve(false);
      dialog.close();
      document.body.removeChild(dialog);
    });
  });
}
