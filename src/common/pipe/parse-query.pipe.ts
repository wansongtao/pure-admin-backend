import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { BaseQueryDto } from '../dto/base-query.dto';

interface Options {
  type: 'number' | 'date' | 'string' | 'enum' | 'boolean';
  enum?: any[];
  default?: string | number | boolean | Date;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}
type ParseQueryPipeOptions<T extends string> = Record<T, Options>;

@Injectable()
export class ParseQueryPipe<T extends string> implements PipeTransform {
  protected readonly defaultOptions: Record<keyof BaseQueryDto, Options> = {
    page: { type: 'number', default: 1, min: 1, max: 10000 },
    pageSize: { type: 'number', default: 10, min: 1, max: 10000 },
    beginTime: { type: 'date' },
    endTime: { type: 'date' },
    sort: { type: 'enum', enum: ['asc', 'desc'], default: 'desc' },
  };
  protected readonly options: Record<string, Options>;

  constructor(
    options?: ParseQueryPipeOptions<T>,
    isMergeDefaultOptions = true,
  ) {
    if (isMergeDefaultOptions) {
      this.options = { ...this.defaultOptions, ...options };
      return;
    }
    this.options = options;
  }

  strategies(value: string, key: string) {
    const option = this.options[key];

    const strategies: Record<
      Options['type'],
      () => [error?: BadRequestException, result?: Options['default']]
    > = {
      number: () => {
        const n = parseInt(value, 10);
        if (isNaN(n)) {
          return [new BadRequestException(`${key} must be a number`)];
        }
        if (option.min && n < option.min) {
          return [
            new BadRequestException(
              `${key} must be greater than ${option.min}`,
            ),
          ];
        }
        if (option.max && n > option.max) {
          return [
            new BadRequestException(`${key} must be less than ${option.max}`),
          ];
        }
        return [undefined, n];
      },
      string: () => {
        if (option.minLength && value.length < option.minLength) {
          return [
            new BadRequestException(
              `${key} length must be greater than ${option.minLength}`,
            ),
          ];
        }
        if (option.maxLength && value.length > option.maxLength) {
          return [
            new BadRequestException(
              `${key} length must be less than ${option.maxLength}`,
            ),
          ];
        }
        return [undefined, value];
      },
      enum: () => {
        const enums = option.enum;
        if (!enums.includes(value)) {
          return [
            new BadRequestException(`${key} must be one of ${enums.join(',')}`),
          ];
        }
        return [undefined, value];
      },
      boolean: () => {
        if (
          value !== 'true' &&
          value !== 'false' &&
          value !== '1' &&
          value !== '0'
        ) {
          return [new BadRequestException(`${key} must be a boolean`)];
        }
        return [undefined, value === 'true' || value === '1'];
      },
      date: () => {
        const d = Date.parse(value);
        if (isNaN(d)) {
          return [
            new BadRequestException(`${key} must be a valid date string`),
          ];
        }
        return [undefined, new Date(d)];
      },
    };

    return strategies[option.type]();
  }

  transform(value: Record<string, any>, metadata: ArgumentMetadata) {
    if (metadata.type !== 'query') {
      return value;
    }

    const query: Record<string, Options['default']> = {};
    const keys = Object.keys(this.options);

    keys.forEach((key) => {
      const option = this.options[key];
      const v = value[key];

      if (v === undefined || v === '') {
        if (option.default !== undefined) {
          query[key] = option.default;
        } else if (option.required) {
          throw new BadRequestException(`${key} is required`);
        }
        return;
      }

      const [error, result] = this.strategies(v, key);
      if (error) {
        throw error;
      }
      query[key] = result;
    });

    return query;
  }
}
