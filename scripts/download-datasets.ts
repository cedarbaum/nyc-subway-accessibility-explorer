import axios from "axios";
import { existsSync, promises as fs } from "fs";
import path from "path";
import dotenv from "dotenv";
import { Dataset, datasets, DatasetSource, getDatasetPath } from "./datasets";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const downloadPath = path.join(__dirname, "..", "datasets");

async function downloadDataset(dataset: Dataset): Promise<void> {
  const filePath = getDatasetPath(dataset);

  // Check if the file already exists and skip the download if it does
  if (existsSync(filePath)) {
    console.log(`${dataset.id} already exists, skipping download.`);
    return;
  }

  let headers = {};
  let params = {}
  if (dataset.source === DatasetSource.NyOpenDataAPI) {
    headers = {
      "X-App-Token": process.env.NY_OPEN_DATA_APP_TOKEN,
    };
    params = {
      "$limit": 100000,
    };
  }

  try {
    const response = await axios.get(dataset.url, {
      responseType: "arraybuffer",
      params,
      headers,
    });
    await fs.writeFile(filePath, response.data);
    console.log(`${dataset.id} downloaded successfully.`);
  } catch (error) {
    console.error(`Failed to download ${dataset.id}:`, error);
  }
}

async function downloadAllDatasets(): Promise<void> {
  try {
    // Ensure the datasets directory exists
    await fs.mkdir(downloadPath, { recursive: true });

    // Download all datasets concurrently
    await Promise.all(datasets.map(downloadDataset));
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

downloadAllDatasets();
