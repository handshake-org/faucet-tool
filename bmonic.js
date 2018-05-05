/*
 * Bmonic
 *
 * lib for generating mnemonic keys 
 * and addresses for Handshake with minimal deps. Uses
 * primitives/address.js and hd/private.js from hskd
 * but with Consensus and Network dependencies removed
 */

const ENTROPY = 256

const Mnemonic = require('./lib/mnemonic');
const HDPrivateKey = require('./lib/private');
const Address = require('./lib/address')
const {bech32} = require('bstring')

function bMonic (params) {

  this.newKey = () => {
	  const mnemonic = new Mnemonic({language: params.lang, bits: ENTROPY})
    const key = HDPrivateKey.fromMnemonic(mnemonic)
    const phrase = mnemonic.getPhrase()

    const address = new Address()
    const addr = address.fromPubkey(key.publicKey)
   
    return { 
      phrase: phrase,
      address: addr.toString('main') 
    }
  }

  this.testAddr = (addr) => {
    return bech32.test(addr) // returns false
  }
}

//window.bMonic = bMonic
module.exports = bMonic


