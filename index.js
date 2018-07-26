/**
 * Handshake Faucet Tool
 *
 * A simple library for generating mnemonic seeds and bech32 addresses for
 * Handshake with minimal deps. Uses modules from hskd with consensus and
 * network dependencies removed.
 */

const { bech32 } = require('bstring');
const openpgp = require('openpgp');

const { PGP_PUBKEY } = require('./data/pgp');
const Address = require('./lib/address');
const HDPrivateKey = require('./lib/private');
const KeyRing = require('./lib/keyring');
const Mnemonic = require('./lib/mnemonic');
const Script = require('./lib/script');
const secp256k1 = require('bcrypto/lib/secp256k1');

const ADDR_PREFIX = {
  'main': 'hs',
  'testnet': 'ts',
  'regtest': 'rs',
  'simnet': 'ss'
}
const BIP44_PURPOSE = 44;
const BIP44_COIN_TYPE = {
  'main': 5353,
  'testnet': 5354,
  'regtest': 5355,
  'simnet': 5356
};
const BIP44_ACCOUNT = 0;
const BIP44_CHANGE = 0;
const BIP44_ADDRESS_INDEX = 0;
const MAX_ENTROPY = 512;
const MIN_ENTROPY = 128;
const MAX_SCRIPT_PUSH = 520;
const VALID_OPT_VALS = {
  'network': ['main', 'testnet', 'regtest', 'simnet'],
  'language': ['chinese-simplified', 'chinese-traditional', 'english',
               'french', 'italian', 'japanese', 'korean', 'spanish']
};

/**
 * FaucetToolError
 * Custom error class for the FaucetTool library.
 */

class FaucetToolError extends Error {
  constructor(options) {
    super(options);
  }
}

// Private members
const account = new WeakMap();
const address = new WeakMap();
const network = new WeakMap();
const phrase = new WeakMap();
const privkey = new WeakMap();
const pubkey = new WeakMap();

/**
 * FaucetTool
 * A helper class exposing address generation functionality.
 * All members are private. This is implemented using WeakMap
 * objects available through a closure.
 */

class FaucetTool {

  /**
   * Create an instance of the FaucetTool.
   * @constructor
   * @param {Object?} options
   * @param {String} options.network - defaults to "main"
   * @param {String} options.language - defaults to "english"
   * @param {Number} options.bits - defaults to 256
   */

  constructor(options) {
    if (!options)
      options = {};

    if (options.network) {
      if(typeof options.network !== 'string')
        throw new FaucetToolError('network option must be a string');

      if (!VALID_OPT_VALS['network'].includes(options.network))
        throw new FaucetToolError(`invalid network: ${options.network}`);
    }

    if (options.language) {
      if(typeof options.language !== 'string')
        throw new FaucetToolError('language option must be a string');

      if (!VALID_OPT_VALS['language'].includes(options.language))
        throw new FaucetToolError(`invalid language: ${options.language}`);
    }

    if (options.bits) {
      if((options.bits >>> 0) !== options.bits)
        throw new FaucetToolError('bits option must be an integer');

      if(options.bits < MIN_ENTROPY || options.bits > MAX_ENTROPY)
        throw new FaucetToolError(`bits option out of range: ${options.bits}`);
    }

    const _network = options.network || 'main';
    const _mnemonic = new Mnemonic({
      language: options.language || 'english',
      bits: options.bits || 256
    });
    const _master = HDPrivateKey.fromMnemonic(_mnemonic);
    const _account = _master
      .deriveAccount(BIP44_PURPOSE, BIP44_COIN_TYPE[_network], BIP44_ACCOUNT);

    const _child = _account.derive(BIP44_CHANGE).derive(BIP44_ADDRESS_INDEX);
    const _keyring = KeyRing.fromPrivate(_child.privateKey);
    const _address = _keyring.getKeyAddress('string', _network);

    if (!FaucetTool.isValidAddress(_network, _address))
      throw new FaucetToolError(`invalid address generated: ${_address}`);

    account.set(this, _account);
    address.set(this, _address);
    network.set(this, _network);
    phrase.set(this, _mnemonic.getPhrase());
    privkey.set(this, _keyring.toSecret(_network));
    pubkey.set(this, _keyring.getPublicKey('hex'));
  }

