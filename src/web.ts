import { WebPlugin } from '@capacitor/core';

import type { NodeJSPlugin } from './definitions';

export class NodeJSWeb extends WebPlugin implements NodeJSPlugin {
  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO', options);
    return options;
  }
}
