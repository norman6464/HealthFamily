/**
 * ドメイン例外の基底クラスと共通例外定義
 */

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/** リソースが見つからない */
export class NotFoundError extends DomainError {}

/** リソースが重複している */
export class ConflictError extends DomainError {}

/** バリデーションエラー */
export class ValidationError extends DomainError {}
