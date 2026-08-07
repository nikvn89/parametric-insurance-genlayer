import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { readFileSync } from 'fs';

const client = createClient({ chain: studionet });
const deployer = createAccount('0x72bf6e67319555b11f47754b6eba01ce6d67fa377ce6c62437bb8677d346fd28');

const code = readFileSync('./ParametricInsurance.py', 'utf8');

async function deploy() {
  console.log('Deploying ParametricInsurance V3...');
  const hash = await client.deployContract({
    account: deployer,
    code,
    args: [],
  });
  console.log('Tx Hash:', hash);
  const receipt = await client.waitForTransactionReceipt({ hash, retries: 40, interval: 2000 });
  console.log('Contract Address:', receipt.contractAddress ?? receipt.to);
  console.log('Receipt:', JSON.stringify(receipt, null, 2));
}

deploy().catch(console.error);
