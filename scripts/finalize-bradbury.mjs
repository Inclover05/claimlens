// Finalize only this test wallet's transactions when the deployed protocol allows it.
import { readFile, writeFile } from 'node:fs/promises';
import { createClient } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';
import { createPublicClient, encodeFunctionData, formatEther, http, keccak256 } from 'viem';
import { loadBradburyTestAccount } from './bradbury-wallet.mjs';

const chain = { ...testnetBradbury, rpcUrls: { default: { http: ['https://rpc.testnet-chain.genlayer.com'] } } };
const client = createPublicClient({ chain, transport: http(chain.rpcUrls.default.http[0], { retryCount: 0, timeout: 15000 }) });
const reader = createClient({ chain: { ...testnetBradbury, rpcUrls: { default: { http: ['https://rpc-bradbury.genlayer.com'] } } } });
const json = value => JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item, 2) + '\n';
try {
  const hash = process.argv[2];
  if (!/^0x[0-9a-f]{64}$/i.test(hash || '')) throw new Error('Provide a GenLayer transaction ID.');
  if (await client.getChainId() !== 4221) throw new Error('Wrong chain.');
  const transaction = await reader.getTransaction({ hash });
  const identity = JSON.parse(await readFile(new URL('../.claimlens-wallet/wallet.json', import.meta.url), 'utf8'));
  if (String(transaction.sender || transaction.from_address).toLowerCase() !== identity.address.toLowerCase()) throw new Error('This transaction is outside the test wallet scope.');
  if (transaction.statusName === 'FINALIZED') {
    console.log(json({ genHash: hash, state: 'finalized', executionResult: transaction.txExecutionResultName, transactionSent: false }));
  } else {
    const block = await client.getBlock({ blockTag: 'latest' });
    const readiness = await client.readContract({ address: chain.consensusDataContract.address, abi: chain.consensusDataContract.abi, functionName: 'canFinalize', args: [hash, block.timestamp] });
    if (readiness[0] !== true) {
      console.log(json({ genHash: hash, state: transaction.statusName, canFinalize: false, chainTimestamp: block.timestamp, readiness, transactionSent: false }));
    } else {
      const file = new URL(`../.claimlens-wallet/${hash}.finalization.json`, import.meta.url);
      let saved;
      try { saved = JSON.parse(await readFile(file, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (saved) {
        console.log(json({ ...saved, transactionSent: false, note: 'An existing finalization attempt is recorded; do not resend.' }));
      } else {
        const account = await loadBradburyTestAccount();
        const data = encodeFunctionData({ abi: chain.consensusMainContract.abi, functionName: 'finalizeTransaction', args: [hash] });
        const gas = (await client.estimateGas({ account: account.address, to: chain.consensusMainContract.address, data, value: 0n })) * 120n / 100n;
        const gasPrice = await client.getGasPrice();
        if (gas * gasPrice > 50000000000000000n || await client.getBalance({ address: account.address }) < gas * gasPrice) throw new Error('Finalization fee exceeds the test budget.');
        const nonce = await client.getTransactionCount({ address: account.address, blockTag: 'pending' });
        const journal = { genHash: hash, address: account.address, chainId: 4221, nonce, startedAt: new Date().toISOString(), state: 'preparing_signature', maximumNetworkFeeGEN: formatEther(gas * gasPrice) };
        await writeFile(file, json(journal), { flag: 'wx' });
        const signed = await account.signTransaction({ to: chain.consensusMainContract.address, data, gas, gasPrice, nonce, chainId: 4221, value: 0n, type: 'legacy' });
        journal.evmHash = keccak256(signed);
        journal.state = 'broadcast_outcome_uncertain';
        await writeFile(file, json(journal));
        const result = await client.sendRawTransaction({ serializedTransaction: signed });
        if (result.toLowerCase() !== journal.evmHash.toLowerCase()) throw new Error('Unexpected finalization hash.');
        journal.state = 'broadcast';
        await writeFile(file, json(journal));
        console.log(json({ ...journal, transactionSent: true }));
      }
    }
  }
} catch (error) {
  console.error(`${error instanceof Error ? error.name : 'Error'}: finalization operation failed; no automatic resend.`);
  process.exitCode = 1;
}
