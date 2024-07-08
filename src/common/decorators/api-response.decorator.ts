import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import {
  BaseResponseEntity,
  NullResponseEntity,
} from '../entities/api-response.entity';

export const ApiBaseResponse = <TModel extends Type<any>>(
  model?: TModel,
  type: 'string' | 'array' | 'object' = 'object',
) => {
  if (!model) {
    return ApiOkResponse({ type: NullResponseEntity });
  }

  return applyDecorators(
    ApiExtraModels(BaseResponseEntity, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(BaseResponseEntity) },
          {
            properties: {
              data: {
                type: type,
                $ref:
                  type === 'object' && model ? getSchemaPath(model) : undefined,
                items:
                  type === 'array' && model
                    ? { $ref: getSchemaPath(model) }
                    : undefined,
              },
            },
          },
        ],
      },
    }),
  );
};
