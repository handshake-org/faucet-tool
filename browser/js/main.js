(function() {
  document.addEventListener("DOMContentLoaded", function(e) {
    const FaucetTool = faucetTool.FaucetTool;
    const tool = new FaucetTool();

    const toggleBtns = document.getElementsByClassName('key-toggle');

    for (let i = 0; i < toggleBtns.length; i++) {
      toggleBtns[i].addEventListener('click', function(e) {
        const elems = document.getElementsByClassName('toggle');

        e.preventDefault();

        for (let j = 0; j < elems.length; j++) {
          if (elems[j].classList.contains('hide')) {
            elems[j].classList.remove('hide');
          } else {
            elems[j].classList.add('hide');
          }
        }
      });
    }

    document.getElementById('participants').addEventListener('click', function(e) {
      const canvas = document.getElementById('canvas');
      const hidden = document.getElementsByClassName('participants hide');
      const shown = document.getElementsByClassName('show button');
      const address = tool.getAddress();

      e.preventDefault();

      document.getElementById('phrase').innerHTML = tool.getPhrase();
      document.getElementById('plaintext-participants').innerHTML = tool.getAddress();
      document.getElementById('privkey').innerHTML = tool.getPrivkey();
      document.getElementById('pubkey').innerHTML = tool.getPubkey();

      while (hidden.length > 0) {
        hidden[0].classList.remove('hide');
      }

      for (let i = 0; i < shown.length; i++) {
        shown[i].classList.add('hide');
      }
    });

    document.getElementById('sponsors').addEventListener('click', function(e) {
      const address = tool.getAddress();

      e.preventDefault();

      FaucetTool.encryptData(address).then(function(ciphertext) {
        const canvas = document.getElementById('canvas');
        const hidden = document.getElementsByClassName('sponsors hide');
        const shown = document.getElementsByClassName('show button');

        QRCode.toCanvas(canvas, ciphertext, function(err, canvas) {
          if (err) {
            throw new Error(err);
          }

          document.getElementById('ciphertext').innerHTML = ciphertext;
          document.getElementById('phrase').innerHTML = tool.getPhrase();
          document.getElementById('plaintext-sponsors').innerHTML = tool.getAddress();
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
}());
