/*
 * Bmonic
 *
 * lib for generating mnemonic seeds
 * and addresses for Handshake with minimal deps. Uses
 * primitives/address.js and hd/private.js from hskd
 * but with Consensus and Network dependencies removed
 */


const Address = require('./address')
const HDPrivateKey = require('./private')
const Mnemonic = require('./mnemonic')

const ENTROPY = 256
const HNS_COIN_TYPE = 5353

function bMonic (params) {

  this.newKey = () => {
    const mnemonic = new Mnemonic({language: params.lang, bits: ENTROPY})
    const master = HDPrivateKey.fromMnemonic(mnemonic)

    // Create a receive address from M/44'/5353'/0'/0/0.
    // This is the first receiving address of the default/first account.
    const child = master.deriveAccount(44, HNS_COIN_TYPE, 0).derive(0).derive(0)
    const addr = Address.fromPubkey(child.publicKey)

    return {
      phrase: mnemonic.getPhrase(),
      address: addr.toString('main')
    }
  }
}

module.exports = bMonic
