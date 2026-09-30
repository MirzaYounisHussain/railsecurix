"""
Automatic Git Sync Daemon for BehaviorSentinel / RailSim Express
Continuously monitors local changes and automatically commits & pushes to GitHub (origin main).
"""
import subprocess
import time
import datetime
import os
import sys

# Ensure UTF-8 output on Windows
sys.stdout.reconfigure(line_buffering=True)

REPO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def get_git_status():
    try:
        res = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=REPO_DIR,
            capture_output=True,
            text=True
        )
        return res.stdout.strip()
    except Exception as e:
        print(f"Error checking git status: {e}", flush=True)
        return ""

def sync():
    status = get_git_status()
    if not status:
        return False

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    lines = status.splitlines()
    summary = f"auto: sync {len(lines)} file(s) [{timestamp}]"

    print(f"\n[{timestamp}] Detected {len(lines)} modified/new file(s). Waiting 15s to debounce...", flush=True)
    time.sleep(15)

    try:
        # Stage all changes
        subprocess.run(["git", "add", "."], cwd=REPO_DIR, check=True)

        # Check if staged changes exist
        diff_res = subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=REPO_DIR)
        if diff_res.returncode == 0:
            print(f"[{timestamp}] No staged changes to commit.", flush=True)
            return False

        # Commit
        subprocess.run(["git", "commit", "-m", summary], cwd=REPO_DIR, check=True)
        print(f"[{timestamp}] Committed: {summary}", flush=True)

        # Push
        print(f"[{timestamp}] Pushing to GitHub (origin main)...", flush=True)
        push_res = subprocess.run(
            ["git", "push", "origin", "main"],
            cwd=REPO_DIR,
            capture_output=True,
            text=True
        )
        if push_res.returncode == 0:
            print(f"[{timestamp}] Successfully reflected changes to GitHub!", flush=True)
            return True
        else:
            print(f"[{timestamp}] Push warning / error: {push_res.stderr.strip()}", flush=True)
            return False
    except Exception as e:
        print(f"[{timestamp}] Error during auto-sync: {e}", flush=True)
        return False

def main():
    print(f"Auto Git Sync Daemon active in: {REPO_DIR}", flush=True)
    print("Monitoring repository for changes every 15 seconds...\n", flush=True)
    while True:
        try:
            status = get_git_status()
            if status:
                sync()
        except KeyboardInterrupt:
            print("\nAuto Git Sync Daemon stopped.", flush=True)
            break
        except Exception as e:
            print(f"Unexpected loop error: {e}", flush=True)
        time.sleep(15)

if __name__ == "__main__":
    main()
