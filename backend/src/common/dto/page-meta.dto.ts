export class PageMetaDto {
  readonly page: number;
  readonly take: number;
  readonly itemCount: number;
  readonly pageCount: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;

  constructor(params: {
    pageOptions: { page: number; take: number };
    itemCount: number;
  }) {
    this.page = params.pageOptions.page;
    this.take = params.pageOptions.take;
    this.itemCount = params.itemCount;
    this.pageCount = Math.ceil(params.itemCount / params.pageOptions.take);
    this.hasPreviousPage = params.pageOptions.page > 1;
    this.hasNextPage = params.pageOptions.page < this.pageCount;
  }
}
