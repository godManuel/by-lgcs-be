const advancedResults = (model, populate) => async (req, res, next) => {
  const reqQuery = { ...req.query };
  const removeFields = ["select", "sort", "limit", "page"];
  removeFields.forEach((param) => delete reqQuery[param]);

  let query;
  let useAggregate = false;
  let aggregatePipeline = [];

  // Case-insensitive search on serviceArea
  if (req.query.serviceArea) {
    const serviceArea = req.query.serviceArea;
    reqQuery["serviceArea"] = { $regex: serviceArea, $options: "i" };
  }

  if (req.query.applicantID) {
    const applicantID = req.query.applicantID;
    reqQuery["applicantID"] = { $regex: applicantID, $options: "i" };
  }

  // Handle name search with aggregation
  if (req.query.name) {
    useAggregate = true;

    const rawName = req.query.name.trim();
    const parts = rawName.split("-").filter(Boolean); // remove empty strings

    if (parts.length === 2) {
      // Full name search (first + last name)
      const fullNameRegex = `${parts[0]} ${parts[1]}`; // e.g., john doe
      aggregatePipeline.push({
        $match: {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: fullNameRegex,
              options: "i",
            },
          },
        },
      });
    } else {
      // Single name search (matches firstName or lastName)
      const name = parts[0];
      aggregatePipeline.push({
        $match: {
          $or: [
            { firstName: { $regex: name, $options: "i" } },
            { lastName: { $regex: name, $options: "i" } },
          ],
        },
      });
    }
  } else {
    // Regular query string filtering
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );
    query = model.find(JSON.parse(queryStr));
  }

  // Select fields
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    if (useAggregate) {
      aggregatePipeline.push({
        $project: fields.split(" ").reduce((acc, field) => {
          acc[field] = 1;
          return acc;
        }, {}),
      });
    } else {
      query = query.select(fields);
    }
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    if (useAggregate) {
      aggregatePipeline.push({
        $sort: sortBy.split(" ").reduce((acc, field) => {
          const direction = field.startsWith("-") ? -1 : 1;
          acc[field.replace("-", "")] = direction;
          return acc;
        }, {}),
      });
    } else {
      query = query.sort(sortBy);
    }
  } else {
    if (useAggregate) {
      aggregatePipeline.push({ $sort: { createdAt: -1 } });
    } else {
      query = query.sort("-createdAt");
    }
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 100;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  if (useAggregate) {
    const total = await model.countDocuments();
    aggregatePipeline.push({ $skip: startIndex }, { $limit: limit });

    const results = await model.aggregate(aggregatePipeline);

    const pagination = {};
    if (endIndex < total) pagination.next = { page: page + 1, limit };
    if (startIndex > 0) pagination.prev = { page: page - 1, limit };

    res.advancedResults = {
      success: true,
      nbHits: results.length,
      pagination,
      data: results,
    };
  } else {
    const total = await model.countDocuments();
    query = query.skip(startIndex).limit(limit);
    if (populate) query = query.populate(populate);

    const results = await query;

    const pagination = {};
    if (endIndex < total) pagination.next = { page: page + 1, limit };
    if (startIndex > 0) pagination.prev = { page: page - 1, limit };

    res.advancedResults = {
      success: true,
      nbHits: results.length,
      pagination,
      data: results,
    };
  }

  next();
};

module.exports = advancedResults;