  /**
   * Returns the receiving address
   * @returns {String} the receiving address
   */

  getAddress() {
    return address.get(this);
  }

  /**
   * Returns the network
   * @returns {String} the network
   */

  getNetwork() {
    return network.get(this);
  }

  /**
   * Returns the wallet's mnemonic seed phrase
   * @returns {String} the phrase
   */

  getPhrase() {
    return phrase.get(this);
  }

  /**
   * Returns the xpub associated with the default account
   * @returns {String} the xpub
   */
  getAccountXpub() {
    return account.get(this).xpubkey(network.get(this));
  }

  /**
   * Returns the pubkey associated with the receving address
   * @returns {String} the pubkey
   */

  getPubkey() {
    return pubkey.get(this);
  }

  /**
   * Returns the private key associated with the receving address
   * @returns {String} the private key
   */

  getPrivkey() {
    return privkey.get(this);
  }

  /**
   * Encrypts string data using the OpenPGP standard.
   * @param {String} data to encrypt
   * @param {String} armored pgp pubkey to use for encryption
   * @returns {String} armored encrypted data
   */

  static async encryptData(data, pubkey = PGP_PUBKEY) {
    const publicKeys = openpgp.key.readArmored(pubkey).keys;
    return (await openpgp.encrypt({ data, publicKeys })).data;
  }

  /**
   * Validates bech32 Handshake addresses
   * @param {String} network
   * @param {String} addresses
   * @returns {Boolean} true if address is valid
   */

  static isValidAddress(network, address) {
    if (typeof network !== 'string')
      throw new FaucetToolError('network must be a string');

    if (!VALID_OPT_VALS['network'].includes(network))
      throw new FaucetToolError(`invalid network: ${network}`);

    return bech32.test(address) && (ADDR_PREFIX[network] === address.slice(0,2));
  }

  /**
   * Validates pubkey
   * @param {String} pubkey
   * @returns {Boolean} true if pubkey is valid and compressed
   */

  static isValidPubkey(pubkey) {
    if (typeof pubkey !== 'string')
      return false;

    if (pubkey.length !== 66)
      return false;

    const buf = Buffer.from(pubkey, 'hex');

    return secp256k1.publicKeyVerify(buf);
  }

  /**
   * Creates a multisig address formatted for the provided network.
   * @param {String} network
   * @param {Number} nrequired - minimum number of signatures required
   * @param {String[]} pubkeys - list of valid signers
   * @returns {Object} multsig
   * @returns {String[]} multsig.pubkeys - list of pubkeys
   * @returns {String} multsig.address - multisig address
   * @returns {String} multsig.redeemScript - the redeem script
   */

  static createMultisig(network, nrequired, pubkeys) {
    if (typeof network !== 'string')
      throw new FaucetToolError('network must be a string');

    if (!VALID_OPT_VALS['network'].includes(network))
      throw new FaucetToolError(`invalid network: ${network}`);

    if((nrequired >>> 0) !== nrequired)
      throw new FaucetToolError('nrequired must be an integer');

    if(!Array.isArray(pubkeys))
      throw new FaucetToolError('pubkeys must be an array');

    if (nrequired < 1 || pubkeys.length < nrequired || pubkeys.length > 16)
      throw new FaucetToolError(
        `invalid m of n configuration: ${nrequired} of ${pubkeys.length}`);

    const keys = pubkeys.map(pubkey => {
      if(!FaucetTool.isValidPubkey(pubkey))
        throw new Error(`invalid pubkey: ${pubkey}`);

      return Buffer.from(pubkey, 'hex')
    });
    const script = Script.fromMultisig(nrequired, keys.length, keys);

    if (script.getSize() > MAX_SCRIPT_PUSH)
      throw new FaucetToolError('redeem script exceeds size limit');

    // Create address
    const address = Address.fromScripthash(script.sha3());
    const plaintext = address.toString(network);
    if (!FaucetTool.isValidAddress(network, plaintext)) {
      throw new FaucetToolError(`invalid address generated: ${plaintext}`);
    }

    return {
      pubkeys,
      address: plaintext,
      redeemScript: script.toJSON()
    };
  }
}

FaucetTool.version = require('./package').version
FaucetTool.FaucetTool = FaucetTool;
FaucetTool.FaucetToolError = FaucetToolError;

module.exports = FaucetTool;
