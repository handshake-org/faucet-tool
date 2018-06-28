/**
 * Handshake Faucet Tool
 *
 * A simple library for generating mnemonic seeds and addresses for Handshake
 * with minimal deps. Uses primitives/address.js and hd/private.js from hskd
 * but with consensus and network dependencies removed.
 */

const { bech32 } = require('bstring');
const openpgp = require('openpgp');

const Address = require('./address');
const HDPrivateKey = require('./private');
const KeyRing = require('./keyring');
const Mnemonic = require('./mnemonic');
const Script = require('./script');

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

const PGP_PUBKEY =
`
-----BEGIN PGP PUBLIC KEY BLOCK-----

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
oaIR
=gRPC
-----END PGP PUBLIC KEY BLOCK-----
`;

class FaucetToolError extends Error {
  constructor(options) {
    super(options);
  }
}

// Private members
const address = new WeakMap();
const network = new WeakMap();
const phrase = new WeakMap();
const privkey = new WeakMap();
const pubkey = new WeakMap();

class FaucetTool {
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
    const _child = _master
      .deriveAccount(BIP44_PURPOSE, BIP44_COIN_TYPE[_network], BIP44_ACCOUNT)
      .derive(BIP44_CHANGE)
      .derive(BIP44_ADDRESS_INDEX);

    const _keyring = KeyRing.fromPrivate(_child.privateKey);
    const _address = _keyring.getKeyAddress('string', _network);

    if (!FaucetTool.isValidAddress(_network, _address))
      throw new FaucetToolError(`invalid address generated: ${_address}`);

    address.set(this, _address);
    network.set(this, _network);
    phrase.set(this, _mnemonic.getPhrase());
    privkey.set(this, _keyring.toSecret(_network));
    pubkey.set(this, _keyring.getPublicKey('hex'));
  }

  getAddress() {
    return address.get(this);
  }

  getNetwork() {
    return network.get(this);
  }

  getPhrase() {
    return phrase.get(this);
  }

  getPubkey() {
    return pubkey.get(this);
  }

  getPrivkey() {
    return privkey.get(this);
  }

  static async encryptData(data, pubkey = PGP_PUBKEY) {
    const publicKeys = openpgp.key.readArmored(pubkey).keys;
    return (await openpgp.encrypt({ data, publicKeys })).data;
  }

  static isValidAddress(network, address) {
    if (typeof network !== 'string')
      throw new FaucetToolError('network must be a string');

    if (!VALID_OPT_VALS['network'].includes(network))
      throw new FaucetToolError(`invalid network: ${network}`);

    return bech32.test(address) && (ADDR_PREFIX[network] === address.slice(0,2));
  }

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
      throw new FaucetToolError('invalid m of n configuration');

    const keys = pubkeys.map(pubkey => Buffer.from(pubkey, 'hex'));
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

FaucetTool.FaucetTool = FaucetTool;
FaucetTool.FaucetToolError = FaucetToolError;

module.exports = FaucetTool;
