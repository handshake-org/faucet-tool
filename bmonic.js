/*
 * Bmonic
 *
 * Repurposed lib for generating mnemonic keys 
 * and addresses in the browser. Uses
 * primitives/address.js and hd/private.js from hskd
 * but with Consensus and Network dependencies removed
 */

const ENTROPY = 256

const Mnemonic = require('./mnemonic');
const HDPrivateKey = require('./private');
const Address = require('./address')
const {bech32} = require('bstring')

function bMonic (params) {

  this.newKey = () => {
	  const mnemonic = new Mnemonic({language: params.lang, bits: ENTROPY})
    const key = HDPrivateKey.fromMnemonic(mnemonic)
    const phrase = mnemonic.getPhrase()

    const address = new Address()
    const addr = address.fromPubkey(key.publicKey)
    // probably not doing this right...
   
    return { 
      phrase: phrase,
      address: addr.toString('hex') // trying to bech32.test this and failing
    }
  }

  this.testAddr(addr) {
    // returns false
    return bech32.test(addr)
  }
}

window.bMonic = bMonic


