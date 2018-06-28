'use strict';

const assert = require('./util/assert');
const { FaucetTool, FaucetToolError } = require('../')
const HDPrivateKey = require('../lib/private');
const Mnemonic = require('../lib/mnemonic');
const openpgp = require('openpgp');
const { TEST_PGP_PASSPHRASE, TEST_PGP_PUBKEY, TEST_PGP_PRIVKEY } = require('./util/data');

describe('FaucetTool', function() {
  describe('#constructor', function() {
    it('should support default options', () => {
      const tool = new FaucetTool();

      assert.strictEqual(tool.getNetwork(), 'main');
      assert.strictEqual(tool.getPhrase().split(' ').length, 24);
      assert(FaucetTool.isValidAddress(tool.getNetwork(), tool.getAddress()));
    });

    it('should support sane options', () => {
      const network = 'testnet';
      const language = 'french';
      const bits = 128;
      const tool = new FaucetTool({ network, language, bits });

      assert.strictEqual(tool.getNetwork(), 'testnet');
      assert.strictEqual(tool.getPhrase().split(' ').length, 12);
      assert(FaucetTool.isValidAddress(network, tool.getAddress()));
    });

    it('should reject invalid options', () => {
      const network = 'foobar';
      const language = 'java';
      let tool, bits;

      try {
        tool = new FaucetTool({ network: 128 });
      } catch (err) {
        assert(err instanceof FaucetToolError,
          `expected error due to invalid network option: ${network}`);
      }
      assert(tool === undefined);

      try {
        tool = new FaucetTool({ network });
      } catch (err) {
        assert(err instanceof FaucetToolError,
          `expected error due to invalid network option: ${network}`);
      }
      assert(tool === undefined);

      try {
        tool = new FaucetTool({ language: 128 });
      } catch (err) {
        assert(err instanceof FaucetToolError,
          `expected error due to invalid language option: ${language}`);
      }
      assert(tool === undefined);

      try {
        tool = new FaucetTool({ language });
      } catch (err) {
        assert(err instanceof FaucetToolError,
          `expected error due to invalid language option: ${language}`);
      }
      assert(tool === undefined);

      try {
        bits = 'testnet';
        tool = new FaucetTool({ bits });
      } catch (err) {
        assert(err instanceof FaucetToolError,
          `expected error due to invalid bits option: ${bits}`);
      }
      assert(tool === undefined);

      try {
        bits = 127;
        tool = new FaucetTool({ bits });
      } catch (err) {
        assert(err instanceof FaucetToolError,
          `expected error due to invalid bits option: ${bits}`);
      }
      assert(tool === undefined);

      try {
        bits = 513;
        tool = new FaucetTool({ bits });
        assert(false, 'expected failure due to invalid bits option');
      } catch (err) {
        assert(err instanceof FaucetToolError,
          `expected error due to invalid bits option: ${bits}`);
      }
      assert(tool === undefined);
    });
  });

  describe('#getPhrase', function() {
    it('should generate correct length', function() {
      let tool = new FaucetTool({ bits: 128 });
      assert.strictEqual(tool.getPhrase().split(' ').length, 12);

      tool = new FaucetTool({ bits: 256 });
      assert.strictEqual(tool.getPhrase().split(' ').length, 24);
    });
  });

  describe('#isValidAddress', function() {
    it('should detect valid address', function() {
      const mainnet = 'hs1q9m5ftltrsqgg3tw6j68qnnugssp4umrsqwhjvd';
      const testnet = 'ts1qat6jks67yjpk0upsqfhy3t2gsqn9uzzjtgkwj7';
      const regtest = 'rs1qzlnxugufjr7ehah8s5zst0dk0gzy64jqv8y63h';
      const simnet = 'ss1qkyjev22g2x5yac7h6cm8a9at2svw8wj7mkwudv';

      assert(FaucetTool.isValidAddress('main', mainnet));
      assert(FaucetTool.isValidAddress('testnet', testnet));
      assert(FaucetTool.isValidAddress('regtest', regtest));
      assert(FaucetTool.isValidAddress('simnet', simnet));
    });

    it('should detect invalid address', function() {
      assert(!FaucetTool.isValidAddress('main', 'invalid address'));
    });
  });

  describe('#getAddress', function() {
    it('should detect valid address', function() {
      const mainnet = 'hs1q9m5ftltrsqgg3tw6j68qnnugssp4umrsqwhjvd';
      const testnet = 'ts1qat6jks67yjpk0upsqfhy3t2gsqn9uzzjtgkwj7';
      const regtest = 'rs1qzlnxugufjr7ehah8s5zst0dk0gzy64jqv8y63h';
      const simnet = 'ss1qkyjev22g2x5yac7h6cm8a9at2svw8wj7mkwudv';

      assert(FaucetTool.isValidAddress('main', mainnet));
      assert(FaucetTool.isValidAddress('testnet', testnet));
      assert(FaucetTool.isValidAddress('regtest', regtest));
      assert(FaucetTool.isValidAddress('simnet', simnet));
    });

    it('should generate valid mainnet address', async function() {
      const tool = new FaucetTool();
      const mainnet = tool.getAddress();
      assert.strictEqual('hs', mainnet.slice(0,2));
      assert(FaucetTool.isValidAddress('main', mainnet));
    });

    it('should generate valid testnet address', async function() {
      const tool = new FaucetTool({ network: 'testnet' });
      const testnet = tool.getAddress();
      assert.strictEqual('ts', testnet.slice(0,2));
      assert(FaucetTool.isValidAddress('testnet', testnet));
    });

    it('should generate valid regtest address', async function() {
      const tool = new FaucetTool({ network: 'regtest' });
      const regtest = tool.getAddress();
      assert.strictEqual('rs', regtest.slice(0,2));
      assert(FaucetTool.isValidAddress('regtest', regtest));
    });

    it('should generate valid simnet address', async function() {
      const tool = new FaucetTool({ network: 'simnet' });
      const simnet = tool.getAddress();
      assert.strictEqual('ss', simnet.slice(0,2));
      assert(FaucetTool.isValidAddress('simnet', simnet));
    });
  });

  describe('#createMultisig', function() {
    it('should generate valid multisig address', async function() {
      const multisig = await FaucetTool.createMultisig(
        'main',
        1,
        [
          '02e43e541306e77af21c9e94681f83366aa7b4bcea8fd41fa7dc65d2677187c441',
          '0213981f357b96b0527f9c99c75df49390cb36a424c5bf959704377b40f0594629'
        ]
      );
      assert(multisig.redeemScript !== undefined);
      assert(multisig.pubkeys !== undefined);
      assert(Array.isArray(multisig.pubkeys));
      assert(FaucetTool.isValidAddress('main', multisig.address));
    });

    it('should fail with invalid parameters', async function() {
      let address;
      try {
        address = await FaucetTool.createMultisig();
      } catch (err) {
        assert(err instanceof FaucetToolError,
          'expected error due to invalid params');
      }
      assert(address === undefined);

      try {
        address = await FaucetTool.createMultisig(
          'foobar',
          1,
          [
            '02e43e541306e77af21c9e94681f83366aa7b4bcea8fd41fa7dc65d2677187c441',
            '0213981f357b96b0527f9c99c75df49390cb36a424c5bf959704377b40f0594629'
          ]
        );
      } catch (err) {
        assert(err instanceof FaucetToolError,
          'expected error due to invalid params');
      }
      assert(address === undefined);

      try {
        address = await FaucetTool.createMultisig(
          'foobar',
          '1',
          [
            '02e43e541306e77af21c9e94681f83366aa7b4bcea8fd41fa7dc65d2677187c441',
            '0213981f357b96b0527f9c99c75df49390cb36a424c5bf959704377b40f0594629'
          ]
        );
      } catch (err) {
        assert(err instanceof FaucetToolError,
          'expected error due to invalid params');
      }
      assert(address === undefined);

      try {
        address = await FaucetTool.createMultisig(
          'foobar',
          1,
          [
            '',
            '0213981f357b96b0527f9c99c75df49390cb36a424c5bf959704377b40f0594629'
          ]
        );
      } catch (err) {
        assert(err instanceof FaucetToolError,
          'expected error due to invalid params');
      }
      assert(address === undefined);

      try {
        address = await FaucetTool.createMultisig(
          'foobar',
          3,
          [
            '02e43e541306e77af21c9e94681f83366aa7b4bcea8fd41fa7dc65d2677187c441',
            '0213981f357b96b0527f9c99c75df49390cb36a424c5bf959704377b40f0594629'
          ]
        );
      } catch (err) {
        assert(err instanceof FaucetToolError,
          'expected error due to invalid params');
      }
      assert(address === undefined);
    });
  });

  describe('#encryptData', function() {
    it('should produce correct digest', async function() {
      const want = 'hello world';
      const ciphertext = await FaucetTool.encryptData(want, TEST_PGP_PUBKEY);
      const privkey = openpgp.key.readArmored(TEST_PGP_PRIVKEY).keys[0];
      await privkey.decrypt(TEST_PGP_PASSPHRASE);

      const options = {
        message: openpgp.message.readArmored(ciphertext),
        privateKeys: [privkey]
      }
      const got = (await openpgp.decrypt(options)).data;

      assert.strictEqual(want, got);
    });
  });
});
