/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */


const Mnemonic = require('./mnemonic');
const HDPrivateKey = require('./private');


function bMonic (params) {

  this.newEncKey = (passphrase) => {
    if(passphrase.length < 15) { throw new Error('passphrase must be at least 15 chars') }
    const pass = Buffer.from(passphrase)
	  const mnemonic = new Mnemonic({language: params.lang})
    const phrase = mnemonic.getPhrase()
    const key = HDPrivateKey.fromMnemonic(mnemonic, pass);
    key.phrase = phrase
    return key
  }

  this.decodeKey = (params) => {
    const pass = Buffer.from(params.pass)
    const mnemonic = new Mnemonic({phrase: params.phrase})
    const key = HDPrivateKey.fromMnemonic(mnemonic, pass)
    return key
  }
}

window.bMonic = bMonic


