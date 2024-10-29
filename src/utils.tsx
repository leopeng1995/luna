import constants from "./constants";

interface StorageData {
  apiKey?: string;
}

const getApiKey = async (): Promise<string> => {
  const result: StorageData = await new Promise((resolve) => {
    chrome.storage.local.get(["apiKey"], (data) => {
      resolve(data);
    });
  });
  return result.apiKey || "";
};

const translate = async (text: string) => {
  const response = await fetch(`${constants.API_URL}/translate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  const data = await response.text();
  return data;
};

export { translate };
