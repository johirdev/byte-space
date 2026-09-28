import { NextRequest } from "next/server";
import { route, readJson } from "./catchAsync";
import { sendResponse } from "./sendResponse";
import { requireAuth, CONTENT_EDITORS, PANEL_VIEWERS } from "./tokenRoleAccess";
import { bool, paginationOf } from "./validate";
import type { QueryFilter, SortOrder } from "mongoose";

type CrudService<T> = {
  list: (args?: {
    filter?: QueryFilter<T>;
    sort?: Record<string, SortOrder>;
    page?: number;
    limit?: number;
    all?: boolean;
  }) => Promise<{ data: T[]; meta: ReturnType<typeof import("./sendResponse").buildMeta> }>;
  getById: (id: string) => Promise<T>;
  create: (body: Record<string, unknown>) => Promise<T>;
  update: (id: string, body: Record<string, unknown>) => Promise<T>;
  remove: (id: string) => Promise<T>;
};

type CollectionOptions<T> = {
  service: CrudService<T>;
  /** Singular, capitalised — used in response messages. */
  label: string;
  /** Plural, capitalised. */
  labelPlural: string;
  /** Builds the public (unauthenticated) filter from the query string. */
  publicFilter?: (params: URLSearchParams) => QueryFilter<T>;
  /** Builds the admin filter from the query string. */
  adminFilter?: (params: URLSearchParams) => QueryFilter<T>;
  sort?: Record<string, SortOrder>;
  defaultLimit?: number;
};

/**
 * `GET` is public (visitors read published content); `POST` requires a
 * content editor. Pass `?all=true` with an admin token to skip pagination.
 */
export function collectionRoute<T>(options: CollectionOptions<T>) {
  const {
    service,
    label,
    labelPlural,
    publicFilter,
    adminFilter,
    sort,
    defaultLimit = 50,
  } = options;

  const GET = route(async (req: NextRequest) => {
    const params = req.nextUrl.searchParams;
    const isAdmin = req.headers.has("authorization") || req.cookies.has("access_token");

    const filter = isAdmin
      ? (adminFilter?.(params) ?? publicFilter?.(params) ?? {})
      : (publicFilter?.(params) ?? {});

    const { page, limit } = paginationOf(params, { limit: defaultLimit });
    const all = bool(params.get("all")) || !params.has("page");

    const { data, meta } = await service.list({ filter, sort, page, limit, all });

    return sendResponse({
      statusCode: 200,
      success: true,
      message: `${labelPlural} fetched successfully`,
      data,
      meta,
    });
  });

  const POST = route(async (req: NextRequest) => {
    requireAuth(req, CONTENT_EDITORS);
    const body = await readJson(req);
    const created = await service.create(body);

    return sendResponse({
      statusCode: 201,
      success: true,
      message: `${label} created successfully`,
      data: created,
    });
  });

  return { GET, POST };
}

type ItemOptions<T> = {
  service: CrudService<T>;
  label: string;
};

/** `GET` public, `PATCH`/`DELETE` restricted to content editors. */
export function itemRoute<T>({ service, label }: ItemOptions<T>) {
  type Ctx = { params: Promise<{ id: string }> };

  const GET = route<Ctx>(async (_req, { params }) => {
    const { id } = await params;
    const data = await service.getById(id);

    return sendResponse({
      statusCode: 200,
      success: true,
      message: `${label} fetched successfully`,
      data,
    });
  });

  const PATCH = route<Ctx>(async (req, { params }) => {
    requireAuth(req, CONTENT_EDITORS);
    const { id } = await params;
    const body = await readJson(req);
    const data = await service.update(id, body);

    return sendResponse({
      statusCode: 200,
      success: true,
      message: `${label} updated successfully`,
      data,
    });
  });

  const DELETE = route<Ctx>(async (req, { params }) => {
    requireAuth(req, CONTENT_EDITORS);
    const { id } = await params;
    const data = await service.remove(id);

    return sendResponse({
      statusCode: 200,
      success: true,
      message: `${label} deleted successfully`,
      data,
    });
  });

  return { GET, PATCH, DELETE };
}

/** `PATCH /reorder` — accepts `{ items: [{ id, order }] }`. */
export function reorderRoute(
  reorder: (items: { id: string; order: number }[]) => Promise<number>,
  labelPlural: string,
) {
  return route(async (req: NextRequest) => {
    requireAuth(req, CONTENT_EDITORS);
    const body = await readJson<{ items?: { id: string; order: number }[] }>(req);

    const items = (body.items ?? [])
      .filter((i) => typeof i?.id === "string")
      .map((i, index) => ({ id: i.id, order: Number(i.order) || index }));

    const count = await reorder(items);

    return sendResponse({
      statusCode: 200,
      success: true,
      message: `${labelPlural} reordered`,
      data: { updated: count },
    });
  });
}

export { requireAuth, PANEL_VIEWERS, CONTENT_EDITORS };
