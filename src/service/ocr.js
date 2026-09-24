// Azure AI Vision "Read": image bytes in, text lines out.
import AzureVision from "@azure-rest/ai-vision-image-analysis";
import { getAzureKey, getAzureUrl } from "../utils/getKey.js";

// The package is CommonJS; its default export is the client factory.
const createClient = AzureVision.default;
const isUnexpected = AzureVision.isUnexpected;

let client = null;
const getClient = () => {
  if (!client) client = createClient(getAzureUrl(), { key: getAzureKey() });
  return client;
};

export const processImages = async (buffer) => {
  const result = await getClient().path("/imageanalysis:analyze").post({
    body: new Uint8Array(buffer),
    queryParameters: { features: ["read"], language: "en" },
    contentType: "application/octet-stream",
  });

  if (isUnexpected(result)) {
    const e = result.body?.error;
    const err = new Error(`Azure ${result.status}: ${e?.code || ""} ${e?.message || ""}`.trim());
    // 400 means the file itself is the problem (corrupt, too small, wrong format).
    err.badImage = String(result.status) === "400";
    throw err;
  }

  const blocks = result.body.readResult?.blocks || [];
  return blocks.flatMap((block) => block.lines.map((line) => line.text));
};
