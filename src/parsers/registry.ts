import { BaseParser } from './base.parser';
import { PlaywrightParser } from './playwright.parser';
import { JestParser } from './jest.parser';
import { NewmanParser } from './newman.parser';
import { K6Parser } from './k6.parser';
import { JUnitParser } from './junit.parser';
import { CustomParser } from './custom.parser';
import { Framework } from '../core/types';

export class ParserRegistry {
  private parsers: BaseParser[];

  constructor(frameworks?: ('auto' | Framework)[]) {
    const all: BaseParser[] = [
      new PlaywrightParser(),
      new JestParser(),
      new NewmanParser(),
      new K6Parser(),
      new JUnitParser(),
      new CustomParser(),
    ];

    if (!frameworks || frameworks.includes('auto')) {
      this.parsers = all;
    } else {
      this.parsers = all.filter((p) => frameworks.includes(p.framework));
    }
  }

  detect(content: string): BaseParser | null {
    for (const parser of this.parsers) {
      if (parser.canParse(content)) {
        return parser;
      }
    }
    return null;
  }

  getAll(): BaseParser[] {
    return this.parsers;
  }
}
