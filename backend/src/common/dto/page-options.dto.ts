import { IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PageOptionsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take: number = 10;

  @IsOptional()
  @IsEnum(Order)
  order: Order = Order.DESC;

  @IsOptional()
  searchKey?: string;

  get skip(): number {
    return (this.page - 1) * this.take;
  }
}
