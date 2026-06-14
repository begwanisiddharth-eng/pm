# Scripts

Start and stop scripts for running the app locally on port 8000.

- `start.ps1` / `stop.ps1` - Windows (PowerShell).
- `start.sh` / `stop.sh` - Mac/Linux (bash).

Start launches `uvicorn app.main:app` on port 8000 from the `backend/`
directory. On Windows, `stop.ps1` stops whatever is listening on port 8000; on
Mac/Linux, `stop.sh` kills the PID recorded by `start.sh` in `.server.pid`
(gitignored).

## Usage

Windows:

```powershell
./scripts/start.ps1
./scripts/stop.ps1
```

Mac/Linux:

```bash
./scripts/start.sh
./scripts/stop.sh
```
