// import dotenv from 'dotenv';
import ora from 'ora';
// dotenv.config();
// import { getAiKey } from '../utils/getKey.js';
// 1. Your specific list of models to test
const TARGET_MODELS = [
    'alibaba/tongyi-deepresearch-30b-a3b:free',
    'allenai/olmo-3-32b-think:free',
    'allenai/olmo-3.1-32b-think:free',
    'arcee-ai/trinity-mini:free',
    'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
    'deepseek/deepseek-r1-0528:free',
    'google/gemini-2.0-flash-exp:free',
    'google/gemma-3-12b-it:free',
    'google/gemma-3-27b-it:free',
    'google/gemma-3-4b-it:free',
    'google/gemma-3n-e2b-it:free',
    'google/gemma-3n-e4b-it:free',
    'kwaipilot/kat-coder-pro:free',
    'meta-llama/llama-3.1-405b-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'mistralai/devstral-2512:free',
    'mistralai/mistral-7b-instruct:free',
    'mistralai/mistral-small-3.1-24b-instruct:free',
    'moonshotai/kimi-k2:free',
    'nex-agi/deepseek-v3.1-nex-n1:free',
    'nousresearch/hermes-3-llama-3.1-405b:free',
    'nvidia/nemotron-3-nano-30b-a3b:free',
    'nvidia/nemotron-nano-12b-v2-vl:free',
    'nvidia/nemotron-nano-9b-v2:free',
    'openai/gpt-oss-120b:free',
    'openai/gpt-oss-20b:free',
    'qwen/qwen-2.5-vl-7b-instruct:free',
    'qwen/qwen3-4b:free',
    'qwen/qwen3-coder:free',
    'tngtech/deepseek-r1t-chimera:free',
    'tngtech/deepseek-r1t2-chimera:free',
    'tngtech/tng-r1t-chimera:free',
    'xiaomi/mimo-v2-flash:free',
    'z-ai/glm-4.5-air:free'
];

// async function checkModelStatus(modelId, apiKey) {
//     const startTime = Date.now();
//     try {
//         const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
//             method: "POST",
//             headers: {
//                 "Authorization": `Bearer ${apiKey}`,
//                 "Content-Type": "application/json",
//                 // Optional: Identification headers to be polite
//                 "HTTP-Referer": "http://localhost:3000",
//                 "X-Title": "ModelStatusChecker"
//             },
//             body: JSON.stringify({
//                 model: modelId,
//                 messages: [{ role: "user", content: "hi" }],
//                 max_tokens: 1, // Keep it tiny to save resources
//             })
//         });

//         const latency = Date.now() - startTime;

//         if (response.status === 200) {
//             return { id: modelId, status: 'ONLINE', code: 200, latency };
//         } else if (response.status === 429) {
//             return { id: modelId, status: 'RATE_LIMIT', code: 429, latency };
//         } else if (response.status === 404) {
//             return { id: modelId, status: 'DEAD', code: 404, latency };
//         } else {
//             return { id: modelId, status: 'ERROR', code: response.status, latency };
//         }

//     } catch (error) {
//         return { id: modelId, status: 'NETWORK_ERR', code: 0, latency: 0 };
//     }
// }

async function runHealthCheck() {
    console.log(`🔍 Checking ${TARGET_MODELS.length} models...`);
    console.log(`(This may take 10-20 seconds)\n`);

    // Run checks in parallel (batches of 5 to avoid blocking your own IP)
    const results = [];
    const BATCH_SIZE = 5;

    for (let i = 0; i < TARGET_MODELS.length; i += BATCH_SIZE) {
        const batch = TARGET_MODELS.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(id => checkModelStatus(id));

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Slight delay to be polite
        process.stdout.write('.');
    }

    console.log('\n\n=== 🚀 FASTEST AVAILABLE MODELS (Not Rate Limited) ===');
    const winners = results
        .filter(r => r.code === 200)
        .sort((a, b) => a.latency - b.latency); // Sort by speed

    if (winners.length === 0) console.log("No models available right now. (All busy or dead)");

    winners.forEach(w => {
        // Color coding for terminal
        const speed = w.latency < 500 ? '⚡ VERY FAST' : w.latency < 1500 ? '✅ FAST' : '🐢 SLOW';
        console.log(`[${w.latency}ms] ${speed} \t ${w.id}`);
    });

    console.log('\n=== ⚠️ RATE LIMITED / BUSY (Try again later) ===');
    results.filter(r => r.code === 429).forEach(r => console.log(`⛔ ${r.id}`));

    console.log('\n=== 💀 DEAD / 404 (Remove from code) ===');
    results.filter(r => r.code === 404).forEach(r => console.log(`❌ ${r.id}`));


    return winners;
}

async function checkModelStatus(modelId, apiKey) {
  const startTime = Date.now();
  
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", 
        "X-Title": "ModelStatusChecker"          
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 1, 
      })
    });

    const latency = Date.now() - startTime;

    if (response.status === 200) {
      return { id: modelId, status: 'ONLINE', code: 200, latency };
    } else if (response.status === 429) {
      return { id: modelId, status: 'RATE_LIMIT', code: 429, latency };
    } else if (response.status === 404) {
      return { id: modelId, status: 'DEAD', code: 404, latency };
    } else {
      return { id: modelId, status: 'ERROR', code: response.status, latency };
    }

  } catch (error) {
    return { id: modelId, status: 'NETWORK_ERR', code: 0, latency: 0 };
  }
}
export async function getFastFreeModel(apiKey) {
  
  const results = [];
  const BATCH_SIZE = 5;

//   const spinner = ora('Gettting modesl').start();
//   spinner.color= 'blue';

  for (let i = 0; i < TARGET_MODELS.length; i += BATCH_SIZE) {
    const batch = TARGET_MODELS.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(id => checkModelStatus(id, apiKey));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

//   spinner.succeed('Done');

  const formattedData = results.map((res, index) => {
    const providerName = res.id.split('/')[0]; 
    const cleanProvider = providerName.charAt(0).toUpperCase() + providerName.slice(1);

    // console.log('Provider name :: ', providerName);
    // console.log('cleanProvider name :: ', cleanProvider);

    if (res.code === 200) {
      return {
        id: index, 
        name: res.id,
        provider: cleanProvider,
        status: "active",
        latency: res.latency,
        requests: Math.floor(Math.random() * 1000), 
        lastUpdated: "Just now"
      };
    } 
  });

  console.log('Formatted data :: ', formattedData);

  return formattedData.sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return a.latency - b.latency;
  }).filter((data) => (typeof data !== 'undefined'));
}

