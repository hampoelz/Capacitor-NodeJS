import { delimiter } from 'path';

export function joinEnv(...variables: string[]): string {
  let envVariable = '';

  for (let index = 0; index < variables.length; index++) {
    const variable = variables[index];

    if (!variable) continue;

    envVariable += variable;
    if (index < variables.length - 1) {
      envVariable += delimiter;
    }
  }

  return envVariable;
}
