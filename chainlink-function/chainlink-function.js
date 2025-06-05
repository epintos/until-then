const cid = args[0];
const senderAddress = args[1];
const receiverAddress = args[2];
if (!cid) throw new Error("Missing CID");
if (!senderAddress) throw new Error("Missing senderAddress");
if (!receiverAddress) throw new Error("Missing receiverAddress");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validateSecrets(requiredKeys) {
  for (const key of requiredKeys) {
    if (!secrets[key]) {
      throw new Error(`Missing required secret: ${key}`);
    }
  }
}

validateSecrets([
  "PINATA_API_JWT",
  "PINATA_GATEWAY",
  "PINATA_PRIVATE_GROUP_ID",
  "PINATA_PUBLIC_GROUP_ID",
]);

const authHeaders = () => ({
  Authorization: `Bearer ${secrets.PINATA_API_JWT}`,
  "Content-Type": "application/json",
});

async function getDownloadLink(cid) {
  const url = `${secrets.PINATA_GATEWAY}/files/${cid}`;
  const response = await Functions.makeHttpRequest({
    method: "POST",
    url: "https://api.pinata.cloud/v3/files/private/download_link",
    headers: authHeaders(),
    data: {
      url,
      expires: 180,
      date: Math.floor(Date.now() / 1000),
      method: "GET",
    },
  });
  return response.data.data;
}

async function fetchPrivateContent(downloadUrl) {
  const response = await Functions.makeHttpRequest({
    method: "GET",
    url: downloadUrl,
  });
  return response.data;
}

async function getPrivateFileInfo(cid) {
  const response = await Functions.makeHttpRequest({
    method: "GET",
    url: `https://api.pinata.cloud/v3/files/private?group=${secrets.PINATA_PRIVATE_GROUP_ID}&cid=${cid}`,
    headers: authHeaders(),
  });
  return response.data.data.files[0];
}

async function pinPublicVersion(content, privateInfo) {
  const metadata = {
    name: `${privateInfo.name.replace(/\.json$/i, "")}-public.json`,
    keyvalues: { privateCid: privateInfo.cid, senderAddress, receiverAddress },
  };
  const response = await Functions.makeHttpRequest({
    method: "POST",
    url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    headers: authHeaders(),
    data: {
      pinataContent: content,
      pinataMetadata: metadata,
    },
  });
  return response.data;
}

async function assignToPublicGroup(newId) {
  await Functions.makeHttpRequest({
    method: "PUT",
    url: `https://api.pinata.cloud/v3/groups/public/${secrets.PINATA_PUBLIC_GROUP_ID}/ids/${newId}`,
    headers: authHeaders(),
  });
}

async function deletePrivateFile(privateId) {
  const response = await Functions.makeHttpRequest({
    method: "DELETE",
    url: `https://api.pinata.cloud/v3/files/private/${privateId}`,
    headers: authHeaders(),
  });
  console.log(response);
}

// --- Execution Flow ---
let newCid;
try {
  const downloadUrl = await getDownloadLink(cid);
  const privateContent = await fetchPrivateContent(downloadUrl);
  const privateInfo = await getPrivateFileInfo(cid);
  const publicData = await pinPublicVersion(privateContent, privateInfo);
  newCid = publicData.IpfsHash;

  await assignToPublicGroup(publicData.ID);
  // await sleep(2500);
  // await deletePrivateFile(privateInfo.id);
} catch (error) {
  console.log("Error occurred:", error);
}

return Functions.encodeString(newCid);
