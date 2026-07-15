import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

/** Executa um binário e devolve o stdout. Lança erro com stderr em caso de falha. */
export async function run(bin: string, args: string[], opts: { cwd?: string } = {}): Promise<string> {
  try {
    const { stdout } = await execFileP(bin, args, {
      maxBuffer: 128 * 1024 * 1024,
      cwd: opts.cwd,
    });
    return stdout.toString();
  } catch (e) {
    const err = e as { stderr?: string; message?: string };
    throw new Error(`${bin} falhou: ${err.stderr || err.message}`);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
