(function() {
  document.addEventListener("DOMContentLoaded", function(e) {
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

    document.getElementById('multisig').addEventListener('click', function(e) {
      const m = document.getElementById('m');
      const n = document.getElementById('n');

      const hidden = document.getElementsByClassName('multisig hide');
      const shown = document.getElementsByClassName('show');
      const generate = document.getElementsByClassName('generate');

      e.preventDefault();

      while (hidden.length > 0) {
        hidden[0].classList.remove('hide');
      }

      for (let i = 0; i < shown.length; i++) {
        shown[i].classList.add('hide');
      }

      for (let i = 0; i < generate.length; i++) {
        generate[i].classList.add('hide');
      }

      function updateMultisigDetails(m, pubkeys) {
        if (pubkeys.length) {
          const multisig = FaucetTool.createMultisig(tool.getNetwork(), m, pubkeys);

          FaucetTool.encryptData(multisig.address).then(function(ciphertext) {
            const canvas = document.getElementById('multi-canvas');

            QRCode.toCanvas(canvas, ciphertext, function(err, canvas) {
              if (err) {
                throw new Error(err);
              }

              document.getElementById('multi-plaintext').innerHTML = multisig.address;
              document.getElementById('multi-ciphertext').innerHTML = ciphertext;
              document.getElementById('redeem').innerHTML = multisig.redeemScript;
              document.getElementById('of').innerHTML = `&nbsp;of&nbsp;${pubkeys.length}`;
            });
          })
          .catch(function(err) {
            const errorBox = document.getElementById('error-box');
            errorBox.classList.remove('hide');
            errorBox.innerHTML = err;
          });
        } else {
          m.innerHTML = '<option>M</option>';
          document.getElementById('of').innerHTML = '&nbsp;of&nbsp;N';
        }
      }

      document.getElementById('signers').addEventListener('input', function(e) {
        const signers = document.getElementById('signers').value;
        const pubkeys = signers.split(/[^A-Za-z0-9]+/g).filter(function(pubkey) {
          return FaucetTool.isValidPubkey(pubkey);
        })

        // Rebuild the signer list and [m]-of-n select.
        m.innerHTML = '';
        n.innerHTML = '';

        pubkeys.forEach(function(key, i) {
          m.innerHTML += `<option>${i+1}</option>`;
          n.innerHTML += `<tr><td class='head'>${i+1}.</td><td>${key}</td></tr>`;
        });

        updateMultisigDetails(m.selectedIndex + 1, pubkeys);
      });

      document.getElementById('m').addEventListener('change', function(e) {
        const signers = document.getElementById('signers').value;
        const pubkeys = signers.split(/[^A-Za-z0-9]+/g).filter(function(pubkey) {
          return FaucetTool.isValidPubkey(pubkey);
        });

        updateMultisigDetails(m.selectedIndex + 1, pubkeys);
      });
    });
  });
}());
