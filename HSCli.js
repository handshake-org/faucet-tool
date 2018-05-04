#!/usr/bin/env node
/**
 * Simple CLI tool to generate and encrypt priv/pub keys
 */

'use strict';

const fs = require('fs');
const readline = require('readline');
const bcrypto = require('bcrypto');
const sha256 = require('bcrypto/lib/sha256')

const filename = 'key.enc';

const genKey = function() {
  const priv = bcrypto.secp256k1.generatePrivateKey();
  const pub = bcrypto.secp256k1.publicKeyCreate(priv, true);

  return {priv, pub};
};

// IMPORTANT: Do not change
// Changes here will cause associate decryption script to fail
const encParams = {
  algo: sha256,
  iter: 100000,
  len: 32
};

/**
 * Generates AES cipher w/ streched verison of pw
 */
const encryptKey = function(data, pw) {
  const salt = bcrypto.random.randomBytes(16);
  const key = bcrypto.pbkdf2.derive(encParams.algo, pw, salt,
    encParams.iter, encParams.len);
  const iv = bcrypto.random.randomBytes(16);
  const enc = bcrypto.encipher(data, key, iv);
  return { enc, iv, salt };
};

const decryptKey = function(data, iv, salt, pw) {
  const key = bcrypto.pbkdf2.derive(encParams.algo, pw, salt,
    encParams.iter, encParams.len);
  const dec = bcrypto.decipher(data, key, iv);
  return dec;
};

const decryptFile = function(pw) {
  let contents;
  try {
    contents = fs.readFileSync(filename, 'utf8');
  } catch(e) {
    console.error('Failed to read key file');
    throw e;
  }

  [ salt, iv, cipher ] = contents.split(':');

  return decryptKey(Buffer.from(cipher, 'hex'), Buffer.from(iv, 'hex'),
    Buffer.from(salt, 'hex'), Buffer.from(pw));
};

const saveFile = function(input) {
  input = Array.isArray(input) ? input : [ input ];
  const contents = input.join(':');
  try {
    fs.writeFileSync(filename, contents, 'utf8');
  } catch(e) {
    console.error('Failed to save key file');
    throw e;
  }

  return true;
};

// Check if file already exists
// For security, do not allow them to proceed
try {
  if (fs.statSync(filename)) {
    console.error('*** Security Warning ***');
    console.error(filename + ' already exists. Have you generated a key already?');
    console.error('Please backup the file "' + filename + '" somewhere safe.');
    console.error('Move this file to continue generating another key.');
    process.exit(1);
  }
} catch(e) {};

console.log('Usage: ./cli');
console.log('PSA: Do not run on potentially compromised hardware.');
console.log('The truely parandoid can run on an air-gapped machine.');
console.log("\n");
console.log('Final output will be your public key, which can be shared.');
console.log('Your encrypted private key will be saved in "' + filename + '"');
console.log('Immediately after creation, this file should be backed up securely.');
console.log("\n");

const prompt = 'Enter Passphrase (Min. 15 characters):';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Handles hidden password input
const stdin = process.openStdin();
process.stdin.on('data', (char) => {
  char = char + "";
  switch (char) {
    case "\n":
    case "\r":
    case "\u0004":
      stdin.pause();
      break;
    default:
      process.stdout.write('\x1B[2K\x1B[200D' + prompt +
        Array(rl.line.length + 1).join('*'));
      break;
  }
});

rl.question(prompt, function(passphrase) {
  rl.history = rl.history.slice(1);

  // Enforce strict length requirements
  if (passphrase.length < 15) {
    console.error('Passphrase must be minimum 15 characters.');
    console.error('This is for your own security.');
    process.exit(1);
  }

  try {
    passphrase = Buffer.from(passphrase);

    console.log('Generating Key...');
    const {priv, pub} = genKey();

    console.log('Saving "' + filename + '"...');
    const { enc, iv, salt } = encryptKey(priv, passphrase);

    // Generate file in format:
    // salt:iv:ciphertext
    saveFile([salt.toString('hex'), iv.toString('hex'), enc.toString('hex')]);

    console.log("\n");
    console.log('*** REMEMBER ***');
    console.log('Backup the generated key file somewhere safe now!');
    console.log("\n");
    console.log('Public Key (SHARE THIS):');
    console.log(pub.toString('hex'));

    process.exit(0);
  } catch (e) {
    console.error(e.stack);
    process.exit(1);
  }
});
