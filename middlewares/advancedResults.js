const advancedResults = (model, populate) => async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 100;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const aggregatePipeline = [];

  // ===========================
  // Universal Search
  // ===========================
  if (req.query.search) {
    const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const rawSearch = req.query.search.trim();

    const searchTerms = rawSearch
      .split(/[\s-]+/)
      .filter(Boolean)
      .map(escapeRegex);

    aggregatePipeline.push({
      $match: {
        $or: [
          {
            applicantID: {
              $regex: escapeRegex(rawSearch),
              $options: "i",
            },
          },
          {
            $and: searchTerms.map((term) => ({
              $or: [
                {
                  firstName: {
                    $regex: term,
                    $options: "i",
                  },
                },
                {
                  middleName: {
                    $regex: term,
                    $options: "i",
                  },
                },
                {
                  lastName: {
                    $regex: term,
                    $options: "i",
                  },
                },
              ],
            })),
          },
        ],
      },
    });
  }

  // ===========================
  // Gender Filter
  // ===========================
  if (req.query.gender) {
    aggregatePipeline.push({
      $match: {
        gender: {
          $regex: `^${req.query.gender}$`,
          $options: "i",
        },
      },
    });
  }

  // ===========================
  // Department Filter
  // ===========================
  if (req.query.department) {
    aggregatePipeline.push({
      $match: {
        department: {
          $regex: req.query.department,
          $options: "i",
        },
      },
    });
  }

  // ===========================
  // Field Selection
  // ===========================
  if (req.query.select) {
    const fields = req.query.select.split(",");

    aggregatePipeline.push({
      $project: fields.reduce((acc, field) => {
        acc[field] = 1;
        return acc;
      }, {}),
    });
  }

  // ===========================
  // Sorting
  // ===========================
  if (req.query.sort) {
    const sort = {};

    req.query.sort.split(",").forEach((field) => {
      if (field.startsWith("-")) {
        sort[field.substring(1)] = -1;
      } else {
        sort[field] = 1;
      }
    });

    aggregatePipeline.push({
      $sort: sort,
    });
  } else {
    aggregatePipeline.push({
      $sort: {
        createdAt: -1,
      },
    });
  }

  // ===========================
  // Total Count
  // ===========================
  const countPipeline = [...aggregatePipeline];

  const totalResult = await model.aggregate([
    ...countPipeline,
    {
      $count: "total",
    },
  ]);

  const total = totalResult.length ? totalResult[0].total : 0;

  // ===========================
  // Pagination
  // ===========================
  aggregatePipeline.push(
    {
      $skip: startIndex,
    },
    {
      $limit: limit,
    },
  );

  const results = await model.aggregate(aggregatePipeline);

  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.advancedResults = {
    success: true,
    total,
    nbHits: results.length,
    pagination,
    data: results,
  };

  next();
};

module.exports = advancedResults;
