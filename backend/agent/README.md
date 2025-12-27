# Silent Manager Agent

The Windows agent monitors a folder containing Gilbarco Passport XMLGateway exports and uploads new XML files to the Silent Manager API.

## Quick start

1. Copy the config example:

```powershell
copy config.example.json config.json
```

2. Fill in `deviceApiKey`, `storeId`, `deviceId`, and the correct `watchPath`.

3. Start the agent:

```powershell
npm install
npm run build
node dist/index.js start --config config.json
```

## CLI commands

```powershell
node dist/index.js dry-run --config config.json
node dist/index.js test-upload --config config.json --file C:\\XML\\sample.xml
node dist/index.js health --config config.json
```

## Map a network drive to XMLGateway

1. Open File Explorer → **This PC** → **Map network drive**.
2. Choose a drive letter, e.g. `Z:`.
3. Folder: `\\PASSPORT_IP\\XMLGateway\\BOOutBox`
4. Check **Reconnect at sign-in**.
5. Enter network credentials if prompted.

The agent `watchPath` can then be `Z:\\XMLGateway\\BOOutBox`.

## Run agent on startup with Task Scheduler

1. Open **Task Scheduler** → **Create Task**.
2. Name: `Silent Manager Agent`.
3. **Triggers**: At startup.
4. **Actions**: Start a program.
   - Program/script: `node`
   - Arguments: `dist/index.js start --config C:\\path\\to\\config.json`
   - Start in: `C:\\path\\to\\backend\\agent`
5. **Conditions**: Uncheck “Start the task only if the computer is on AC power” for laptops.
6. **Settings**: Check “Run task as soon as possible after a scheduled start is missed.”
