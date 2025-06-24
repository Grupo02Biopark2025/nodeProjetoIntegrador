export const successResponse = (res, data = null, message = 'Operação realizada com sucesso') => {
  return res.status(200).json({
    success: true,
    message,
    data
  });
};

export const errorResponse = (res, message = 'Erro interno do servidor', status = 500) => {
  return res.status(status).json({
    success: false,
    message
  });
};

export const paginatedResponse = (res, data, page, limit, total) => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
      totalItems: total,
      totalPages: Math.ceil(total / limit)
    }
  });
};