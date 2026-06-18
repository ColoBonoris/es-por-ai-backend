import {
  createPaginationMeta,
  normalizePagination
} from "@/domain/common/pagination";

describe("pagination helpers", () => {
  it("normalizes invalid page inputs", () => {
    expect(normalizePagination({ page: -2, pageSize: 0 })).toEqual({
      page: 1,
      pageSize: 1,
      skip: 0
    });
  });

  it("caps page size and calculates metadata", () => {
    expect(normalizePagination({ page: 3, pageSize: 250 })).toEqual({
      page: 3,
      pageSize: 100,
      skip: 200
    });
    expect(createPaginationMeta(2, 10, 25)).toEqual({
      page: 2,
      pageSize: 10,
      total: 25,
      totalPages: 3
    });
  });
});
