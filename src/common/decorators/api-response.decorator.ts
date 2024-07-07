import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { ResponseEntity } from '../entities/api-response.entity';

export const ApiResponse = <TModel extends Type<any>>(
  model?: TModel,
  type = 'string',
) => {
  return applyDecorators(
    ApiExtraModels(ResponseEntity, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseEntity) },
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
