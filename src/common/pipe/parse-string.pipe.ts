import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';

type ParseStringPipeOptions = {
  optional?: boolean;
  minLength?: number;
  maxLength?: number;
};

@Injectable()
export class ParseStringPipe implements PipeTransform<string, string> {
  protected readonly options?: ParseStringPipeOptions;
  constructor(options?: ParseStringPipeOptions) {
    this.options = options;
  }

  transform(value: string, metadata: ArgumentMetadata) {
    if (this.options?.optional && value === undefined) {
      return;
    }

    const { data: fieldName } = metadata;
    if (this.options?.minLength && value.length < this.options.minLength) {
      throw new BadRequestException(
        `${fieldName} must be at least ${this.options.minLength} characters`,
      );
    }
    if (this.options?.maxLength && value.length > this.options.maxLength) {
      throw new BadRequestException(
        `${fieldName} must be at most ${this.options.maxLength} characters`,
      );
    }

    return value;
  }
}
