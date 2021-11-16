import { FieldError } from "../generated/graphql";

export const mapFieldErrors = (errors: FieldError[]): {[key: string]: string} => {
  return errors.reduce((accumulatedErrorsObject, error) => {
    return {
      ...accumulatedErrorsObject,
      [error.field]: error.message
    }
  }, {})
}