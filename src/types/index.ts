export type ApiResponse<T> = {
  data: T;
  statusCode: number;
  status: "success";
};
