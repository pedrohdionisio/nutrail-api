import 'reflect-metadata';
import type { ZodType } from 'zod';

const SCHEMA_KEY = Symbol('schema');

export function Schema(schema: ZodType): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(SCHEMA_KEY, schema, target);
  };
}

export function getSchema(target: object): ZodType | undefined {
  return Reflect.getMetadata(SCHEMA_KEY, target);
}
