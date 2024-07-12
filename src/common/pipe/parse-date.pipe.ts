import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';

@Injectable()
export class ParseDatePipe implements PipeTransform<string, Date> {
  protected readonly options?: { optional?: boolean };
  constructor(options?: { optional?: boolean }) {
    this.options = options;
  }

  transform(value: string, metadata: ArgumentMetadata) {
    if (this.options?.optional && value === undefined) {
      return;
    }

    const { data: fieldName } = metadata;
    const val = Date.parse(value);
    if (isNaN(val)) {
      throw new BadRequestException(`${fieldName} must be a valid date string`);
    }
    return new Date(val);
  }
}
