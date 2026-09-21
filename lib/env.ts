export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function requireUrl(name: string): string {
  const value = requireEnv(name);

  try {
    new URL(value);
  } catch {
    throw new Error(
      `Environment variable ${name} must be a valid absolute URL`
    );
  }

  return value;
}
