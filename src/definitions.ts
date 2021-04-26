export interface NodeJSPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
}
