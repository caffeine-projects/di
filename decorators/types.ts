export type ClassDecorator = <TFunction extends Function>(target: TFunction, context: ClassDecoratorContext) => void
export type ClassMemberDecorator = <TFunction extends Function>(
  target: TFunction | undefined,
  context: ClassMemberDecoratorContext,
) => void
export type ClassMethodDecorator = <TFunction extends Function>(
  target: TFunction,
  context: ClassMethodDecoratorContext,
) => void
export type ClassGetterDecorator = <TFunction extends Function>(
  target: TFunction,
  context: ClassGetterDecoratorContext,
) => void
export type ClassSetterDecorator = <TFunction extends Function>(
  target: TFunction,
  context: ClassSetterDecoratorContext,
) => void
export type ClassFieldDecorator = (target: undefined, context: ClassFieldDecoratorContext) => void
