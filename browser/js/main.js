document.addEventListener("DOMContentLoaded", (e) => {
  const FaucetTool = faucetTool.FaucetTool;
  const tool = new FaucetTool();

  document.getElementById('generate').addEventListener('click', function(e) {
    const address = tool.getAddress();

    e.preventDefault();

    FaucetTool.encryptData(address).then(function(ciphertext) {
      const canvas = document.getElementById('canvas');
      const hidden = document.getElementsByClassName('generate hide');
      const shown = document.getElementsByClassName('show');

      QRCode.toCanvas(canvas, ciphertext, function(err, canvas) {
        if (err) {
          throw new Error(err);
        }

        document.getElementById('ciphertext').innerHTML = ciphertext;
        document.getElementById('phrase').innerHTML = tool.getPhrase();
        document.getElementById('plaintext').innerHTML = tool.getAddress();
        document.getElementById('privkey').innerHTML = tool.getPrivkey();
        document.getElementById('pubkey').innerHTML = tool.getPubkey();

        while (hidden.length > 0) {
          hidden[0].classList.remove('hide');
        }

        for (let i = 0; i < shown.length; i++) {
          shown[i].classList.add('hide');
        }
      });
    })
    .catch(function(err) {
      const errorBox = document.getElementById('error-box');
      errorBox.classList.remove('hide');
      errorBox.innerHTML = err;
    });
  });
});
