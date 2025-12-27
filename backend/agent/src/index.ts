import { Command } from "commander";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import chokidar from "chokidar";
import PQueue from "p-queue";
import axios from "axios";
import FormData from "form-data";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

export type AgentConfig = {
  backendUrl: string;
  ingestPath: string;
  deviceApiKey: string;
  storeId: string;
  deviceId: string;
  watchPath: string;
  fileGlob: string;
  pollIntervalMs: number;
  stabilityWindowMs: number;
  maxFileSizeBytes: number;
  concurrency: number;
  retry: { maxAttempts: number; baseDelayMs: number; maxDelayMs: number };
};

type UploadState = {
  items: Record<string, { sha256: string; mtimeMs: number }>;
};

const loadConfig = async (configPath: string): Promise<AgentConfig> => {
  const raw = await fs.readFile(configPath, "utf-8");
  return JSON.parse(raw) as AgentConfig;
};

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console(),
    new DailyRotateFile({
      dirname: path.resolve(process.cwd(), "logs"),
      filename: "agent-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "7d"
    })
  ]
});

const statePath = path.resolve(process.cwd(), ".silentmanager-state.json");

const loadState = async (): Promise<UploadState> => {
  try {
    const data = await fs.readFile(statePath, "utf-8");
    return JSON.parse(data) as UploadState;
  } catch {
    return { items: {} };
  }
};

const saveState = async (state: UploadState) => {
  await fs.writeFile(statePath, JSON.stringify(state, null, 2));
};

const fileStable = async (filePath: string, stabilityWindowMs: number) => {
  const stat1 = await fs.stat(filePath);
  await new Promise((resolve) => setTimeout(resolve, stabilityWindowMs));
  const stat2 = await fs.stat(filePath);
  return stat1.size === stat2.size;
};

const hashFile = async (filePath: string) => {
  const buffer = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

const uploadFile = async (config: AgentConfig, filePath: string, sha256: string) => {
  const form = new FormData();
  form.append("storeId", config.storeId);
  form.append("deviceId", config.deviceId);
  form.append("filename", path.basename(filePath));
  form.append("sha256", sha256);
  form.append("file", await fs.readFile(filePath), path.basename(filePath));

  const url = `${config.backendUrl}${config.ingestPath}`;
  const response = await axios.post(url, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${config.deviceApiKey}`
    },
    maxContentLength: config.maxFileSizeBytes,
    maxBodyLength: config.maxFileSizeBytes
  });
  return response.data as { ok: boolean; duplicate?: boolean };
};

const retry = async <T>(fn: () => Promise<T>, config: AgentConfig) => {
  let attempt = 0;
  while (attempt < config.retry.maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      attempt += 1;
      const delay = Math.min(
        config.retry.maxDelayMs,
        config.retry.baseDelayMs * 2 ** attempt + Math.random() * 500
      );
      logger.warn({ msg: "Upload failed, retrying", attempt, delay, error: String(error) });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retry attempts reached");
};

const processFile = async (config: AgentConfig, state: UploadState, filePath: string) => {
  const stat = await fs.stat(filePath);
  if (stat.size > config.maxFileSizeBytes) {
    logger.warn({ msg: "File too large, skipping", filePath });
    return;
  }

  const stable = await fileStable(filePath, config.stabilityWindowMs);
  if (!stable) {
    logger.info({ msg: "File not stable yet", filePath });
    return;
  }

  const sha256 = await hashFile(filePath);
  const key = `${filePath}:${sha256}`;
  if (state.items[key]) {
    logger.info({ msg: "File already uploaded", filePath });
    return;
  }

  await retry(async () => uploadFile(config, filePath, sha256), config);
  state.items[key] = { sha256, mtimeMs: stat.mtimeMs };
  await saveState(state);
  logger.info({ msg: "Uploaded file", filePath });
};

const startWatcher = async (config: AgentConfig, dryRun = false) => {
  const state = await loadState();
  const queue = new PQueue({ concurrency: config.concurrency });

  const handleFile = (filePath: string) => {
    if (dryRun) {
      logger.info({ msg: "Dry-run detected file", filePath });
      return;
    }
    queue.add(() => processFile(config, state, filePath));
  };

  const watcher = chokidar.watch(config.fileGlob, {
    cwd: config.watchPath,
    persistent: true,
    ignoreInitial: false,
    usePolling: true,
    interval: config.pollIntervalMs,
    awaitWriteFinish: {
      stabilityThreshold: config.stabilityWindowMs,
      pollInterval: Math.max(500, config.pollIntervalMs)
    }
  });

  watcher.on("add", (file) => handleFile(path.join(config.watchPath, file)));
  logger.info({ msg: "Watcher started", watchPath: config.watchPath });
};

const program = new Command();

program
  .name("silent-manager-agent")
  .description("Silent Manager XMLGateway upload agent")
  .version("0.1.0");

program
  .command("start")
  .requiredOption("--config <path>")
  .action(async (options) => {
    const config = await loadConfig(options.config);
    await startWatcher(config, false);
  });

program
  .command("dry-run")
  .requiredOption("--config <path>")
  .action(async (options) => {
    const config = await loadConfig(options.config);
    await startWatcher(config, true);
  });

program
  .command("test-upload")
  .requiredOption("--config <path>")
  .requiredOption("--file <path>")
  .action(async (options) => {
    const config = await loadConfig(options.config);
    const state = await loadState();
    await processFile(config, state, options.file);
  });

program
  .command("health")
  .requiredOption("--config <path>")
  .action(async (options) => {
    const config = await loadConfig(options.config);
    logger.info({ msg: "Config loaded", config });
    const url = `${config.backendUrl}/health`;
    try {
      const response = await axios.get(url);
      logger.info({ msg: "Backend reachable", status: response.status });
    } catch (error) {
      logger.error({ msg: "Backend check failed", error: String(error) });
    }
  });

program.parse();
