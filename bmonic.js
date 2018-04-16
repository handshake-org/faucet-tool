/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */


const ENTROPY = 256

const Mnemonic = require('./mnemonic');
const HDPrivateKey = require('./private');

function bMonic (params) {

  this.newKey = () => {
	  const mnemonic = new Mnemonic({language: params.lang, bits: ENTROPY})
    const phrase = mnemonic.getPhrase()
    return phrase
  }

  this.importKey = (phrase) => {
    const mnemonic = new Mnemonic({phrase: phrase})
    const key = HDPrivateKey.fromMnemonic(mnemonic)
    return key.privateKey.toString('hex')
  }
}

window.bMonic = bMonic


