import math


def page_response(queryset, page: int, size: int, serializer_class, serializer_kwargs=None):
    serializer_kwargs = serializer_kwargs or {}
    total = queryset.count()
    total_pages = max(1, math.ceil(total / size)) if total > 0 else 1
    offset = page * size

    items = queryset.skip(offset).limit(size)
    serializer = serializer_class(items, many=True, **serializer_kwargs)

    return {
        "content": serializer.data,
        "page": page,
        "size": size,
        "totalElements": total,
        "totalPages": total_pages,
        "first": page == 0,
        "last": page >= total_pages - 1,
        "empty": total == 0,
    }
