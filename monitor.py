import subprocess
import time

SERIAL = "192.168.100.12:39879"
PACKAGE = "betmastermx.casino"

def sh(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, text=True).strip()
    except subprocess.CalledProcessError as e:
        return e.output.strip()

def get_pid():
    return sh(f"adb -s {SERIAL} shell pidof {PACKAGE}")

def monitor_logs(pid, duration_seconds=60):
    print(f"Iniciando monitor por PID {pid} durante {duration_seconds}s")
    subprocess.run(f"adb -s {SERIAL} logcat -c", shell=True)

    cmd = f"adb -s {SERIAL} logcat --pid={pid} -v time"
    process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)

    start = time.time()
    try:
        while time.time() - start < duration_seconds:
            line = process.stdout.readline()
            if line:
                print(line, end="")
            if process.poll() is not None:
                print("\nEl proceso terminó.")
                break
    except KeyboardInterrupt:
        print("\nMonitoreo detenido.")
    finally:
        process.terminate()

pid = get_pid()
if pid:
    monitor_logs(pid)
else:
    print("No se encontró el proceso. Abre la app primero.")
