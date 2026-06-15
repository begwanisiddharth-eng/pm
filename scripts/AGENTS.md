# Scripts

Start and stop scripts for running the app locally on port 8000.

- `start.ps1` / `stop.ps1` - Windows (PowerShell).
- `start.sh` / `stop.sh` - Mac/Linux (bash).

Start launches `uvicorn app.main:app` on port 8000 from the `backend/`
directory. Pass `-Build` (`--build` on Mac/Linux) to (re)build the frontend
static export first via `build-frontend.ps1` / `build-frontend.sh`; omit it to
serve the existing build. On Windows, `stop.ps1` stops whatever is listening on
port 8000; on Mac/Linux, `stop.sh` kills the PID recorded by `start.sh` in
`.server.pid` (gitignored).

## Usage

Windows:

```powershell
./scripts/start.ps1 -Build   # omit -Build to skip the frontend rebuild
./scripts/stop.ps1
```

Mac/Linux:

```bash
./scripts/start.sh --build
./scripts/stop.sh
```
