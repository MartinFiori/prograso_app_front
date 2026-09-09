export type ApiPagination = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type ApiResponse<T> = {
  data: T;
  statusCode: number;
  status: "success";
  description: string;
  pagination?: ApiPagination;
};

export type ApiValidationIssue = {
  path: string;
  message: string;
};

export type ApiErrorResponse = {
  status: "error";
  statusCode: number;
  description: string;
  errorCode: string;
  data: ApiValidationIssue[] | null;
};
