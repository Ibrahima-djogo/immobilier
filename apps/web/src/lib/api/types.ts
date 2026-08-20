export type ApiFieldError = {
  field: string;
  message: string;
};

export type ApiErrorPayload = {
  code?: string;
  message?: string;
  errors?: ApiFieldError[];
  traceId?: string;
};

export type PaginatedResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors: ApiFieldError[];
  readonly traceId?: string;

  constructor(
    message: string,
    options: {
      status: number;
      code?: string;
      fieldErrors?: ApiFieldError[];
      traceId?: string;
    },
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options.status;
    this.code = options.code;
    this.fieldErrors = options.fieldErrors ?? [];
    this.traceId = options.traceId;
  }
}
